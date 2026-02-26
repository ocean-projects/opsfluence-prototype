from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.metric import Metric
from app.models.incident import Incident
from app.schemas.metric import MetricCreate, MetricUpdate, MetricOut
from app.core.deps import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/metrics",
    tags=["metrics"],
)


@router.post("/", response_model=MetricOut, status_code=status.HTTP_201_CREATED)
def create_metric(
    metric_in: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = db.query(Incident).filter(
        Incident.id == metric_in.incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    if incident.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    metric = Metric(
        **metric_in.dict(),
        owner_id=current_user.id,
    )

    db.add(metric)
    db.commit()
    db.refresh(metric)

    return metric


@router.get("/", response_model=List[MetricOut])
def list_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Metric).filter(
        Metric.owner_id == current_user.id
    ).all()


@router.delete("/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = db.query(Metric).filter(
        Metric.id == metric_id
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metric not found",
        )

    if metric.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    db.delete(metric)
    db.commit()

    return None