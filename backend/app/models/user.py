from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.refresh_token import RefreshToken
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


def get_utc_now():
    return datetime.now(timezone.utc)


class UserRole:
    """User role constants"""

    CUSTOMER = 0
    RESTAURANT_OWNER = 1
    ADMIN = 2


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[int] = mapped_column(nullable=False, default=UserRole.CUSTOMER)
    first_name: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    user_email: Mapped[str] = mapped_column(
        String(40), nullable=False, unique=True, index=True
    )
    user_password: Mapped[str] = mapped_column(String(80), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Email verification
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # force protection
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(default=get_utc_now)
    edited_at: Mapped[datetime] = mapped_column(onupdate=get_utc_now, nullable=True)

    # Relationship with refresh tokens
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )

    # Relationship with restaurants
    restaurants: Mapped[list["Restaurant"]] = relationship(
        "Restaurant", back_populates="owner", cascade="all, delete-orphan"
    )
