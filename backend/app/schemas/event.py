from datetime import datetime
from pydantic import BaseModel


class IncidentEventOut(BaseModel):
    id: int
    incident_id: int
    type: str
    payload: dict | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
