from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.incident import (Incident, IncidentStatus)
from app.models.event import IncidentEvent
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentOut,
)
from app.schemas.event import IncidentEventOut
from app.core.deps import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"],
)


def _log_event(db: Session, *, incident_id: int, type: str, payload: dict | None = None) -> None:
    """Append-only incident event stream for audit + integrations."""
    evt = IncidentEvent(incident_id=incident_id, type=type, payload=payload or {})
    db.add(evt)


# -------------------------
# CREATE INCIDENT
# -------------------------
@router.post("/", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
        status=IncidentStatus.OPEN,  # backend controls initial state
        owner_id=current_user.id,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    _log_event(
        db,
        incident_id=incident.id,
        type="INCIDENT_CREATED",
        payload={"title": incident.title, "severity": incident.severity, "status": str(incident.status)},
    )
    db.commit()

    return incident


# -------------------------
# LIST MY INCIDENTS
# -------------------------
@router.get("/", response_model=List[IncidentOut])
def list_incidents(
    status: IncidentStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Incident).filter(
        Incident.owner_id == current_user.id
    )

    if status:
        query = query.filter(Incident.status == status)

    return query.all()


# -------------------------
# GET SINGLE INCIDENT
# -------------------------
@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.owner_id == current_user.id,
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return incident


# -------------------------
# UPDATE INCIDENT
# -------------------------
@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    incident_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.owner_id == current_user.id,
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    update_data = incident_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)

    if update_data:
        _log_event(
            db,
            incident_id=incident.id,
            type="INCIDENT_UPDATED",
            payload={"changes": update_data},
        )
        db.commit()

    return incident


# -------------------------
# DELETE INCIDENT
# -------------------------
@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.owner_id == current_user.id,
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    _log_event(db, incident_id=incident.id, type="INCIDENT_DELETED", payload={"id": incident.id})
    db.delete(incident)
    db.commit()

    return None


# -------------------------
# INCIDENT EVENT STREAM
# -------------------------
@router.get("/{incident_id}/events", response_model=List[IncidentEventOut])
def list_incident_events(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    if incident.owner_id != current_user.id and current_user.role not in ("admin", "operator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return (
        db.query(IncidentEvent)
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(IncidentEvent.created_at.asc(), IncidentEvent.id.asc())
        .all()
    )