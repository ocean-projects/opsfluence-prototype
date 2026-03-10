from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummaryOut


class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "SEV3"
    status: str = "OPEN"


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[UUID] = None


class IncidentOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: str
    severity: str
    created_by: UUID
    assignee_id: Optional[UUID] = None
    assignee: Optional[UserSummaryOut] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IncidentEventOut(BaseModel):
    id: UUID
    incident_id: UUID
    actor_id: Optional[UUID] = None
    actor: Optional[UserSummaryOut] = None
    type: str
    data: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)