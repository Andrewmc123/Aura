"""Safety models required for a user-generated-content app: people can block
each other and report posts, comments, messages or accounts for review."""
from datetime import datetime

from .db import db, environment, SCHEMA, add_prefix_for_prod


class Block(db.Model):
    __tablename__ = 'blocks'
    __table_args__ = (
        db.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocks_pair'),
        {'schema': SCHEMA} if environment == "production" else {},
    )

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False, index=True)
    blocked_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    blocked = db.relationship('User', foreign_keys=[blocked_id])


class Report(db.Model):
    __tablename__ = 'reports'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    # 'post' | 'comment' | 'message' | 'user' | 'story' | 'product'
    target_type = db.Column(db.String(20), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)
    # The account that owns the reported content (kept so a report still
    # points at someone after the content itself is removed).
    reported_user_id = db.Column(db.Integer, nullable=True)
    reason = db.Column(db.String(40), nullable=False, default='other')
    details = db.Column(db.String(500))
    status = db.Column(db.String(20), nullable=False, default='open')  # open | removed | dismissed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime)

    reporter = db.relationship('User', foreign_keys=[reporter_id])

    def to_dict(self):
        return {
            'id': self.id,
            'reporter_id': self.reporter_id,
            'reporter': self.reporter.username if self.reporter else None,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'reported_user_id': self.reported_user_id,
            'reason': self.reason,
            'details': self.details,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }
