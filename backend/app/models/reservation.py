import uuid
from datetime import datetime, timezone, date as date_type
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.restaurant import Restaurant
    from app.models.seating import TableType


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReservationHold(Base):
    """
    Temporary lock on a table slot while the user fills in their details.
    Automatically becomes invalid once expires_at passes.
    """

    __tablename__ = "reservation_holds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    restaurant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    table_type_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("table_types.id", ondelete="SET NULL"), nullable=True, index=True
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    time: Mapped[str] = mapped_column(String(10), nullable=False)  # "18:30"
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    availability_token: Mapped[str] = mapped_column(
        String(36), unique=True, nullable=False, index=True,
        default=lambda: str(uuid.uuid4()),
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )

    # Relationships
    table_type: Mapped[Optional["TableType"]] = relationship("TableType", back_populates="holds")

    def __repr__(self) -> str:
        return f"<ReservationHold token={self.availability_token} expires={self.expires_at}>"


class Reservation(Base):
    """A confirmed reservation created from a ReservationHold."""

    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    restaurant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    table_type_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("table_types.id", ondelete="SET NULL"), nullable=True, index=True
    )
    availability_token: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    time: Mapped[str] = mapped_column(String(10), nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)

    # Denormalised names preserved for history even if seating areas change
    seating_area_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    table_type_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    occasion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    special_requests: Mapped[Optional[str]] = mapped_column(String(75), nullable=True)

    # confirmed | cancelled | completed | no_show
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmed")

    opt_in_restaurant: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    opt_in_platform: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    opt_in_sms: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reservations")
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="reservations")
    table_type: Mapped[Optional["TableType"]] = relationship("TableType", back_populates="reservations")

    def __repr__(self) -> str:
        return f"<Reservation id={self.id} status={self.status}>"
