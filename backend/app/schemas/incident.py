from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.incident import IncidentStatus


# Shared base fields
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str  # REQUIRED (DB requires this)

    model_config = {
        "extra": "forbid"
    }

# Used when creating a new incident
class IncidentCreate(IncidentBase):
    pass


# Used when updating an incident
class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[IncidentStatus] = None


# Returned in responses
class IncidentOut(IncidentBase):
    id: int
    status: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }