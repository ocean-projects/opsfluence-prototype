"""add updated_at to users"""

from alembic import op
import sqlalchemy as sa


revision = "b024b7dc8ff1"
down_revision = "657d392365ec"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade():
    op.drop_column("users", "updated_at")