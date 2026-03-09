from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserSummaryOut(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MeOut(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None