"""add first_name and last_name to users

Revision ID: 657d392365ec
Revises: d06b791b5451
Create Date: 2026-03-07
"""

from alembic import op
import sqlalchemy as sa


revision = "657d392365ec"
down_revision = "d06b791b5451"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=True))


def downgrade():
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")