from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, time, datetime

from app.models.reservation import ReservationStatus
from app.schemas.restaurant_schema import RestaurantBrief


class ReservationCreate(BaseModel):
    party_size: int
    reservation_date: date
    reservation_time: time
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    special_requests: Optional[str] = None

    @field_validator("party_size")
    @classmethod
    def party_size_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Party size must be at least 1")
        return v


class ReservationOut(BaseModel):
    id: int
    restaurant: RestaurantBrief
    party_size: int
    reservation_date: date
    reservation_time: time
    status: str
    guest_name: Optional[str]
    guest_phone: Optional[str]
    special_requests: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReservationStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = {s.value for s in ReservationStatus}
        if v not in valid:
            raise ValueError(f"Invalid status. Must be one of: {sorted(valid)}")
        return v
