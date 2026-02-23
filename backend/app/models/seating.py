from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant
    from app.models.reservation import Reservation, ReservationHold


class SeatingArea(Base):
    """A named area within a restaurant (e.g. 'Open Kitchen', 'Terrace')."""

    __tablename__ = "seating_areas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    restaurant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="seating_areas")
    table_types: Mapped[list["TableType"]] = relationship(
        "TableType", back_populates="seating_area", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<SeatingArea {self.name} (restaurant_id={self.restaurant_id})>"


class TableType(Base):
    """A type of table within a seating area (e.g. 'High Top', 'Standard')."""

    __tablename__ = "table_types"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    seating_area_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("seating_areas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Denormalised for simpler availability queries
    restaurant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity_min: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    capacity_max: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    seating_area: Mapped["SeatingArea"] = relationship("SeatingArea", back_populates="table_types")
    holds: Mapped[list["ReservationHold"]] = relationship("ReservationHold", back_populates="table_type")
    reservations: Mapped[list["Reservation"]] = relationship("Reservation", back_populates="table_type")

    def __repr__(self) -> str:
        return f"<TableType {self.name} (area_id={self.seating_area_id})>"
