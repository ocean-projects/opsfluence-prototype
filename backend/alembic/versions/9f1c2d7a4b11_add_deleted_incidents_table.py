"""add deleted_incidents table

Revision ID: 9f1c2d7a4b11
Revises: 74e26e0c4dd6
Create Date: 2026-03-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "9f1c2d7a4b11"
down_revision = "74e26e0c4dd6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "deleted_incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("original_incident_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("events_snapshot", sa.JSON(), nullable=True),
    )


def downgrade():
    op.drop_table("deleted_incidents")