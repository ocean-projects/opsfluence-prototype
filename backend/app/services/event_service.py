from app.models.event import IncidentEvent
from sqlalchemy.orm import Session


def create_event(
    db: Session,
    *,
    incident_id,
    actor_id,
    event_type: str,
    data: dict | None = None,
):
    event = IncidentEvent(
        incident_id=incident_id,
        actor_id=actor_id,
        type=event_type,
        data=data,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event