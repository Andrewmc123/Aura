"""Shared safety helpers: who a viewer has blocked (or been blocked by), and a
basic filter that stops objectionable text being posted.

Apple requires apps with user-generated content to filter objectionable
material, let people block abusive users, and let them report content.
"""
import os
import re

from flask_login import current_user
from sqlalchemy import or_

from app.models import Block


def hidden_user_ids(user_id=None):
    """Ids of everyone the viewer should not see: people they blocked and
    people who blocked them. Empty for signed-out visitors."""
    if user_id is None:
        if not current_user.is_authenticated:
            return set()
        user_id = current_user.id
    rows = Block.query.filter(
        or_(Block.blocker_id == user_id, Block.blocked_id == user_id)
    ).all()
    return {r.blocked_id if r.blocker_id == user_id else r.blocker_id for r in rows}


def is_blocked_between(a_id, b_id):
    """True if either user has blocked the other."""
    return Block.query.filter(
        or_(
            (Block.blocker_id == a_id) & (Block.blocked_id == b_id),
            (Block.blocker_id == b_id) & (Block.blocked_id == a_id),
        )
    ).first() is not None


# A deliberately small list of slurs and abusive terms. Extend it with the
# BLOCKED_WORDS env var (comma-separated) without touching code.
_DEFAULT_BLOCKED = [
    'nigger', 'nigga', 'faggot', 'fag', 'kike', 'spic', 'chink', 'tranny',
    'retard', 'coon', 'wetback', 'raghead', 'cunt',
    'kill yourself', 'kys', 'child porn',
]

# common letter swaps used to dodge filters (n1gger, f@g ...)
_LEET = str.maketrans('013457@$', 'oieastas')


def _blocked_terms():
    extra = [w.strip().lower() for w in os.environ.get('BLOCKED_WORDS', '').split(',') if w.strip()]
    return _DEFAULT_BLOCKED + extra


def find_objectionable(*texts):
    """Return the first blocked term found in any of the given strings, or
    None when the text is clean. Matches whole words so ordinary words that
    merely contain a blocked term are left alone."""
    combined = ' '.join(t for t in texts if t).lower()
    if not combined:
        return None
    normalised = combined.translate(_LEET)
    for term in _blocked_terms():
        pattern = r'(?<![a-z])' + re.escape(term) + r'(?![a-z])'
        if re.search(pattern, combined) or re.search(pattern, normalised):
            return term
    return None


OBJECTIONABLE_ERROR = (
    "This can't be posted because it goes against Aura's community guidelines."
)


def admin_emails():
    return {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()}


def is_admin(user=None):
    user = user or current_user
    return bool(
        getattr(user, 'is_authenticated', False)
        and (user.email or '').lower() in admin_emails()
    )
