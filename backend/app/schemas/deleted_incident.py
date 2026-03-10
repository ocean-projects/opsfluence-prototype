from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DeleteIncidentRequest(BaseModel):
    confirm: str


class DeletedIncidentOut(BaseModel):
    id: UUID
    original_incident_id: UUID
    title: str
    description: Optional[str] = None
    status: str
    severity: str
    created_by: UUID
    assignee_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_by: UUID
    deleted_at: datetime
    events_snapshot: Optional[list[dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)