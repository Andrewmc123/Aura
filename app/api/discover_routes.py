"""
Discover / Explore API — trending hashtags, sounds, creators, search,
category browsing for the Explore grid.
"""
import re
from collections import Counter, defaultdict

from flask import Blueprint, request
from flask_login import current_user
from app.safety import hidden_user_ids, is_blocked_between, find_objectionable, OBJECTIONABLE_ERROR
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload, selectinload

from app.models import Post, User
from app.sounds import build_sound_catalog

discover_routes = Blueprint('discover', __name__)

POST_OPTS = lambda: (
    joinedload(Post.user),
    selectinload(Post.likes),
    selectinload(Post.comments),
    selectinload(Post.bookmarks),
)

# Explore category → caption keywords
CATEGORY_KEYWORDS = {
    'dance':   ['dance', 'dancing', 'moves', 'choreo', 'groove'],
    'comedy':  ['funny', 'lol', 'comedy', 'laugh', 'joke', 'meme', 'fail'],
    'animals': ['cat', 'dog', 'pet', 'animal', 'puppy', 'kitten', 'squirrel', 'penguin'],
    'food':    ['food', 'eat', 'yum', 'cook', 'recipe', 'snack', 'hungry', 'foodie'],
    'sports':  ['sport', 'game', 'goal', 'basketball', 'soccer', 'football', 'win', 'gym', 'fitness'],
    'gaming':  ['gaming', 'gamer', 'game', 'play', 'stream', 'win', 'console'],
    'music':   ['music', 'song', 'sound', 'beat', 'sing', 'dj', 'concert'],
    'films':   ['film', 'movie', 'cinema', 'short', 'animation', 'trailer'],
    'travel':  ['travel', 'trip', 'beach', 'city', 'adventure', 'sunset', 'nature'],
}


def _search_words(q):
    """Split a query into lowercase words.

    Separators are dropped so "john rangers", "john_rangers" and "#nightout"
    all reduce to plain words that match usernames and hashtags alike.
    """
    return [w for w in re.split(r'[^0-9a-z]+', q.lower()) if w]


def _engagement(post):
    """Rough popularity score, used to break ties between equal matches."""
    return (post.views or 0) + len(post.likes) * 50


def _user_rank(user, raw_query, words):
    """Lower sorts first: exact handle, then prefix, then anywhere."""
    handle = (user.username or '').lower()
    needle = raw_query.strip().lower().lstrip('@')
    full_name = f"{user.firstname or ''} {user.lastname or ''}".strip().lower()

    if handle == needle:
        return 0
    if handle.startswith(needle):
        return 1
    if full_name == needle:
        return 2
    if any(handle.startswith(w) for w in words):
        return 3
    if needle in handle:
        return 4
    return 5


def _post_rank(post, words):
    """Lower sorts first: caption matches beat author/sound-only matches."""
    body = (post.body or '').lower()
    if all(w in body for w in words):
        return 0
    if any(w in body for w in words):
        return 1
    return 2

def viewer_id():
    return current_user.id if current_user.is_authenticated else None


@discover_routes.route('/trending')
def trending():
    """Trending hashtags, sounds and creators across ABLN — public."""
    posts = Post.query.options(*POST_OPTS()).all()

    tag_counts = Counter()
    tag_views = defaultdict(int)
    sound_counts = Counter()
    for p in posts:
        for tag in set(p.hashtags):
            tag_counts[tag.lower()] += 1
            tag_views[tag.lower()] += (p.views or 0)
        if p.sound_name:
            sound_counts[p.sound_name] += 1

    hashtags = [
        {'tag': tag, 'count': count, 'views': tag_views[tag]}
        for tag, count in tag_counts.most_common(12)
    ]
    sounds = [
        {'name': name, 'count': count}
        for name, count in sound_counts.most_common(8)
    ]

    hidden = hidden_user_ids()
    creators = sorted(
        [u for u in User.query.all() if u.id not in hidden],
        key=lambda u: len(u.followers), reverse=True)[:8]

    return {
        'hashtags': hashtags,
        'sounds': sounds,
        'creators': [u.to_dict_basic() for u in creators],
    }


@discover_routes.route('/videos')
def explore_videos():
    """Explore grid — optionally filtered by category — public."""
    category = (request.args.get('category') or 'all').lower()
    hidden = hidden_user_ids()
    posts = [p for p in Post.query.options(*POST_OPTS()).all() if p.user_id not in hidden]

    if category != 'all' and category in CATEGORY_KEYWORDS:
        keywords = CATEGORY_KEYWORDS[category]
        posts = [
            p for p in posts
            if any(kw in (p.body or '').lower() for kw in keywords)
        ]

    posts.sort(key=lambda p: ((p.views or 0) + len(p.likes) * 50), reverse=True)
    uid = viewer_id()
    return {
        'posts': [p.to_dict(uid) for p in posts[:48]],
        'category': category,
        'categories': ['all'] + list(CATEGORY_KEYWORDS.keys()),
    }


@discover_routes.route('/hashtag/<string:tag>')
def hashtag_videos(tag):
    """All videos for a hashtag — public."""
    tag = tag.lstrip('#').lower()
    posts = Post.query.options(*POST_OPTS()).all()
    hidden = hidden_user_ids()
    matched = [p for p in posts
               if p.user_id not in hidden and tag in [t.lower() for t in p.hashtags]]
    matched.sort(key=lambda p: (p.views or 0), reverse=True)
    uid = viewer_id()
    return {
        'tag': tag,
        'video_count': len(matched),
        'total_views': sum(p.views or 0 for p in matched),
        'posts': [p.to_dict(uid) for p in matched],
    }


@discover_routes.route('/search')
def search():
    """Global search across creators, videos and hashtags — public.

    The query is split into words and every word has to match something, so
    "john rangers" finds @John_Rangers21 and "beach drone" finds the caption
    that mentions both. A word matches a creator on their username or real
    name, and a video on its caption, sound, location or the name of whoever
    posted it.
    """
    q = (request.args.get('q') or '').strip()
    try:
        limit = min(max(int(request.args.get('limit', 24)), 1), 48)
    except (TypeError, ValueError):
        limit = 24

    if not q:
        return {'users': [], 'posts': [], 'hashtags': [], 'query': ''}

    words = _search_words(q)
    if not words:
        return {'users': [], 'posts': [], 'hashtags': [], 'query': q}

    # ---- creators -------------------------------------------------------
    user_clauses = [
        or_(
            User.username.ilike(f'%{w}%'),
            User.firstname.ilike(f'%{w}%'),
            User.lastname.ilike(f'%{w}%'),
        )
        for w in words
    ]
    hidden = hidden_user_ids()
    users = [u for u in User.query.filter(and_(*user_clauses)).all() if u.id not in hidden]
    users.sort(key=lambda u: (_user_rank(u, q, words), -u.follower_count()))

    # ---- videos ---------------------------------------------------------
    # Joined to the author so a creator's name matches their videos too.
    post_clauses = [
        or_(
            Post.body.ilike(f'%{w}%'),
            Post.sound_name.ilike(f'%{w}%'),
            Post.location.ilike(f'%{w}%'),
            User.username.ilike(f'%{w}%'),
            User.firstname.ilike(f'%{w}%'),
            User.lastname.ilike(f'%{w}%'),
        )
        for w in words
    ]
    posts = (
        Post.query.options(*POST_OPTS())
        .join(User, Post.user_id == User.id)
        .filter(and_(*post_clauses))
        .all()
    )
    posts = [p for p in posts if p.user_id not in hidden]
    posts.sort(key=lambda p: (_post_rank(p, words), -_engagement(p)))

    # ---- hashtags -------------------------------------------------------
    tag_counts = Counter()
    for p in Post.query.all():
        for tag in p.hashtags:
            lowered = tag.lower()
            if any(w in lowered for w in words):
                tag_counts[lowered] += 1

    uid = viewer_id()
    return {
        'query': q,
        'users': [u.to_dict_basic() for u in users[:12]],
        'posts': [p.to_dict(uid) for p in posts[:limit]],
        'hashtags': [{'tag': t, 'count': c} for t, c in tag_counts.most_common(8)],
    }

@discover_routes.route('/sounds')
def sounds():
    """Sound library for the Upload Studio — public.

    Returns the full library, a Trending list ranked by how many posts use
    each sound, and original audio from recent videos that can be reused.
    """
    posts = Post.query.options(joinedload(Post.user), selectinload(Post.likes)).all()
    return build_sound_catalog(posts, hidden_user_ids())
