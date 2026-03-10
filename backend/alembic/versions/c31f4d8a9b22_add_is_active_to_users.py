"""add is_active to users

Revision ID: c31f4d8a9b22
Revises: 9f1c2d7a4b11
Create Date: 2026-03-10
"""

from alembic import op
import sqlalchemy as sa


revision = "c31f4d8a9b22"
down_revision = "9f1c2d7a4b11"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade():
    op.drop_column("users", "is_active")