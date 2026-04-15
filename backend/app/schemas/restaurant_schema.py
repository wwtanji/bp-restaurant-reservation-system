from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, Any


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


def _hours_to_dict(hours: list) -> Optional[dict]:
    if not hours:
        return None
    return {
        h.day_of_week: {
            "open": h.open_time.strftime("%H:%M") if h.open_time else "09:00",
            "close": h.close_time.strftime("%H:%M") if h.close_time else "22:00",
            "is_closed": h.is_closed,
        }
        for h in hours
    }


def _categories_to_list(categories: list) -> Optional[list[MenuCategorySchema]]:
    if not categories:
        return None
    return [
        MenuCategorySchema(
            name=cat.name,
            items=[
                MenuItemSchema(name=item.name, price=item.price, description=item.description)
                for item in cat.items
            ],
        )
        for cat in categories
    ]


def populate_restaurant_relations(obj: Any) -> Any:
    if obj.details:
        obj.website = obj.details.website
        obj.dining_style = obj.details.dining_style
        obj.dress_code = obj.details.dress_code
        obj.parking_details = obj.details.parking_details
        obj.payment_options = obj.details.payment_options
        obj.neighborhood = obj.details.neighborhood
        obj.cross_street = obj.details.cross_street
        obj.executive_chef = obj.details.executive_chef
        obj.public_transit = obj.details.public_transit
        obj.delivery_takeout = obj.details.delivery_takeout
        obj.catering_info = obj.details.catering_info
        obj.private_party_info = obj.details.private_party_info
        obj.additional_info = obj.details.additional_info
        obj.overview_text = obj.details.overview_text
        obj.highlights = obj.details.highlights
    if obj.hours:
        obj.opening_hours = _hours_to_dict(obj.hours)
    if obj.menu_categories:
        obj.menu = _categories_to_list(obj.menu_categories)
    if obj.faq_items:
        obj.faqs = [
            FaqItemSchema(question=f.question, answer=f.answer)
            for f in obj.faq_items
        ]
    return obj


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

    website: Optional[str] = None
    dining_style: Optional[str] = None
    dress_code: Optional[str] = None
    parking_details: Optional[str] = None
    payment_options: Optional[str] = None
    neighborhood: Optional[str] = None
    cross_street: Optional[str] = None
    executive_chef: Optional[str] = None
    public_transit: Optional[str] = None
    delivery_takeout: Optional[str] = None
    catering_info: Optional[str] = None
    private_party_info: Optional[str] = None
    additional_info: Optional[str] = None
    overview_text: Optional[str] = None
    highlights: Optional[list[str]] = None
    opening_hours: Optional[dict] = None
    menu: Optional[list[MenuCategorySchema]] = None
    faqs: Optional[list[FaqItemSchema]] = None

    details: Optional[Any] = Field(None, exclude=True)
    hours: list[Any] = Field(default_factory=list, exclude=True)
    menu_categories: list[Any] = Field(default_factory=list, exclude=True)
    faq_items: list[Any] = Field(default_factory=list, exclude=True)

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def flatten_relations(self) -> "RestaurantOut":
        return populate_restaurant_relations(self)


class RestaurantBrief(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    city: str
    cover_image: Optional[str]

    model_config = ConfigDict(from_attributes=True)
