import re
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional

from app.schemas.admin_schema import DailyCount, ReservationStatusBreakdown


HH_MM_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

PRICE_RANGE_MIN = 1
PRICE_RANGE_MAX = 4
MIN_CAPACITY = 1


def validate_price_range_value(value: Optional[int]) -> Optional[int]:
    if value is not None and (value < PRICE_RANGE_MIN or value > PRICE_RANGE_MAX):
        raise ValueError(f"Price range must be between {PRICE_RANGE_MIN} and {PRICE_RANGE_MAX}")
    return value


def validate_max_capacity_value(value: Optional[int]) -> Optional[int]:
    if value is not None and value < MIN_CAPACITY:
        raise ValueError(f"Max capacity must be at least {MIN_CAPACITY}")
    return value


class DayHours(BaseModel):
    open: str = "09:00"
    close: str = "22:00"
    is_closed: bool = False

    @field_validator("open", "close")
    @classmethod
    def validate_time_format(cls, value: str) -> str:
        if not HH_MM_PATTERN.match(value):
            raise ValueError("Time must be in HH:MM format (00:00–23:59)")
        return value


class OpeningHoursSchema(BaseModel):
    monday: Optional[DayHours] = None
    tuesday: Optional[DayHours] = None
    wednesday: Optional[DayHours] = None
    thursday: Optional[DayHours] = None
    friday: Optional[DayHours] = None
    saturday: Optional[DayHours] = None
    sunday: Optional[DayHours] = None


class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine: str
    price_range: int = 2
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: str
    city: str
    country: str = "Slovakia"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cover_image: Optional[str] = None
    max_capacity: int = 20
    reservation_fee: int = 500
    opening_hours: Optional[OpeningHoursSchema] = None

    @field_validator("price_range")
    @classmethod
    def validate_price_range(cls, value: int) -> int:
        return validate_price_range_value(value)

    @field_validator("max_capacity")
    @classmethod
    def validate_max_capacity(cls, value: int) -> int:
        return validate_max_capacity_value(value)

    @field_validator("reservation_fee")
    @classmethod
    def validate_reservation_fee(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Reservation fee cannot be negative")
        return value


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine: Optional[str] = None
    price_range: Optional[int] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cover_image: Optional[str] = None
    max_capacity: Optional[int] = None
    reservation_fee: Optional[int] = None
    opening_hours: Optional[OpeningHoursSchema] = None

    @field_validator("price_range")
    @classmethod
    def validate_price_range(cls, value: Optional[int]) -> Optional[int]:
        return validate_price_range_value(value)

    @field_validator("max_capacity")
    @classmethod
    def validate_max_capacity(cls, value: Optional[int]) -> Optional[int]:
        return validate_max_capacity_value(value)

    @field_validator("reservation_fee")
    @classmethod
    def validate_reservation_fee(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Reservation fee cannot be negative")
        return value


class OwnerRestaurantOut(BaseModel):
    id: int
    owner_id: int
    name: str
    slug: str
    description: Optional[str]
    cuisine: str
    price_range: int
    phone_number: Optional[str]
    email: Optional[str]
    address: str
    city: str
    country: str
    latitude: Optional[float]
    longitude: Optional[float]
    cover_image: Optional[str]
    gallery_images: Optional[list[str]] = None
    rating: Optional[float]
    review_count: int
    max_capacity: int
    reservation_fee: int
    opening_hours: Optional[dict]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class GalleryImageDelete(BaseModel):
    image_url: str


class DashboardStats(BaseModel):
    total_restaurants: int
    total_reservations: int
    todays_reservations: int


class OwnerDashboardStats(BaseModel):
    total_restaurants: int
    total_reservations: int
    todays_reservations: int
    total_revenue_cents: int
    average_rating: Optional[float]
    total_reviews: int
    current_period_reservations: int
    previous_period_reservations: int
    current_period_revenue_cents: int
    previous_period_revenue_cents: int


class DailyRevenue(BaseModel):
    date: date
    amount: int


class HourlyCount(BaseModel):
    hour: int
    count: int


class PartySizeCount(BaseModel):
    party_size: int
    count: int


class CustomerLoyalty(BaseModel):
    new_customers: int
    repeat_customers: int


class OwnerTrendStats(BaseModel):
    reservation_trends: list[DailyCount]
    revenue_trends: list[DailyRevenue]
    reservation_status_breakdown: ReservationStatusBreakdown
    peak_hours: list[HourlyCount]
    party_size_distribution: list[PartySizeCount]
    customer_loyalty: CustomerLoyalty
