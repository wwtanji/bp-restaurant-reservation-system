import enum
from datetime import datetime, timezone, date, time
from sqlalchemy import String, Integer, Text, Date, Time, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.restaurant import Restaurant


def get_utc_now():
    return datetime.now(timezone.utc)


class ReservationStatus(str, enum.Enum):
    PENDING = "pending"       # created, awaiting confirmation
    CONFIRMED = "confirmed"   # restaurant confirmed it
    CANCELLED = "cancelled"   # cancelled by user or restaurant
    COMPLETED = "completed"   # dined successfully
    NO_SHOW = "no_show"       # customer didn't show up


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True)


    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id"), nullable=False, index=True
    )


    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    reservation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    reservation_time: Mapped[time] = mapped_column(Time, nullable=False)


    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ReservationStatus.PENDING
    )

    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_utc_now, nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, onupdate=get_utc_now, nullable=True
    )


    user: Mapped["User"] = relationship("User", back_populates="reservations")
    restaurant: Mapped["Restaurant"] = relationship(
        "Restaurant", back_populates="reservations"
    )
