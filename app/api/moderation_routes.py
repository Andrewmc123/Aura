"""Moderation API — block users, report content, and (for admins) review reports."""
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_, and_

from app.models import (
    db, User, Post, Comment, Message, Story, Product, Follow, Friend,
    Notification, Block, Report,
)
from app.safety import is_admin

moderation_routes = Blueprint('moderation', __name__)

REPORT_REASONS = {
    'spam', 'harassment', 'hate', 'nudity', 'violence', 'self_harm',
    'illegal', 'minor_safety', 'impersonation', 'other',
}
_TARGETS = {
    'post': (Post, 'user_id'),
    'comment': (Comment, 'user_id'),
    'message': (Message, 'sender_id'),
    'story': (Story, 'user_id'),
    'product': (Product, 'seller_id'),
}


# ---------- blocking ----------

@moderation_routes.route('/blocks')
@login_required
def my_blocks():
    """People the current user has blocked."""
    rows = Block.query.filter_by(blocker_id=current_user.id)\
        .order_by(Block.created_at.desc()).all()
    return jsonify({
        'blocked': [
            {'id': r.blocked.id, 'username': r.blocked.username,
             'profile_img': r.blocked.profile_img}
            for r in rows if r.blocked
        ],
        'blocked_ids': [r.blocked_id for r in rows],
    })


@moderation_routes.route('/blocks/<int:user_id>', methods=['POST'])
@login_required
def block_user(user_id):
    """Block someone. Their content disappears from your feeds straight away,
    they can no longer message you, and any follow/friend link is removed."""
    me = current_user.id
    if user_id == me:
        return jsonify({'error': "You can't block yourself"}), 400
    if not User.query.get(user_id):
        return jsonify({'error': 'User not found'}), 404

    if not Block.query.filter_by(blocker_id=me, blocked_id=user_id).first():
        db.session.add(Block(blocker_id=me, blocked_id=user_id))

    Follow.query.filter(
        or_(
            and_(Follow.follower_id == me, Follow.followed_id == user_id),
            and_(Follow.follower_id == user_id, Follow.followed_id == me),
        )
    ).delete(synchronize_session=False)
    Friend.query.filter(
        or_(
            and_(Friend.user_id == me, Friend.friend_id == user_id),
            and_(Friend.user_id == user_id, Friend.friend_id == me),
        )
    ).delete(synchronize_session=False)
    Notification.query.filter_by(recipient_id=me, sender_id=user_id)\
        .delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'ok': True, 'blocked_id': user_id})


@moderation_routes.route('/blocks/<int:user_id>', methods=['DELETE'])
@login_required
def unblock_user(user_id):
    Block.query.filter_by(blocker_id=current_user.id, blocked_id=user_id)\
        .delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'ok': True, 'unblocked_id': user_id})


# ---------- reporting ----------

@moderation_routes.route('/reports', methods=['POST'])
@login_required
def create_report():
    """Report a post, comment, message, story, product or account."""
    data = request.get_json(silent=True) or {}
    target_type = data.get('target_type')
    try:
        target_id = int(data.get('target_id'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Nothing to report'}), 400

    if target_type == 'user':
        if not User.query.get(target_id):
            return jsonify({'error': 'User not found'}), 404
        reported_user_id = target_id
    elif target_type in _TARGETS:
        model, owner_attr = _TARGETS[target_type]
        target = model.query.get(target_id)
        if not target:
            return jsonify({'error': 'That content no longer exists'}), 404
        reported_user_id = getattr(target, owner_attr)
    else:
        return jsonify({'error': 'Unknown report type'}), 400

    reason = data.get('reason') if data.get('reason') in REPORT_REASONS else 'other'
    report = Report(
        reporter_id=current_user.id,
        target_type=target_type,
        target_id=target_id,
        reported_user_id=reported_user_id,
        reason=reason,
        details=(data.get('details') or '').strip()[:500] or None,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'ok': True, 'id': report.id}), 201


# ---------- admin review (accounts listed in ADMIN_EMAILS) ----------

def _describe(report):
    """A short preview of the reported content for the review queue."""
    if report.target_type == 'user':
        u = User.query.get(report.target_id)
        if not u:
            return {'text': None, 'media': None, 'gone': True}
        return {'text': f'@{u.username} — {u.bio or ""}', 'media': u.profile_img}
    model, _ = _TARGETS.get(report.target_type, (None, None))
    target = model.query.get(report.target_id) if model else None
    if not target:
        return {'text': None, 'media': None, 'gone': True}
    text = None
    for attr in ('body', 'content', 'caption', 'text', 'title'):
        text = text or getattr(target, attr, None)
    media = None
    for attr in ('video_url', 'image_url', 'media_url', 'gif_url'):
        media = media or getattr(target, attr, None)
    return {'text': text, 'media': media}


@moderation_routes.route('/reports')
@login_required
def list_reports():
    if not is_admin():
        return jsonify({'error': 'Not allowed'}), 403
    status = request.args.get('status', 'open')
    q = Report.query
    if status != 'all':
        q = q.filter_by(status=status)
    reports = q.order_by(Report.created_at.desc()).limit(200).all()
    out = []
    for r in reports:
        owner = User.query.get(r.reported_user_id) if r.reported_user_id else None
        out.append({
            **r.to_dict(),
            'preview': _describe(r),
            'reported_user': owner.username if owner else None,
        })
    return jsonify({'reports': out})


@moderation_routes.route('/reports/<int:report_id>', methods=['POST'])
@login_required
def resolve_report(report_id):
    """action = 'dismiss' | 'remove' (delete the content) | 'ban' (delete the
    content owner's whole account)."""
    if not is_admin():
        return jsonify({'error': 'Not allowed'}), 403
    report = Report.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    action = (request.get_json(silent=True) or {}).get('action')
    target_type, target_id = report.target_type, report.target_id
    now = datetime.utcnow()

    if action == 'dismiss':
        report.status = 'dismissed'
        report.resolved_at = now
        db.session.commit()
        return jsonify({'ok': True, 'status': 'dismissed'})

    if action == 'remove':
        if target_type in _TARGETS:
            model, _ = _TARGETS[target_type]
            target = model.query.get(target_id)
            if target:
                if target_type == 'post':
                    Notification.query.filter_by(post_id=target.id).delete(synchronize_session=False)
                    Message.query.filter_by(post_id=target.id).update(
                        {'post_id': None}, synchronize_session=False)
                if target_type == 'comment':
                    Notification.query.filter_by(comment_id=target.id).delete(synchronize_session=False)
                db.session.delete(target)
    elif action == 'ban':
        from app.api.auth_routes import purge_user
        banned_id = report.reported_user_id
        if not banned_id or banned_id == current_user.id:
            return jsonify({'error': "That account can't be removed"}), 400
        purge_user(banned_id)
        # every report about that account or its content is now settled
        Report.query.filter_by(reported_user_id=banned_id, status='open').update(
            {'status': 'removed', 'resolved_at': now}, synchronize_session=False)
    else:
        return jsonify({'error': 'Unknown action'}), 400

    # close every open report about the same thing
    Report.query.filter_by(target_type=target_type, target_id=target_id, status='open').update(
        {'status': 'removed', 'resolved_at': now}, synchronize_session=False)
    db.session.commit()
    return jsonify({'ok': True, 'status': 'removed'})
