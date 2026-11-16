"""
File upload API — stores videos, images, GIFs and audio recorded or chosen
in the Upload Studio.

Two storage modes:
  * Cloud bucket (production): when the S3_* env vars are set, files go to an
    S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze B2 ...) and the
    returned URL points at the bucket's public address. Files survive
    redeploys and restarts.
  * Local disk (development): files are saved under app/uploads/ and served
    at /uploads/<name>. On a host like Render this folder is wiped on every
    deploy, so it is only suitable for local work.
"""
import os
import uuid

from flask import Blueprint, request, current_app
from flask_login import login_required

upload_routes = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {
    # video
    'mp4', 'webm', 'mov', 'm4v', 'ogv',
    # image
    'png', 'jpg', 'jpeg', 'gif', 'webp',
    # audio
    'mp3', 'wav', 'ogg', 'm4a', 'weba',
}

MIME_FALLBACK_EXT = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/webm': 'weba',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
}

CONTENT_TYPES = {
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
    'm4v': 'video/x-m4v', 'ogv': 'video/ogg',
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp',
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
    'm4a': 'audio/mp4', 'weba': 'audio/webm',
}

_s3_client = None


def cloud_storage_configured():
    return all(os.environ.get(k) for k in (
        'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_URL'))


def _s3():
    global _s3_client
    if _s3_client is None:
        import boto3
        from botocore.config import Config as BotoConfig
        _s3_client = boto3.client(
            's3',
            endpoint_url=os.environ.get('S3_ENDPOINT_URL') or None,
            region_name=os.environ.get('S3_REGION') or 'auto',
            aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY'],
            config=BotoConfig(signature_version='s3v4', retries={'max_attempts': 3}),
        )
    return _s3_client


def upload_dir():
    path = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(path, exist_ok=True)
    return path


@upload_routes.route('', methods=['POST'])
@upload_routes.route('/', methods=['POST'])
@login_required
def upload_file():
    """
    Accepts multipart form-data with a 'file' field.
    Returns {url} pointing at the stored file.
    """
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    file = request.files['file']
    if not file or file.filename == '':
        return {'error': 'No file selected'}, 400

    ext = ''
    if '.' in file.filename:
        ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = MIME_FALLBACK_EXT.get((file.mimetype or '').split(';')[0], '')
    if ext not in ALLOWED_EXTENSIONS:
        return {'error': f'File type not supported. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}, 400

    name = f'{uuid.uuid4().hex}.{ext}'

    if cloud_storage_configured():
        try:
            _s3().upload_fileobj(
                file.stream,
                os.environ['S3_BUCKET'],
                name,
                ExtraArgs={
                    'ContentType': CONTENT_TYPES.get(ext, 'application/octet-stream'),
                    'CacheControl': 'public, max-age=31536000, immutable',
                },
            )
        except Exception:
            current_app.logger.exception('Cloud upload failed')
            return {'error': 'Upload failed. Please try again.'}, 502
        url = f"{os.environ['S3_PUBLIC_URL'].rstrip('/')}/{name}"
    else:
        file.save(os.path.join(upload_dir(), name))
        url = f'/uploads/{name}'

    kind = 'video' if ext in {'mp4', 'webm', 'mov', 'm4v', 'ogv'} else (
        'audio' if ext in {'mp3', 'wav', 'ogg', 'm4a', 'weba'} else 'image')

    return {'url': url, 'media_kind': kind}, 201
