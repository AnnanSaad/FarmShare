from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Equipment, HistoryEvent

router = APIRouter()


@router.post("/equipment/{equipment_id}/return-to-service")
def return_to_service(
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

    if equipment.status != "REPAIR":
        raise HTTPException(
            status_code=409,
            detail="Equipment is not currently under repair",
        )

    equipment.status = "AVAILABLE"
    equipment.updated_at = datetime.utcnow()

    db.add(
        HistoryEvent(
            equipment_id=equipment.id,
            event_type="REPAIR_APPROVED",
            description=(
                f"{equipment.name} repair approved. "
                "Equipment returned to service."
            ),
            actor="Administrator",
        )
    )

    db.commit()

    return {
        "message": "Equipment returned to service",
        "status": "AVAILABLE",
    }