from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Boolean, Integer, JSON, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, List, Dict, Any


def get_utc_now():
    return datetime.now(timezone.utc)


class Restaurant(Base):
    __tablename__ = "restaurants"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Owner relationship (FK to User)
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Location
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="Slovakia")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Cuisine & Categories
    cuisine_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    cuisines: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Capacity & Tables
    total_tables: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Operating Hours (stored as JSON for flexibility)
    # Format: {"monday": {"open": "10:00", "close": "22:00", "is_closed": false}, ...}
    operating_hours: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)

    # Pricing
    price_range: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    avg_price_per_person: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Features & Amenities (stored as JSON array)
    amenities: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    # Payment Methods
    payment_methods: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    # Dietary Options
    dietary_options: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    # Images
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gallery_images: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    # Ratings & Reviews
    average_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Business Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_deposit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deposit_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Cancellation Policy
    cancellation_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    cancellation_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="restaurants")
    # Uncomment these when creating the respective models
    # tables: Mapped[List["Table"]] = relationship("Table", back_populates="restaurant", cascade="all, delete-orphan")
    # reservations: Mapped[List["Reservation"]] = relationship("Reservation", back_populates="restaurant", cascade="all, delete-orphan")
    # reviews: Mapped[List["Review"]] = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Restaurant {self.name} (ID: {self.id})>"
