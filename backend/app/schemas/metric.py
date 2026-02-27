from pydantic import BaseModel, Field
from typing import Optional


class MetricBase(BaseModel):
    name: str = Field(..., min_length=1)
    value: float


class MetricCreate(MetricBase):
    incident_id: int


class MetricUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None


class MetricOut(MetricBase):
    id: int
    incident_id: int
    owner_id: int

    model_config = {
        "from_attributes": True
    }