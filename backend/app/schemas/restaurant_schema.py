from pydantic import BaseModel, EmailStr, field_validator, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException
import re


class DayOperatingHours(BaseModel):
    open: str = Field(..., description="Opening time in HH:MM format")
    close: str = Field(..., description="Closing time in HH:MM format")
    is_closed: bool = Field(
        default=False, description="Whether the restaurant is closed on this day"
    )

    @field_validator("open", "close")
    @classmethod
    def validate_time_format(cls, value: str) -> str:
        """Validate time is in HH:MM format (24-hour)"""
        if not re.match(r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$", value):
            raise HTTPException(
                status_code=422,
                detail=f"Time must be in HH:MM format (24-hour). Got: {value}",
            )
        return value


class OperatingHours(BaseModel):
    monday: DayOperatingHours
    tuesday: DayOperatingHours
    wednesday: DayOperatingHours
    thursday: DayOperatingHours
    friday: DayOperatingHours
    saturday: DayOperatingHours
    sunday: DayOperatingHours


class RestaurantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Restaurant name")
    description: Optional[str] = Field(None, description="Restaurant description")
    email: EmailStr = Field(..., description="Restaurant contact email")
    phone: str = Field(
        ..., min_length=5, max_length=20, description="Restaurant phone number"
    )
    website: Optional[str] = Field(
        None, max_length=255, description="Restaurant website URL"
    )

    address: str = Field(
        ..., min_length=1, max_length=500, description="Street address"
    )
    city: str = Field(..., min_length=1, max_length=100, description="City")
    postal_code: str = Field(
        ..., min_length=1, max_length=20, description="Postal code"
    )
    country: str = Field(default="Slovakia", max_length=100, description="Country")
    latitude: Optional[float] = Field(
        None, ge=-90, le=90, description="Latitude coordinate"
    )
    longitude: Optional[float] = Field(
        None, ge=-180, le=180, description="Longitude coordinate"
    )

    cuisine_type: str = Field(
        ..., min_length=1, max_length=100, description="Primary cuisine type"
    )
    cuisines: Optional[List[str]] = Field(
        None, description="List of cuisine types offered"
    )

    total_tables: int = Field(default=0, ge=0, description="Total number of tables")
    total_capacity: int = Field(default=0, ge=0, description="Total seating capacity")

    operating_hours: Dict[str, Any] = Field(..., description="Weekly operating hours")

    price_range: int = Field(
        default=2, ge=1, le=4, description="Price range (1-4 scale)"
    )
    avg_price_per_person: Optional[float] = Field(
        None, ge=0, description="Average price per person in EUR"
    )

    amenities: Optional[List[str]] = Field(None, description="List of amenities")
    payment_methods: Optional[List[str]] = Field(
        None, description="Accepted payment methods"
    )
    dietary_options: Optional[List[str]] = Field(
        None, description="Dietary options available"
    )

    logo_url: Optional[str] = Field(
        None, max_length=500, description="Restaurant logo URL"
    )
    cover_image_url: Optional[str] = Field(
        None, max_length=500, description="Cover image URL"
    )
    gallery_images: Optional[List[str]] = Field(None, description="Gallery image URLs")

    requires_deposit: bool = Field(
        default=False, description="Whether deposit is required"
    )
    deposit_amount: Optional[float] = Field(
        None, ge=0, description="Deposit amount in EUR"
    )
    cancellation_hours: int = Field(
        default=24, ge=0, description="Cancellation notice in hours"
    )
    cancellation_policy: Optional[str] = Field(
        None, description="Detailed cancellation policy"
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate phone number format"""
        # Remove spaces and common separators
        cleaned = re.sub(r"[\s\-\(\)]", "", value)
        if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
            raise HTTPException(
                status_code=422,
                detail="Phone number must contain 7-15 digits and may start with +",
            )
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: Optional[str]) -> Optional[str]:
        if value and not re.match(r"^https?://", value):
            raise HTTPException(
                status_code=422,
            )
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: Optional[str]) -> Optional[str]:
        if value and not re.match(r"^https?://", value):
            raise HTTPException(
                status_code=422,
            )
        return value


class RestaurantCreate(RestaurantBase):
    """Schema for creating a new restaurant"""

    slug: Optional[str] = Field(
        None,
        max_length=255,
        description="URL-friendly slug (auto-generated if not provided)",
    )

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: Optional[str]) -> Optional[str]:
        if value and not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", value):
            raise HTTPException(
                status_code=422,
            )
        return value


class RestaurantUpdate(BaseModel):
    """Schema for updating a restaurant (all fields optional)"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=5, max_length=20)
    website: Optional[str] = Field(None, max_length=255)

    address: Optional[str] = Field(None, min_length=1, max_length=500)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    cuisine_type: Optional[str] = Field(None, min_length=1, max_length=100)
    cuisines: Optional[List[str]] = None

    total_tables: Optional[int] = Field(None, ge=0)
    total_capacity: Optional[int] = Field(None, ge=0)

    operating_hours: Optional[Dict[str, Any]] = None

    price_range: Optional[int] = Field(None, ge=1, le=4)
    avg_price_per_person: Optional[float] = Field(None, ge=0)

    amenities: Optional[List[str]] = None
    payment_methods: Optional[List[str]] = None
    dietary_options: Optional[List[str]] = None

    logo_url: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    gallery_images: Optional[List[str]] = None

    is_active: Optional[bool] = None
    requires_deposit: Optional[bool] = None
    deposit_amount: Optional[float] = Field(None, ge=0)
    cancellation_hours: Optional[int] = Field(None, ge=0)
    cancellation_policy: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: Optional[str]) -> Optional[str]:
        """Validate slug format"""
        if value and not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", value):
            raise HTTPException(
                status_code=422,
                detail="Slug must be lowercase alphanumeric with hyphens only",
            )
        return value


class RestaurantResponse(RestaurantBase):
    """Schema for restaurant responses"""

    id: int
    owner_id: int
    slug: str

    # Ratings & Reviews
    average_rating: float = 0.0
    total_reviews: int = 0

    # Business Status
    is_active: bool = True
    is_verified: bool = False

    # Timestamps
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RestaurantListItem(BaseModel):
    """Simplified schema for restaurant lists"""

    id: int
    name: str
    slug: Optional[str] = None
    cuisine_type: str
    city: str
    address: Optional[str] = None
    price_range: int
    average_rating: float
    total_reviews: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_active: bool
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)
