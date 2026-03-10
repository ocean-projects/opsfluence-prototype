from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.deleted_incident import DeletedIncident
from app.models.event import IncidentEvent
from app.models.incident import Incident
from app.models.user import User
from app.schemas.deleted_incident import DeleteIncidentRequest
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


def get_incident_with_assignee(
    db: Session,
    incident_id: UUID,
) -> Incident | None:
    return (
        db.query(Incident)
        .options(joinedload(Incident.assignee))
        .filter(Incident.id == incident_id)
        .first()
    )


@router.get("/", response_model=List[IncidentOut])
def list_incidents(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Incident)
        .options(joinedload(Incident.assignee))
        .order_by(Incident.created_at.desc())
        .all()
    )


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
    created = get_incident_with_assignee(db, incident.id)
    if not created:
        raise HTTPException(status_code=404, detail="Incident not found")
    return created


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    incident = get_incident_with_assignee(db, incident_id)
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
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
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
                data={"from": incident.title, "to": next_title},
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
                data={"from": incident.description, "to": next_description},
            )
            incident.description = next_description
            changed = True

    if payload.status is not None and payload.status != incident.status:
        append_event(
            db=db,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="status_updated",
            data={"from": incident.status, "to": payload.status},
        )
        incident.status = payload.status
        changed = True

    if payload.severity is not None and payload.severity != incident.severity:
        append_event(
            db=db,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="severity_updated",
            data={"from": incident.severity, "to": payload.severity},
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

    updated = get_incident_with_assignee(db, incident_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")
    return updated


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: UUID,
    payload: DeleteIncidentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this incident")

    if payload.confirm != "DELETE":
        raise HTTPException(status_code=400, detail='Type DELETE to confirm')

    events = (
        db.query(IncidentEvent)
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(IncidentEvent.created_at.asc())
        .all()
    )

    snapshot = [
        {
            "id": str(ev.id),
            "incident_id": str(ev.incident_id),
            "actor_id": str(ev.actor_id) if ev.actor_id else None,
            "type": ev.type,
            "data": ev.data,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in events
    ]

    archived = DeletedIncident(
        original_incident_id=incident.id,
        title=incident.title,
        description=incident.description,
        status=str(incident.status),
        severity=str(incident.severity),
        created_by=incident.created_by,
        assignee_id=incident.assignee_id,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        deleted_by=current_user.id,
        deleted_at=datetime.utcnow(),
        events_snapshot=snapshot,
    )
    db.add(archived)

    db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident_id).delete()
    db.delete(incident)
    db.commit()

    return {"status": "ok", "detail": "Incident deleted"}
    

@router.get("/{incident_id}/events", response_model=List[IncidentEventOut])
def list_incident_events(
    incident_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    return (
        db.query(IncidentEvent)
        .options(joinedload(IncidentEvent.actor))
        .filter(IncidentEvent.incident_id == incident_id)
        .order_by(IncidentEvent.created_at.asc())
        .all()
    )