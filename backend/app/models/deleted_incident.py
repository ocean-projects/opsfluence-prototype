import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import Base


class DeletedIncident(Base):
    __tablename__ = "deleted_incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    original_incident_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False)
    severity = Column(String, nullable=False)

    created_by = Column(UUID(as_uuid=True), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    deleted_by = Column(UUID(as_uuid=True), nullable=False)
    deleted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    events_snapshot = Column(JSON, nullable=True)