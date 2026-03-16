import re

from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, time, datetime

from app.models.reservation import ReservationStatus
from app.schemas.restaurant_schema import RestaurantBrief
from app.schemas.table_schema import TableBrief

MAX_PARTY_SIZE = 20
MAX_GUEST_NAME_LENGTH = 100
MAX_GUEST_PHONE_LENGTH = 20
MAX_SPECIAL_REQUESTS_LENGTH = 500
PHONE_PATTERN = re.compile(r"^\+?[\d\s\-()]{6,20}$")


class ReservationCreate(BaseModel):
    party_size: int
    reservation_date: date
    reservation_time: time
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    special_requests: Optional[str] = None

    @field_validator("party_size")
    @classmethod
    def party_size_in_range(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Party size must be at least 1")
        if v > MAX_PARTY_SIZE:
            raise ValueError(f"Party size cannot exceed {MAX_PARTY_SIZE}")
        return v

    @field_validator("guest_name")
    @classmethod
    def guest_name_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > MAX_GUEST_NAME_LENGTH:
            raise ValueError(
                f"Guest name cannot exceed {MAX_GUEST_NAME_LENGTH} characters"
            )
        return v.strip() if v else v

    @field_validator("guest_phone")
    @classmethod
    def guest_phone_format(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if not PHONE_PATTERN.match(v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("special_requests")
    @classmethod
    def special_requests_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > MAX_SPECIAL_REQUESTS_LENGTH:
            raise ValueError(
                f"Special requests cannot exceed {MAX_SPECIAL_REQUESTS_LENGTH} characters"
            )
        return v.strip() if v else v


class ReservationOut(BaseModel):
    id: int
    restaurant: RestaurantBrief
    table: Optional[TableBrief] = None
    party_size: int
    reservation_date: date
    reservation_time: time
    status: str
    guest_name: Optional[str]
    guest_phone: Optional[str]
    special_requests: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

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


class SlotAvailabilityResponse(BaseModel):
    available_tables: int
    total_tables: int
