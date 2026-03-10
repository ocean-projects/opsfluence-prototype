from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID


class UserSummaryOut(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None


class MeOut(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class MeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None