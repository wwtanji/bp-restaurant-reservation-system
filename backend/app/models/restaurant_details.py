from sqlalchemy import String, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class RestaurantDetails(Base):
    __tablename__ = "restaurant_details"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id"), unique=True, nullable=False
    )

    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    dining_style: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dress_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    parking_details: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    payment_options: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    neighborhood: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cross_street: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    executive_chef: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    public_transit: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    delivery_takeout: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    catering_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    private_party_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    overview_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    highlights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="details")
