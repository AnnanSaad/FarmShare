from datetime import datetime, timedelta

from .database import Base, SessionLocal, engine
from .models import (
    Booking,
    ConditionReport,
    Equipment,
    HistoryEvent,
)


def seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    if db.query(Equipment).count() > 0:
        db.close()
        return

    now = datetime.now()

    equipment = [
        Equipment(
            name="Power Tiller",
            category="Tillage",
            status="AVAILABLE",
            location="North Cooperative Yard",
            description="Compact tiller for soil preparation.",
        ),
        Equipment(
            name="Mahindra Tractor",
            category="Transport & Tillage",
            status="RESERVED",
            location="Central Cooperative Yard",
            description="Community tractor for field operations.",
        ),
        Equipment(
            name="Combine Harvester",
            category="Harvesting",
            status="IN_USE",
            location="East Farm Cluster",
            description="Shared harvester for grain crops.",
        ),
        Equipment(
            name="Seed Drill",
            category="Planting",
            status="REPAIR",
            location="Central Cooperative Yard",
            description="Precision seed placement equipment.",
        ),
        Equipment(
            name="Water Pump",
            category="Irrigation",
            status="AVAILABLE",
            location="South Cooperative Yard",
            description="Portable irrigation pump.",
        ),
        Equipment(
            name="Rotavator",
            category="Tillage",
            status="RESERVED",
            location="West Farm Cluster",
            description="Rotary soil preparation implement.",
        ),
    ]

    db.add_all(equipment)
    db.commit()

    for item in equipment:
        db.refresh(item)

    bookings = [
        Booking(
            equipment_id=equipment[1].id,
            farmer_name="Ravi Kumar",
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=5),
            status="UPCOMING",
        ),
        Booking(
            equipment_id=equipment[2].id,
            farmer_name="Suresh Reddy",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=3),
            status="ACTIVE",
        ),
        Booking(
            equipment_id=equipment[5].id,
            farmer_name="Lakshmi Devi",
            start_time=now + timedelta(hours=4),
            end_time=now + timedelta(hours=7),
            status="UPCOMING",
        ),
        Booking(
            equipment_id=equipment[0].id,
            farmer_name="Anil",
            start_time=now - timedelta(days=1),
            end_time=now - timedelta(days=1) + timedelta(hours=2),
            status="COMPLETED",
        ),
    ]

    db.add_all(bookings)
    db.commit()

    for booking in bookings:
        db.refresh(booking)

    history = [
        HistoryEvent(
            equipment_id=equipment[0].id,
            event_type="BOOKING_CREATED",
            description="Anil reserved the Power Tiller.",
            actor="Anil",
            created_at=now - timedelta(days=1),
        ),
        HistoryEvent(
            equipment_id=equipment[0].id,
            event_type="CHECKOUT",
            description="Anil checked out the Power Tiller.",
            actor="Anil",
            created_at=now - timedelta(days=1),
        ),
        HistoryEvent(
            equipment_id=equipment[0].id,
            event_type="CONDITION_PASSED",
            description="Pre-use inspection passed.",
            actor="Anil",
            created_at=now - timedelta(days=1),
        ),
        HistoryEvent(
            equipment_id=equipment[3].id,
            event_type="DAMAGE_REPORTED",
            description="Hydraulic leakage reported. Equipment paused.",
            actor="Ravi Kumar",
            created_at=now - timedelta(hours=4),
        ),
        HistoryEvent(
            equipment_id=equipment[1].id,
            event_type="BOOKING_CREATED",
            description="Ravi Kumar reserved the Mahindra Tractor.",
            actor="Ravi Kumar",
            created_at=now - timedelta(hours=1),
        ),
        HistoryEvent(
            equipment_id=equipment[2].id,
            event_type="CHECKOUT",
            description="Suresh Reddy checked out the Combine Harvester.",
            actor="Suresh Reddy",
            created_at=now - timedelta(hours=1),
        ),
    ]

    db.add_all(history)
    db.commit()

    db.close()


if __name__ == "__main__":
    seed()