from datetime import datetime

from sqlalchemy import Integer, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base, get_utc_now
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant
    from app.models.reservation import Reservation


class Table(Base):
    __tablename__ = "restaurant_tables"

    __table_args__ = (
        UniqueConstraint("restaurant_id", "table_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    table_number: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_utc_now, nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, onupdate=get_utc_now, nullable=True
    )

    restaurant: Mapped["Restaurant"] = relationship(
        "Restaurant", back_populates="tables"
    )
    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation", back_populates="table"
    )
