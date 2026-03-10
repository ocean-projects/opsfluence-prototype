from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import MeOut, MeUpdate, UserAdminUpdate, UserOut, UserSummaryOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=MeOut)
def update_me(
    payload: MeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    if "first_name" in data:
        current_user.first_name = (data["first_name"] or "").strip() or None

    if "last_name" in data:
        current_user.last_name = (data["last_name"] or "").strip() or None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/", response_model=List[UserSummaryOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(User)
        .order_by(
            User.first_name.asc().nullslast(),
            User.last_name.asc().nullslast(),
            User.email.asc(),
        )
        .all()
    )


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: UUID,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="You cannot disable yourself")

    data = payload.model_dump(exclude_unset=True)

    if "first_name" in data:
        user.first_name = (data["first_name"] or "").strip() or None

    if "last_name" in data:
        user.last_name = (data["last_name"] or "").strip() or None

    if "is_active" in data and data["is_active"] is not None:
        user.is_active = bool(data["is_active"])

    db.add(user)
    db.commit()
    db.refresh(user)
    return user