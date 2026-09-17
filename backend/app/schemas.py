from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EquipmentResponse(BaseModel):
    id: int
    name: str
    category: str
    status: str
    location: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    equipment_id: int
    farmer_name: str
    start_time: datetime
    end_time: datetime


class BookingResponse(BaseModel):
    id: int
    equipment_id: int
    farmer_name: str
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True


class ConditionReportCreate(BaseModel):
    equipment_id: int
    booking_id: Optional[int] = None

    reported_by: str

    engine_ok: bool
    tires_ok: bool
    leakage_ok: bool
    attachments_ok: bool
    safety_ok: bool

    report_type: str
    description: Optional[str] = None
    severity: str


class HistoryResponse(BaseModel):
    id: int
    equipment_id: int
    event_type: str
    description: str
    actor: str
    created_at: datetime

    class Config:
        from_attributes = True