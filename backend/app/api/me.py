from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import MeOut

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return user