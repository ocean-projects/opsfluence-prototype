from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.incident import Incident
from app.models.event import IncidentEvent
from app.models.user import User
from app.schemas.incident import (
    IncidentCreate,
    IncidentEventOut,
    IncidentOut,
    IncidentUpdate,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


def append_event(
    *,
    db: Session,
    incident_id: UUID,
    actor_id: UUID | None,
    event_type: str,
    data: dict | None = None,
) -> IncidentEvent:
    event = IncidentEvent(
        incident_id=incident_id,
        actor_id=actor_id,
        type=event_type,
        data=data or {},
        created_at=datetime.utcnow(),
    )
    db.add(event)
    return event


@router.get("/", response_model=List[IncidentOut])
def list_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incidents = (
        db.query(Incident)
        .filter(Incident.created_by == current_user.id)
        .order_by(Incident.created_at.desc())
        .all()
    )
    return incidents


@router.post("/", response_model=IncidentOut, status_code=201)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = Incident(
        title=payload.title.strip(),
        description=(payload.description or "").strip() or None,
        status=payload.status,
        severity=payload.severity,
        created_by=current_user.id,
        assignee_id=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(incident)
    db.flush()

    append_event(
        db=db,
        incident_id=incident.id,
        actor_id=current_user.id,
        event_type="created",
        data={
            "title": incident.title,
            "description": incident.description,
            "status": incident.status,
            "severity": incident.severity,
            "created_by": str(current_user.id),
        },
    )

    db.commit()
    db.refresh(incident)
    return incident


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.created_by == current_user.id,
        )
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: UUID,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.created_by == current_user.id,
        )
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    changed = False

    if payload.title is not None:
        next_title = payload.title.strip()
        if next_title != incident.title:
            append_event(
                db=db,
                incident_id=incident.id,
                actor_id=current_user.id,
                event_type="title_updated",
                data={
                    "from": incident.title,
                    "to": next_title,
                },
            )
            incident.title = next_title
            changed = True

    if payload.description is not None:
        next_description = payload.description.strip() or None
        if next_description != incident.description:
            append_event(
                db=db,
                incident_id=incident.id,
                actor_id=current_user.id,
                event_type="description_updated",
                data={
                    "from": incident.description,
                    "to": next_description,
                },
            )
            incident.description = next_description
            changed = True

    if payload.status is not None and payload.status != incident.status:
        append_event(
            db=db,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="status_updated",
            data={
                "from": incident.status,
                "to": payload.status,
            },
        )
        incident.status = payload.status
        changed = True

    if payload.severity is not None and payload.severity != incident.severity:
        append_event(
            db=db,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="severity_updated",
            data={
                "from": incident.severity,
                "to": payload.severity,
            },
        )
        incident.severity = payload.severity
        changed = True

    if payload.assignee_id != incident.assignee_id:
        append_event(
            db=db,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="assignee_updated",
            data={
                "from": str(incident.assignee_id) if incident.assignee_id else None,
                "to": str(payload.assignee_id) if payload.assignee_id else None,
            },
        )
        incident.assignee_id = payload.assignee_id
        changed = True

    if changed:
        incident.updated_at = datetime.utcnow()
        db.add(incident)
        db.commit()
        db.refresh(incident)

    return incident


@router.get("/{incident_id}/events", response_model=List[IncidentEventOut])
def list_incident_events(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.created_by == current_user.id,
        )
        .first()
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = (
        db.query(IncidentEvent)
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(IncidentEvent.created_at.asc())
        .all()
    )
    return events