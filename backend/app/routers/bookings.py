from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Booking,
    ConditionReport,
    Equipment,
    HistoryEvent,
)
from ..schemas import (
    BookingCreate,
    BookingResponse,
    ConditionReportCreate,
)

router = APIRouter()


def get_booking_or_404(
    booking_id: int,
    db: Session,
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    return booking


def get_equipment_or_404(
    equipment_id: int,
    db: Session,
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


@router.get("/", response_model=list[BookingResponse])
def get_bookings(
    db: Session = Depends(get_db),
):
    return (
        db.query(Booking)
        .order_by(Booking.start_time)
        .all()
    )


@router.post("/", response_model=BookingResponse)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
):
    # Basic time validation
    if payload.start_time >= payload.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    equipment = get_equipment_or_404(
        payload.equipment_id,
        db,
    )

    # Safety gate: repair equipment cannot be booked.
    if equipment.status == "REPAIR":
        raise HTTPException(
            status_code=409,
            detail=(
                f"{equipment.name} is currently under repair "
                "and cannot be booked."
            ),
        )

    # Server-side overlap detection.
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.equipment_id == payload.equipment_id,
            Booking.status.in_(["UPCOMING", "ACTIVE"]),
            Booking.start_time < payload.end_time,
            Booking.end_time > payload.start_time,
        )
        .first()
    )

    if overlapping:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Equipment is already booked by "
                f"{overlapping.farmer_name} from "
                f"{overlapping.start_time.strftime('%d %b, %I:%M %p')} "
                f"to "
                f"{overlapping.end_time.strftime('%I:%M %p')}."
            ),
        )

    booking = Booking(
        equipment_id=payload.equipment_id,
        farmer_name=payload.farmer_name.strip(),
        start_time=payload.start_time,
        end_time=payload.end_time,
        status="UPCOMING",
    )

    db.add(booking)
    db.flush()

    db.add(
        HistoryEvent(
            equipment_id=equipment.id,
            event_type="BOOKING_CREATED",
            description=(
                f"{booking.farmer_name} reserved "
                f"{equipment.name} from "
                f"{booking.start_time.strftime('%d %b %I:%M %p')} "
                f"to "
                f"{booking.end_time.strftime('%I:%M %p')}."
            ),
            actor=booking.farmer_name,
        )
    )

    equipment.status = "RESERVED"
    equipment.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)

    return booking


@router.post("/{booking_id}/checkout")
def checkout_booking(
    booking_id: int,
    db: Session = Depends(get_db),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    if booking.status != "UPCOMING":
        raise HTTPException(
            status_code=409,
            detail="Only upcoming bookings can be checked out.",
        )

    equipment = get_equipment_or_404(
        booking.equipment_id,
        db,
    )

    if equipment.status == "REPAIR":
        raise HTTPException(
            status_code=409,
            detail="Equipment is currently under repair.",
        )

    # Mandatory inspection gate.
    latest_report = (
        db.query(ConditionReport)
        .filter(
            ConditionReport.booking_id == booking.id,
            ConditionReport.report_type == "PASS",
        )
        .order_by(ConditionReport.created_at.desc())
        .first()
    )

    if not latest_report:
        raise HTTPException(
            status_code=428,
            detail=(
                "Pre-use condition inspection is required "
                "before checkout."
            ),
        )

    booking.status = "ACTIVE"
    equipment.status = "IN_USE"
    equipment.updated_at = datetime.utcnow()

    db.add(
        HistoryEvent(
            equipment_id=equipment.id,
            event_type="CHECKOUT",
            description=(
                f"{booking.farmer_name} checked out "
                f"{equipment.name} after completing "
                "the pre-use inspection."
            ),
            actor=booking.farmer_name,
        )
    )

    db.commit()

    return {
        "message": "Equipment checked out successfully.",
        "status": "IN_USE",
        "booking_id": booking.id,
    }


@router.post("/{booking_id}/return")
def return_booking(
    booking_id: int,
    db: Session = Depends(get_db),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    if booking.status != "ACTIVE":
        raise HTTPException(
            status_code=409,
            detail="Only active bookings can be returned.",
        )

    equipment = get_equipment_or_404(
        booking.equipment_id,
        db,
    )

    booking.status = "COMPLETED"

    # If the machine was reported damaged during use,
    # it stays in REPAIR instead of becoming available.
    if equipment.status != "REPAIR":
        equipment.status = "AVAILABLE"

    equipment.updated_at = datetime.utcnow()

    db.add(
        HistoryEvent(
            equipment_id=equipment.id,
            event_type="RETURN",
            description=(
                f"{booking.farmer_name} returned "
                f"{equipment.name}."
            ),
            actor=booking.farmer_name,
        )
    )

    db.commit()

    return {
        "message": "Equipment returned successfully.",
        "status": equipment.status,
        "booking_status": booking.status,
    }


@router.post(
    "/{booking_id}/condition",
)
def submit_condition_report(
    booking_id: int,
    payload: ConditionReportCreate,
    db: Session = Depends(get_db),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    equipment = get_equipment_or_404(
        payload.equipment_id,
        db,
    )

    if booking.equipment_id != equipment.id:
        raise HTTPException(
            status_code=400,
            detail="Equipment does not match the booking.",
        )

    # Ensure the supplied farmer matches the booking.
    if payload.reported_by.strip() != booking.farmer_name:
        raise HTTPException(
            status_code=403,
            detail="Reporter does not match the booking farmer.",
        )

    report = ConditionReport(
        equipment_id=payload.equipment_id,
        booking_id=booking_id,
        reported_by=payload.reported_by.strip(),
        engine_ok=payload.engine_ok,
        tires_ok=payload.tires_ok,
        leakage_ok=payload.leakage_ok,
        attachments_ok=payload.attachments_ok,
        safety_ok=payload.safety_ok,
        report_type=payload.report_type,
        description=payload.description,
        severity=payload.severity,
    )

    db.add(report)

    failed = not all(
        [
            payload.engine_ok,
            payload.tires_ok,
            payload.leakage_ok,
            payload.attachments_ok,
            payload.safety_ok,
        ]
    )

    damage_report = (
        failed
        or payload.report_type.upper() == "DAMAGE"
    )

    if damage_report:
        equipment.status = "REPAIR"
        equipment.updated_at = datetime.utcnow()

        db.add(
            HistoryEvent(
                equipment_id=equipment.id,
                event_type="DAMAGE_REPORTED",
                description=(
                    f"Damage reported by "
                    f"{payload.reported_by}: "
                    f"{payload.description or 'Condition issue'} "
                    f"Equipment paused for safety."
                ),
                actor=payload.reported_by,
            )
        )

    else:
        db.add(
            HistoryEvent(
                equipment_id=equipment.id,
                event_type="CONDITION_PASSED",
                description=(
                    f"Pre-use inspection completed by "
                    f"{payload.reported_by}. "
                    "All required checks passed."
                ),
                actor=payload.reported_by,
            )
        )

    db.commit()

    return {
        "message": (
            "Damage reported and equipment paused."
            if damage_report
            else "Pre-use inspection passed."
        ),
        "equipment_status": equipment.status,
    }


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    if booking.status != "UPCOMING":
        raise HTTPException(
            status_code=409,
            detail="Only upcoming bookings can be cancelled.",
        )

    equipment = get_equipment_or_404(
        booking.equipment_id,
        db,
    )

    booking.status = "CANCELLED"

    # Only release equipment if there are no other active/upcoming
    # bookings for it.
    another_booking = (
        db.query(Booking)
        .filter(
            Booking.equipment_id == equipment.id,
            Booking.id != booking.id,
            Booking.status.in_(["UPCOMING", "ACTIVE"]),
        )
        .first()
    )

    if not another_booking and equipment.status != "REPAIR":
        equipment.status = "AVAILABLE"

    equipment.updated_at = datetime.utcnow()

    db.add(
        HistoryEvent(
            equipment_id=equipment.id,
            event_type="BOOKING_CANCELLED",
            description=(
                f"{booking.farmer_name} cancelled their "
                f"booking for {equipment.name}."
            ),
            actor=booking.farmer_name,
        )
    )

    db.commit()

    return {
        "message": "Booking cancelled.",
        "status": equipment.status,
    }