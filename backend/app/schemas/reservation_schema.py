from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

OCCASIONS = ["Birthday", "Anniversary", "Date night", "Business Meal", "Celebration"]


# ── Availability ─────────────────────────────────────────────────────────────

class SeatingOptionResponse(BaseModel):
    table_type_id: Optional[int] = None
    seating_area_name: str
    table_type_name: str
    capacity_min: int
    capacity_max: int
    is_available: bool
    available_count: int


# ── Hold ─────────────────────────────────────────────────────────────────────

class HoldRequest(BaseModel):
    restaurant_id: int
    table_type_id: Optional[int] = None
    date: date
    time: str = Field(..., description="Time in HH:MM format", pattern=r"^\d{2}:\d{2}$")
    party_size: int = Field(..., ge=1, le=20)


class HoldResponse(BaseModel):
    availability_token: str
    expires_at: datetime
    restaurant_id: int
    restaurant_name: str
    restaurant_slug: Optional[str] = None
    restaurant_cover_image_url: Optional[str] = None
    date: date
    time: str
    party_size: int
    seating_area_name: str
    table_type_name: str

    model_config = ConfigDict(from_attributes=True)


class HoldDetailResponse(HoldResponse):
    is_converted: bool
    is_expired: bool


# ── Complete ──────────────────────────────────────────────────────────────────

class CompleteReservationRequest(BaseModel):
    availability_token: str
    occasion: Optional[str] = Field(None, description=f"One of: {', '.join(OCCASIONS)}")
    special_requests: Optional[str] = Field(None, max_length=75)
    opt_in_restaurant: bool = False
    opt_in_platform: bool = False
    opt_in_sms: bool = False


class ReservationConfirmation(BaseModel):
    reservation_id: int
    restaurant_name: str
    restaurant_slug: Optional[str] = None
    restaurant_cover_image_url: Optional[str] = None
    date: date
    time: str
    party_size: int
    seating_area_name: Optional[str] = None
    table_type_name: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── User reservation list ─────────────────────────────────────────────────────

class UserReservationResponse(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str = ""
    restaurant_slug: Optional[str] = None
    restaurant_cover_image_url: Optional[str] = None
    date: date
    time: str
    party_size: int
    seating_area_name: Optional[str] = None
    table_type_name: Optional[str] = None
    occasion: Optional[str] = None
    special_requests: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
