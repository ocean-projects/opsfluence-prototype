from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.deleted_incident import DeletedIncident
from app.models.user import User
from app.schemas.deleted_incident import DeletedIncidentOut

router = APIRouter(prefix="/deleted-incidents", tags=["deleted-incidents"])


@router.get("/", response_model=List[DeletedIncidentOut])
def list_deleted_incidents(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(DeletedIncident)
        .order_by(DeletedIncident.deleted_at.desc())
        .all()
    )


@router.get("/{deleted_incident_id}", response_model=DeletedIncidentOut)
def get_deleted_incident(
    deleted_incident_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = db.query(DeletedIncident).filter(DeletedIncident.id == deleted_incident_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Deleted incident not found")
    return row