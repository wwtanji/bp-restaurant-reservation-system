import logging
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user_schema import UserRegister, UserProfileUpdate
from app.utils.jwt_utils import (
    create_access_token,
    create_refresh_token,
    verify_and_get_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
)
from app.utils.email_service import email_service

logger = logging.getLogger(__name__)
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_FAILED_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_MINUTES = 15
VERIFICATION_TOKEN_HOURS = 24
RESET_TOKEN_HOURS = 1


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return bcrypt_context.hash(password)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.user_email == email).first()


def _validate_and_consume_token(
    db: Session, token: str, error_label: str
) -> tuple[PasswordResetToken, User]:
    db_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == token, ~PasswordResetToken.is_used)
        .first()
    )

    if not db_token:
        raise HTTPException(
            status_code=400, detail=f"Invalid or expired {error_label} token"
        )

    if db_token.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(
            status_code=400,
            detail=f"{error_label.title()} token has expired. Please request a new one.",
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_token.is_used = True
    db_token.used_at = datetime.now(timezone.utc)

    return db_token, user


def register_user(db: Session, user_data: UserRegister) -> User:
    existing_user = get_user_by_email(db, user_data.user_email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.user_password)
    verification_token = email_service.generate_verification_token()

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        user_email=user_data.user_email,
        user_password=hashed_password,
        phone_number=user_data.phone_number,
        role=user_data.role,
        email_verified=True,
        failed_login_attempts=0,
        registered_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_db_token = PasswordResetToken(
        token=verification_token,
        user_id=new_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_HOURS),
        is_used=False,
    )
    db.add(verification_db_token)
    db.commit()

    try:
        email_service.send_verification_email(new_user.user_email, verification_token)
    except Exception:
        logger.error(f"Failed to send verification email to {user_data.user_email}")

    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    db_user = get_user_by_email(db, email)

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if db_user.locked_until:
        now = datetime.now(timezone.utc)
        if db_user.locked_until.replace(tzinfo=timezone.utc) > now:
            remaining_time = (
                db_user.locked_until.replace(tzinfo=timezone.utc) - now
            ).seconds // 60
            raise HTTPException(
                status_code=423,
                detail=f"Account is temporarily locked due to multiple failed login attempts. "
                f"Please try again in {remaining_time} minutes.",
            )
        else:
            db_user.failed_login_attempts = 0
            db_user.locked_until = None
            db.commit()

    if not verify_password(password, db_user.user_password):
        db_user.failed_login_attempts += 1

        if db_user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            db_user.locked_until = datetime.now(timezone.utc) + timedelta(
                minutes=ACCOUNT_LOCKOUT_MINUTES
            )
            db.commit()
            raise HTTPException(
                status_code=423,
                detail=f"Account locked due to multiple failed login attempts. "
                f"Please try again in {ACCOUNT_LOCKOUT_MINUTES} minutes.",
            )

        db.commit()
        raise HTTPException(status_code=400, detail="Invalid email or password")

    db_user.failed_login_attempts = 0
    db_user.locked_until = None
    db.commit()

    return db_user


def create_auth_tokens(db: Session, user: User) -> dict[str, str]:
    access_token = create_access_token(data={"sub": user.user_email})
    refresh_token = create_refresh_token(user_id=user.id, db=db)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def refresh_auth_tokens(db: Session, refresh_token_str: str) -> dict[str, str]:
    try:
        db_token = verify_and_get_refresh_token(refresh_token_str, db)
        user = db_token.user

        revoke_refresh_token(refresh_token_str, db)

        access_token = create_access_token(data={"sub": user.user_email})
        new_refresh_token = create_refresh_token(user_id=user.id, db=db)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    except Exception:
        db.rollback()
        raise


def logout_user(db: Session, refresh_token_str: str) -> None:
    try:
        revoke_refresh_token(refresh_token_str, db)
    except Exception:
        logger.warning(f"Failed to revoke refresh token during logout")


def logout_all_devices(db: Session, refresh_token_str: str) -> None:
    try:
        db_token = verify_and_get_refresh_token(refresh_token_str, db)
        revoke_all_user_tokens(db_token.user_id, db)
    except Exception:
        logger.warning(f"Failed to revoke all tokens during logout-all")


def verify_email_token(db: Session, token: str) -> User:
    _, user = _validate_and_consume_token(db, token, "verification")
    user.email_verified = True
    db.commit()
    return user


def create_password_reset(db: Session, email: str) -> None:
    user = get_user_by_email(db, email)

    if user:
        reset_token = email_service.generate_verification_token()

        reset_db_token = PasswordResetToken(
            token=reset_token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_HOURS),
            is_used=False,
        )
        db.add(reset_db_token)
        db.commit()

        try:
            email_service.send_password_reset_email(user.user_email, reset_token)
        except Exception:
            logger.error(
                f"Failed to send password reset email to {user.user_email}"
            )


def reset_user_password(db: Session, token: str, new_password: str) -> None:
    _, user = _validate_and_consume_token(db, token, "password reset")

    user.user_password = get_password_hash(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None

    revoke_all_user_tokens(user.id, db)

    db.commit()


def update_user_profile(
    db: Session, user: User, update_data: UserProfileUpdate
) -> User:
    user.first_name = update_data.first_name
    user.last_name = update_data.last_name
    if update_data.phone_number is not None:
        user.phone_number = update_data.phone_number if update_data.phone_number else None
    db.commit()
    db.refresh(user)
    return user


def change_user_password(
    db: Session, user: User, current_password: str, new_password: str
) -> None:
    if not verify_password(current_password, user.user_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.user_password = get_password_hash(new_password)
    db.commit()
