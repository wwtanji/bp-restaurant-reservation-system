from datetime import datetime

from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base, get_utc_now
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.reservation import Reservation
    from app.models.review import Review
    from app.models.favorite import Favorite
    from app.models.table import Table


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cuisine: Mapped[str] = mapped_column(String(50), nullable=False)

    price_range: Mapped[int] = mapped_column(Integer, nullable=False, default=2)

    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    address: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(60), nullable=False, default="Slovakia")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gallery_images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    reservation_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=500)
    opening_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    overview_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    highlights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    dining_style: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dress_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    parking_details: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    payment_options: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    neighborhood: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cross_street: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    executive_chef: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    public_transit: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    catering_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    private_party_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_takeout: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    menu: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    faqs: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_utc_now, nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, onupdate=get_utc_now, nullable=True
    )

    owner: Mapped["User"] = relationship("User", back_populates="restaurants")

    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation", back_populates="restaurant", cascade="all, delete-orphan"
    )

    tables: Mapped[list["Table"]] = relationship(
        "Table", back_populates="restaurant", cascade="all, delete-orphan"
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="restaurant", cascade="all, delete-orphan"
    )

    favorites: Mapped[list["Favorite"]] = relationship(
        "Favorite", back_populates="restaurant", cascade="all, delete-orphan"
    )
