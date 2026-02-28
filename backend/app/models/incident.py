from enum import Enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.sql import func

from app.db.base_class import Base


# -----------------------------
# Incident Status Enum
# -----------------------------
class IncidentStatus(str, Enum):
    # NOTE: These values intentionally match the *Postgres enum values*
    # created in Alembic (incident_status). Keep them uppercase.
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# -----------------------------
# Incident Model
# -----------------------------
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(Text)

    severity = Column(String, nullable=False)

    # Enum stored at DB level
    status = Column(
        SAEnum(IncidentStatus, name="incident_status"),
        nullable=False,
        default=IncidentStatus.OPEN,
    )

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )