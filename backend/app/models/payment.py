import enum
from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base, get_utc_now
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.reservation import Reservation


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)

    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id"), nullable=False, unique=True, index=True
    )

    stripe_session_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )

    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="eur")

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=PaymentStatus.PENDING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_utc_now, nullable=False
    )

    reservation: Mapped["Reservation"] = relationship("Reservation", overlaps="payment")
