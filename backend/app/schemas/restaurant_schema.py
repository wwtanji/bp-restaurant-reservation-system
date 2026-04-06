from pydantic import BaseModel, ConfigDict
from typing import Optional


class MenuItemSchema(BaseModel):
    name: str
    price: str
    description: Optional[str] = None


class MenuCategorySchema(BaseModel):
    name: str
    items: list[MenuItemSchema]


class FaqItemSchema(BaseModel):
    question: str
    answer: str


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
    reservation_fee: int
    is_active: bool
    opening_hours: Optional[dict] = None
    overview_text: Optional[str] = None
    highlights: Optional[list[str]] = None
    website: Optional[str] = None
    dining_style: Optional[str] = None
    dress_code: Optional[str] = None
    parking_details: Optional[str] = None
    payment_options: Optional[str] = None
    neighborhood: Optional[str] = None
    cross_street: Optional[str] = None
    executive_chef: Optional[str] = None
    public_transit: Optional[str] = None
    catering_info: Optional[str] = None
    private_party_info: Optional[str] = None
    additional_info: Optional[str] = None
    delivery_takeout: Optional[str] = None
    menu: Optional[list[MenuCategorySchema]] = None
    faqs: Optional[list[FaqItemSchema]] = None

    model_config = ConfigDict(from_attributes=True)


class RestaurantBrief(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    city: str
    cover_image: Optional[str]

    model_config = ConfigDict(from_attributes=True)
