import os
from datetime import timedelta
from flask import Flask, send_from_directory, redirect, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_login import LoginManager, current_user
from .models import db, User
from .api.user_routes import user_routes
from .api.auth_routes import auth_routes
from .api.friend_routes import friend_routes
from .api.notification_routes import notification_routes
from .api.likes_routes import likes_routes
from .api.comments_routes import comments_routes
from .api.post_routes import post_routes
from .api.story_routes import story_routes
from .api.follow_routes import follow_routes
from .api.bookmark_routes import bookmark_routes
from .api.gif_routes import gif_routes
from .api.discover_routes import discover_routes
from .api.upload_routes import upload_routes
#from .api.camera_routes import camera_routes
from .api.vault_routes import vault_routes
from .api.message_routes import message_routes
from .api.live_routes import live_routes
from .api.wallet_routes import wallet_routes
from .api.shop_routes import shop_routes
from .api.group_routes import group_routes
from .api.settings_routes import settings_routes
from .api.moderation_routes import moderation_routes
from .features import demo_payments_enabled, support_email, minimum_age
from .seeds import seed_commands
from .config import Config

app = Flask(__name__, static_folder='../react-vite/dist', static_url_path='/')
login = LoginManager(app)
login.login_view = 'auth.unauthorized'

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

app.cli.add_command(seed_commands)
app.config.from_object(Config)

IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production'
if IS_PRODUCTION and not app.config.get('SECRET_KEY'):
    raise RuntimeError('SECRET_KEY must be set in production.')

# Session + "remember me" cookies: HTTPS-only in production, never readable by
# page scripts, and long-lived so people stay signed in between app launches.
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
    REMEMBER_COOKIE_HTTPONLY=True,
    REMEMBER_COOKIE_SAMESITE='Lax',
    REMEMBER_COOKIE_SECURE=IS_PRODUCTION,
    REMEMBER_COOKIE_DURATION=timedelta(days=60),
)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB uploads

app.register_blueprint(user_routes, url_prefix='/api/users')
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(friend_routes, url_prefix='/api/friends')
app.register_blueprint(notification_routes, url_prefix='/api/notifications')
app.register_blueprint(likes_routes, url_prefix='/api/likes')
app.register_blueprint(comments_routes, url_prefix='/api/comments')
app.register_blueprint(post_routes, url_prefix='/api/posts')
app.register_blueprint(story_routes, url_prefix='/api/stories')
app.register_blueprint(follow_routes, url_prefix='/api/follows')
app.register_blueprint(bookmark_routes, url_prefix='/api/bookmarks')
app.register_blueprint(gif_routes, url_prefix='/api/gifs')
app.register_blueprint(discover_routes, url_prefix='/api/discover')
app.register_blueprint(upload_routes, url_prefix='/api/uploads')
#app.register_blueprint(camera_routes, url_prefix='/api/camera')
app.register_blueprint(vault_routes, url_prefix='/api/vault')
app.register_blueprint(message_routes, url_prefix='/api/messages')
app.register_blueprint(live_routes, url_prefix='/api/live')
app.register_blueprint(wallet_routes, url_prefix='/api/wallet')
app.register_blueprint(shop_routes, url_prefix='/api/shop')
app.register_blueprint(group_routes, url_prefix='/api/groups')
app.register_blueprint(settings_routes, url_prefix='/api/settings')
app.register_blueprint(moderation_routes, url_prefix='/api/moderation')

db.init_app(app)
Migrate(app, db)

# The web app and API share one origin, so cross-origin access is only opened
# up in development (Vite dev server) or for origins listed in CORS_ORIGINS.
_cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
if _cors_origins:
    CORS(app, origins=_cors_origins, supports_credentials=True)
elif not IS_PRODUCTION:
    CORS(app)

@app.before_request
def https_redirect():
    if os.environ.get('FLASK_ENV') == 'production':
        if request.headers.get('X-Forwarded-Proto') == 'http':
            url = request.url.replace('http://', 'https://', 1)
            code = 301
            return redirect(url, code=code)


@app.before_request
def track_presence():
    """Keep last_seen fresh for whoever is signed in, so the online dots in
    the sidebar reflect real activity rather than just a live session cookie.
    touch_presence() rate-limits the write to once a minute."""
    if current_user.is_authenticated and current_user.touch_presence():
        db.session.commit()


@app.after_request
def inject_csrf_token(response):
    response.set_cookie(
        'csrf_token',
        generate_csrf(),
        secure=True if os.environ.get('FLASK_ENV') == 'production' else False,
        samesite='Strict' if os.environ.get(
            'FLASK_ENV') == 'production' else None,
        httponly=True)
    return response


@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """
    Serves user-uploaded media (videos, covers, recorded audio).
    """
    uploads = os.path.join(app.root_path, 'uploads')
    return send_from_directory(uploads, filename, conditional=True)


@app.route('/api/health')
def health():
    """Health check — confirms the server is up AND the database answers."""
    try:
        db.session.execute('SELECT 1')
    except Exception:
        db.session.rollback()
        app.logger.exception('Health check: database unreachable')
        return {'status': 'error', 'database': 'unreachable'}, 503
    return {
        'status': 'ok',
        'database': db.engine.dialect.name,
        'persistent': db.engine.dialect.name != 'sqlite',
    }


@app.route('/api/config')
def public_config():
    """Public launch settings the app reads on boot."""
    try:
        demo_available = User.query.filter_by(email='demo@aa.io').first() is not None
    except Exception:
        db.session.rollback()
        demo_available = False
    return {
        'demo_available': demo_available,
        'purchases_enabled': demo_payments_enabled(),
        'support_email': support_email(),
        'minimum_age': minimum_age(),
    }


@app.route("/api/docs")
def api_help():
    """
    Returns all API routes and their doc strings
    """
    if IS_PRODUCTION:
        return {'message': 'Not available'}, 404
    acceptable_methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    route_list = { rule.rule: [[ method for method in rule.methods if method in acceptable_methods ],
                    app.view_functions[rule.endpoint].__doc__ ]
                    for rule in app.url_map.iter_rules() if rule.endpoint != 'static' }
    return route_list


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def react_root(path):
    """
    This route will direct to the public directory in our
    react builds in the production environment for favicon
    or index.html requests
    """
    if path == 'favicon.ico':
        return app.send_from_directory('public', 'favicon.ico')
    return app.send_static_file('index.html')


@app.errorhandler(404)
def not_found(e):
    # Unknown API paths get a real JSON 404; everything else is a page route
    # handled by the React router.
    if request.path.startswith('/api/'):
        return {'errors': {'message': 'Not found'}}, 404
    return app.send_static_file('index.html')


@app.errorhandler(413)
def too_large(e):
    return {'error': 'That file is too large. The limit is 100MB.'}, 413


@app.errorhandler(500)
def server_error(e):
    db.session.rollback()
    return {'errors': {'message': 'Something went wrong. Please try again.'}}, 500
