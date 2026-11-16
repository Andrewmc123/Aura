"""safety — blocks, reports, terms acceptance

Revision ID: aura_safety01
Revises: aura_presence01
Create Date: 2026-11-16 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_safety01'
down_revision = 'aura_presence01'
branch_labels = None
depends_on = None


def upgrade():
    # env.py sets search_path to SCHEMA in prod, so plain table names resolve there.
    op.create_table(
        'blocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('blocker_id', sa.Integer(), nullable=False),
        sa.Column('blocked_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id']),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocks_pair'),
    )
    op.create_index('ix_blocks_blocker_id', 'blocks', ['blocker_id'])
    op.create_index('ix_blocks_blocked_id', 'blocks', ['blocked_id'])

    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('target_type', sa.String(length=20), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('reported_user_id', sa.Integer(), nullable=True),
        sa.Column('reason', sa.String(length=40), nullable=False, server_default='other'),
        sa.Column('details', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reports_status', 'reports', ['status'])

    op.add_column('users', sa.Column('terms_accepted_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'terms_accepted_at')
    op.drop_index('ix_reports_status', table_name='reports')
    op.drop_table('reports')
    op.drop_index('ix_blocks_blocked_id', table_name='blocks')
    op.drop_index('ix_blocks_blocker_id', table_name='blocks')
    op.drop_table('blocks')
