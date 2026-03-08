from pydantic import BaseModel, ConfigDict
from typing import Optional


class RestaurantOut(BaseModel):
    id: int
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
    is_active: bool
    opening_hours: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class RestaurantBrief(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    city: str
    cover_image: Optional[str]

    model_config = ConfigDict(from_attributes=True)
