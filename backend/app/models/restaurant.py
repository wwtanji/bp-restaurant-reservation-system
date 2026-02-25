from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.reservation import Reservation


def get_utc_now():
    return datetime.now(timezone.utc)


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

    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

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
