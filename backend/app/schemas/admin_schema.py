from datetime import datetime, date, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.user import UserRole


class AdminPlatformStats(BaseModel):
    total_users: int
    total_restaurants: int
    active_restaurants: int
    total_reservations: int
    todays_reservations: int
    total_reviews: int
    users_by_role: dict[str, int]


class DailyCount(BaseModel):
    date: date
    count: int


class ReservationStatusBreakdown(BaseModel):
    pending: int
    confirmed: int
    completed: int
    cancelled: int
    no_show: int


class AdminTrendStats(BaseModel):
    reservation_trends: list[DailyCount]
    user_trends: list[DailyCount]
    review_trends: list[DailyCount]
    reservation_status_breakdown: ReservationStatusBreakdown
    current_period_reservations: int
    previous_period_reservations: int
    current_period_users: int
    previous_period_users: int
    current_period_reviews: int
    previous_period_reviews: int


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: int
    first_name: str
    last_name: str
    user_email: str
    phone_number: Optional[str]
    email_verified: bool
    failed_login_attempts: int
    locked_until: Optional[datetime]
    registered_at: datetime


class AdminUserDetail(AdminUserOut):
    restaurant_count: int
    reservation_count: int
    review_count: int


class AdminRoleUpdate(BaseModel):
    role: int

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: int) -> int:
        valid = {r.value for r in UserRole}
        if v not in valid:
            raise ValueError(f"Invalid role. Must be one of: {valid}")
        return v


class AdminLockUpdate(BaseModel):
    locked: bool


class AdminRestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    name: str
    slug: str
    cuisine: str
    city: str
    address: str
    price_range: int
    rating: Optional[float]
    review_count: int
    max_capacity: int
    reservation_fee: int
    is_active: bool
    created_at: datetime
    owner_name: str


class AdminActiveToggle(BaseModel):
    is_active: bool


class AdminReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    restaurant_id: int
    party_size: int
    reservation_date: date
    reservation_time: time
    status: str
    guest_name: Optional[str]
    guest_phone: Optional[str]
    special_requests: Optional[str]
    created_at: datetime
    restaurant_name: str
    user_name: str


class AdminReservationStatusUpdate(BaseModel):
    status: str


class AdminReviewOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    rating: int
    text: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    author_name: str
    restaurant_name: str
    restaurant_slug: str
