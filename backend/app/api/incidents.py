from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.incident import (Incident, IncidentStatus)
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentOut,
)
from app.core.deps import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"],
)


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
        status="open",  # backend controls initial state
        owner_id=current_user.id,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

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

    update_data = incident_in.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)

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

    db.delete(incident)
    db.commit()

    return None