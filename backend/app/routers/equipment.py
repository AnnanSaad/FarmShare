from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Equipment, HistoryEvent
from ..schemas import EquipmentResponse, HistoryResponse

router = APIRouter()


@router.get("/", response_model=list[EquipmentResponse])
def get_equipment(db: Session = Depends(get_db)):
    return (
        db.query(Equipment)
        .order_by(Equipment.id)
        .all()
    )


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_single_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
):
    equipment = (
        db.query(Equipment)
        .filter(Equipment.id == equipment_id)
        .first()
    )

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipment not found",
        )

    return equipment


@router.get(
    "/{equipment_id}/history",
    response_model=list[HistoryResponse],
)
def get_history(
    equipment_id: int,
    db: Session = Depends(get_db),
):
    equipment = (
        db.query(Equipment)
        .filter(Equipment.id == equipment_id)
        .first()
    )

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipment not found",
        )

    return (
        db.query(HistoryEvent)
        .filter(HistoryEvent.equipment_id == equipment_id)
        .order_by(HistoryEvent.created_at.desc())
        .all()
    )