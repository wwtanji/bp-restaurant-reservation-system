from datetime import time
from sqlalchemy import String, ForeignKey, Time, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class RestaurantHours(Base):
    __tablename__ = "restaurant_hours"
    __table_args__ = (UniqueConstraint("restaurant_id", "day_of_week"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(10), nullable=False)
    open_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    close_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    is_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="hours")
