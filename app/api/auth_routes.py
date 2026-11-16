from datetime import date, datetime

from flask import Blueprint, request
from sqlalchemy import or_
from app.models import (
    User, db, Notification, Message, ProfileVisit, Product,
    LiveSession, LiveViewer, LiveMessage, LiveReport,
    Group, GroupMember, GroupMessage, Order, Block, Report,
)
from app.forms import LoginForm
from app.forms import SignUpForm
from app.features import minimum_age
from app.safety import find_objectionable, is_admin
from flask_login import current_user, login_user, logout_user, login_required

auth_routes = Blueprint('auth', __name__)

MIN_PASSWORD_LENGTH = 8


def session_payload(user):
    """The signed-in user's own data, plus whether they can review reports."""
    data = user.to_dict()
    data['is_admin'] = is_admin(user)
    return data


def _age_on(birthdate, today=None):
    today = today or date.today()
    return today.year - birthdate.year - (
        (today.month, today.day) < (birthdate.month, birthdate.day))


@auth_routes.route('/')
def authenticate():
    """
    Authenticates a user.
    """
    if current_user.is_authenticated:
        return session_payload(current_user)
    return {'errors': {'message': 'Unauthorized'}}, 401


@auth_routes.route('/login', methods=['POST'])
def login():
    form = LoginForm()
    # Get the csrf_token from the request cookie and put it into the
    # form manually to validate_on_submit can be used
    form['csrf_token'].data = request.cookies.get('csrf_token')
    if form.validate_on_submit():
        # Add the user to the session, we are logged in!
        user = User.query.filter(User.email == form.data['email']).first()
        # remember=True keeps people signed in between app launches
        login_user(user, remember=True)
        return session_payload(user)
    return form.errors, 401


@auth_routes.route('/logout')
def logout():
    """
    Logs a user out
    """
    logout_user()
    return {'message': 'User logged out'}


@auth_routes.route('/signup', methods=['POST'])
def sign_up():
    form = SignUpForm()
    form['csrf_token'].data = request.cookies.get('csrf_token')
    data = request.get_json(silent=True) or {}

    errors = {}
    if not data.get('agreed_terms'):
        errors['agreed_terms'] = ['You need to agree to the Terms and Community Guidelines.']
    if len(data.get('password') or '') < MIN_PASSWORD_LENGTH:
        errors['password'] = [f'Password must be at least {MIN_PASSWORD_LENGTH} characters.']
    if find_objectionable(data.get('username'), data.get('firstname'), data.get('lastname')):
        errors['username'] = ["That name isn't allowed. Please choose another."]

    birthdate = None
    try:
        birthdate = datetime.strptime((data.get('birthdate') or '').strip(), '%Y-%m-%d').date()
    except ValueError:
        errors['birthdate'] = ['Please enter your date of birth.']
    if birthdate and (birthdate > date.today() or _age_on(birthdate) > 120):
        errors['birthdate'] = ['Please enter a valid date of birth.']
    elif birthdate and _age_on(birthdate) < minimum_age():
        errors['birthdate'] = [f'You must be at least {minimum_age()} years old to use Aura.']

    if form.validate_on_submit() and not errors:
        user = User(
            username=form.data['username'],
            email=form.data['email'],
            password=form.data['password'],
            firstname=form.data['firstname'],
            lastname=form.data['lastname'],
            birthdate=birthdate.isoformat(),
            terms_accepted_at=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()
        login_user(user, remember=True)
        return session_payload(user)

    return {**form.errors, **errors}, 401


def purge_user(uid):
    """Permanently delete an account and everything attached to it.

    The User model cascades posts (→comments/likes/bookmarks), stories,
    comments, likes, bookmarks, comment-likes, follows, friends and vault
    content. Everything else that points at the user (messages, notifications,
    profile visits, shop products, live records, blocks, reports they filed)
    has no cascade, so we clear it explicitly first — otherwise deleting the
    user would orphan rows or hit NOT-NULL FK errors.

    Returns False when the account doesn't exist.
    """
    user = User.query.get(uid)
    if not user:
        return False

    my_post_ids = [p.id for p in user.posts]
    my_comment_ids = [c.id for c in user.comments]

    Notification.query.filter(
        or_(
            Notification.sender_id == uid,
            Notification.recipient_id == uid,
            Notification.post_id.in_(my_post_ids),
            Notification.comment_id.in_(my_comment_ids),
        )
    ).delete(synchronize_session=False)
    Message.query.filter(
        or_(Message.sender_id == uid, Message.recipient_id == uid)
    ).delete(synchronize_session=False)
    # other people's DMs that shared one of this user's videos keep their text
    if my_post_ids:
        Message.query.filter(Message.post_id.in_(my_post_ids)).update(
            {'post_id': None}, synchronize_session=False)
    ProfileVisit.query.filter(
        or_(ProfileVisit.visitor_id == uid, ProfileVisit.profile_id == uid)
    ).delete(synchronize_session=False)
    Product.query.filter(Product.seller_id == uid).delete(synchronize_session=False)
    LiveReport.query.filter(
        or_(LiveReport.reporter_id == uid, LiveReport.reported_user_id == uid)
    ).delete(synchronize_session=False)
    LiveMessage.query.filter(LiveMessage.user_id == uid).delete(synchronize_session=False)
    LiveViewer.query.filter(LiveViewer.user_id == uid).delete(synchronize_session=False)
    # ORM-delete the user's live sessions so their viewers/messages cascade
    for session in LiveSession.query.filter(LiveSession.host_id == uid).all():
        LiveReport.query.filter_by(session_id=session.id).delete(synchronize_session=False)
        db.session.delete(session)

    # shop orders + network groups also point at the user with no cascade
    Order.query.filter(Order.buyer_id == uid).delete(synchronize_session=False)
    GroupMessage.query.filter(GroupMessage.user_id == uid).delete(synchronize_session=False)
    GroupMember.query.filter(GroupMember.user_id == uid).delete(synchronize_session=False)
    for grp in Group.query.filter(Group.leader_id == uid).all():
        db.session.delete(grp)  # cascades the group's members + messages

    # safety records: blocks in both directions and reports this user filed.
    # Reports *about* this user are kept (reported_user_id has no FK) so the
    # moderation history survives.
    Block.query.filter(
        or_(Block.blocker_id == uid, Block.blocked_id == uid)
    ).delete(synchronize_session=False)
    Report.query.filter(Report.reporter_id == uid).delete(synchronize_session=False)

    db.session.commit()  # phase 1: clear non-cascaded refs (expires stale collections)

    # phase 2: re-fetch the now-clean user and delete (cascades the rest)
    fresh = User.query.get(uid)
    if fresh:
        db.session.delete(fresh)
        db.session.commit()
    return True


@auth_routes.route('/delete', methods=['DELETE'])
@login_required
def delete_account():
    """Permanently delete the current user's account and all of their data."""
    uid = current_user.id
    if not purge_user(uid):
        return {'errors': {'message': 'Account not found'}}, 404
    logout_user()
    return {'message': 'Account deleted'}


@auth_routes.route('/unauthorized')
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {'errors': {'message': 'Unauthorized'}}, 401
