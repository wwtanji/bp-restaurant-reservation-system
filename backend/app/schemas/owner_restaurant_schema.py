import re
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional


HH_MM_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


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
    opening_hours: Optional[OpeningHoursSchema] = None

    @field_validator("price_range")
    @classmethod
    def validate_price_range(cls, value: int) -> int:
        if value < 1 or value > 4:
            raise ValueError("Price range must be between 1 and 4")
        return value

    @field_validator("max_capacity")
    @classmethod
    def validate_max_capacity(cls, value: int) -> int:
        if value < 1:
            raise ValueError("Max capacity must be at least 1")
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
    opening_hours: Optional[OpeningHoursSchema] = None

    @field_validator("price_range")
    @classmethod
    def validate_price_range(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and (value < 1 or value > 4):
            raise ValueError("Price range must be between 1 and 4")
        return value

    @field_validator("max_capacity")
    @classmethod
    def validate_max_capacity(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 1:
            raise ValueError("Max capacity must be at least 1")
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
