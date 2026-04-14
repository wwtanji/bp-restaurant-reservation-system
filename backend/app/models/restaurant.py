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
    from app.models.restaurant_details import RestaurantDetails
    from app.models.restaurant_hours import RestaurantHours
    from app.models.menu import MenuCategory
    from app.models.faq import FaqItem


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

    details: Mapped[Optional["RestaurantDetails"]] = relationship(
        "RestaurantDetails",
        back_populates="restaurant",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    hours: Mapped[list["RestaurantHours"]] = relationship(
        "RestaurantHours",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    menu_categories: Mapped[list["MenuCategory"]] = relationship(
        "MenuCategory",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        order_by="MenuCategory.position",
        lazy="selectin",
    )

    faq_items: Mapped[list["FaqItem"]] = relationship(
        "FaqItem",
        back_populates="restaurant",
        cascade="all, delete-orphan",
        order_by="FaqItem.position",
        lazy="selectin",
    )
