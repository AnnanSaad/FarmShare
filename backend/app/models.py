from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from .database import Base


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False, default="AVAILABLE")
    location = Column(String(100), default="Cooperative Yard")
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)

    farmer_name = Column(String(100), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    status = Column(String(30), nullable=False, default="UPCOMING")

    created_at = Column(DateTime, default=datetime.utcnow)


class ConditionReport(Base):
    __tablename__ = "condition_reports"

    id = Column(Integer, primary_key=True, index=True)

    equipment_id = Column(
        Integer,
        ForeignKey("equipment.id"),
        nullable=False,
    )

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=True,
    )

    reported_by = Column(String(100), nullable=False)

    report_type = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(30), nullable=False)

    engine_ok = Column(Boolean, default=True)
    tires_ok = Column(Boolean, default=True)
    leakage_ok = Column(Boolean, default=True)
    attachments_ok = Column(Boolean, default=True)
    safety_ok = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    resolved_at = Column(DateTime, nullable=True)


class HistoryEvent(Base):
    __tablename__ = "history_events"

    id = Column(Integer, primary_key=True, index=True)

    equipment_id = Column(
        Integer,
        ForeignKey("equipment.id"),
        nullable=False,
    )

    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    actor = Column(String(100), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)