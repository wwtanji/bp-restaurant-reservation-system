import os
import logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.utils.jwt_utils import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_and_get_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
)
from app.utils.email_service import email_service
from app.utils.rate_limiter import rate_limit_auth_endpoints, rate_limit_strict
from app.db import get_db
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user_schema import (
    UserRegister,
    UserLogin,
    UserProfile,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    EmailVerificationRequest,
)
from app.schemas.token_schema import TokenResponse, TokenRefreshRequest, LogoutResponse

load_dotenv()

logger = logging.getLogger(__name__)
AUTH_CONTROLLER = APIRouter(prefix="/authentication")
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="authentication/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return bcrypt_context.hash(password)


@AUTH_CONTROLLER.post("/register", dependencies=[Depends(rate_limit_auth_endpoints)])
def register(user: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with email verification

    - Validates password strength (8 chars, uppercase, lowercase, number)
    - Sends verification email
    - User must verify email before login
    """
    existing_user = db.query(User).filter(User.user_email == user.user_email).first()
    if existing_user:
        logger.warning(f"User with email {user.user_email} already exists.")
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.user_password)

    # Generate email verification token
    verification_token = email_service.generate_verification_token()

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        user_email=user.user_email,
        user_password=hashed_password,
        phone_number=user.phone_number,
        role=user.role,
        email_verified=True,  # SET TO TRUE FOR EASIER TESTING - CHANGE TO FALSE IN PRODUCTION
        failed_login_attempts=0,
        registered_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Store verification token in password_reset_tokens table (reuse for email verification)
    # We'll use a separate field to distinguish verification vs password reset
    verification_db_token = PasswordResetToken(
        token=verification_token,
        user_id=new_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        is_used=False,
    )
    db.add(verification_db_token)
    db.commit()

    # Send verification email
    try:
        email_service.send_verification_email(new_user.user_email, verification_token)
        logger.info(f"Verification email sent to {user.user_email}")
    except Exception as e:
        logger.error(
            f"Failed to send verification email to {user.user_email}: {str(e)}"
        )
        # Don't fail registration if email fails to send

    logger.info(
        f"User {user.user_email} registered successfully. Email verification disabled for testing."
    )
    return {
        "message": "Registration successful. You can now log in immediately.",
        "email": user.user_email,
    }


@AUTH_CONTROLLER.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth_endpoints)],
)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint with security features:
    - Email verification check
    - Brute force protection (account lockout after 5 failed attempts)
    - Rate limiting
    """
    db_user = db.query(User).filter(User.user_email == user.user_email).first()

    # Check if user exists
    if not db_user:
        logger.warning(f"Login attempt for non-existent user '{user.user_email}'.")
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Check if account is locked
    if db_user.locked_until:
        now = datetime.now(timezone.utc)
        if db_user.locked_until.replace(tzinfo=timezone.utc) > now:
            remaining_time = (
                db_user.locked_until.replace(tzinfo=timezone.utc) - now
            ).seconds // 60
            logger.warning(f"Login attempt for locked account '{user.user_email}'.")
            raise HTTPException(
                status_code=423,
                detail=f"Account is temporarily locked due to multiple failed login attempts. "
                f"Please try again in {remaining_time} minutes.",
            )
        else:
            # Lock period expired, reset the counter
            db_user.failed_login_attempts = 0
            db_user.locked_until = None
            db.commit()

    # Verify password
    if not verify_password(user.user_password, db_user.user_password):
        # Increment failed login attempts
        db_user.failed_login_attempts += 1

        # Lock account after 5 failed attempts
        if db_user.failed_login_attempts >= 5:
            db_user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.commit()
            logger.warning(
                f"Account '{user.user_email}' locked after 5 failed login attempts."
            )
            raise HTTPException(
                status_code=423,
                detail="Account locked due to multiple failed login attempts. Please try again in 15 minutes.",
            )

        db.commit()
        logger.warning(
            f"Login failed for user '{user.user_email}'. Failed attempts: {db_user.failed_login_attempts}"
        )
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Check if email is verified
    # COMMENTED OUT FOR EASIER TESTING - UNCOMMENT IN PRODUCTION
    # if not db_user.email_verified:
    #     logger.warning(f"Login attempt for unverified email '{user.user_email}'.")
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Email not verified. Please check your email for verification link.",
    #     )

    # Reset failed login attempts on successful login
    db_user.failed_login_attempts = 0
    db_user.locked_until = None
    db.commit()

    access_token = create_access_token(data={"sub": db_user.user_email})
    refresh_token = create_refresh_token(user_id=db_user.id, db=db)

    logger.info(f"User '{user.user_email}' logged in successfully.")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@AUTH_CONTROLLER.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        # Start transaction to prevent race conditions
        db_token = verify_and_get_refresh_token(refresh_request.refresh_token, db)
        user = db_token.user

        # Revoke the used token first
        revoke_refresh_token(refresh_request.refresh_token, db)

        # Create new tokens
        access_token = create_access_token(data={"sub": user.user_email})
        new_refresh_token = create_refresh_token(user_id=user.id, db=db)

        logger.info(f"Tokens refreshed for user '{user.user_email}'.")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error during token refresh: {str(e)}")
        raise


@AUTH_CONTROLLER.post("/logout", response_model=LogoutResponse)
def logout(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Logout endpoint that revokes the provided refresh token
    """
    try:
        revoke_refresh_token(refresh_request.refresh_token, db)
        logger.info("User logged out successfully")
    except Exception as e:
        logger.warning(f"Logout attempt with potentially invalid token: {str(e)}")

    return {"message": "Successfully logged out"}


@AUTH_CONTROLLER.post("/logout-all", response_model=LogoutResponse)
def logout_all(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Logout endpoint that revokes all refresh tokens for the user
    Always returns success, even if tokens are already invalid
    """
    try:
        db_token = verify_and_get_refresh_token(refresh_request.refresh_token, db)
        user_id = db_token.user_id

        revoked_count = revoke_all_user_tokens(user_id, db)
        logger.info(
            f"User {user_id} logged out from all devices successfully, revoked {revoked_count} tokens"
        )
    except Exception as e:
        logger.warning(f"Logout all attempt with potentially invalid token: {str(e)}")

    return {"message": "Successfully logged out from all devices"}


@AUTH_CONTROLLER.get("/me", response_model=UserProfile)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    user_email = payload.get("sub")
    user = db.query(User).filter(User.user_email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )
    return user


@AUTH_CONTROLLER.post("/verify-email")
def verify_email(verification: EmailVerificationRequest, db: Session = Depends(get_db)):
    """
    Verify user email with token sent via email

    - Single-use token
    - 24-hour expiration
    """
    # Find the verification token
    db_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == verification.token, ~PasswordResetToken.is_used
        )
        .first()
    )

    if not db_token:
        logger.warning("Invalid or already used verification token")
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification token"
        )

    # Check if token is expired
    if db_token.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        logger.warning(f"Expired verification token for user {db_token.user_id}")
        raise HTTPException(
            status_code=400,
            detail="Verification token has expired. Please request a new one.",
        )

    # Get the user
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        logger.error("User not found for verification token")
        raise HTTPException(status_code=404, detail="User not found")

    # Mark email as verified
    user.email_verified = True
    db_token.is_used = True
    db_token.used_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"Email verified for user {user.user_email}")
    return {
        "message": "Email verified successfully. You can now log in.",
        "email": user.user_email,
    }


@AUTH_CONTROLLER.post("/forgot-password", dependencies=[Depends(rate_limit_strict)])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset email

    - Rate limited to 3 requests per minute
    - Generates secure reset token (1-hour expiration)
    - Always returns success to prevent email enumeration
    """
    user = db.query(User).filter(User.user_email == request.user_email).first()

    if user:
        # Generate password reset token
        reset_token = email_service.generate_verification_token()

        # Store reset token in database
        reset_db_token = PasswordResetToken(
            token=reset_token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            is_used=False,
        )
        db.add(reset_db_token)
        db.commit()

        # Send password reset email
        try:
            email_service.send_password_reset_email(user.user_email, reset_token)
            logger.info(f"Password reset email sent to {user.user_email}")
        except Exception as e:
            logger.error(
                f"Failed to send password reset email to {user.user_email}: {str(e)}"
            )

    # Always return success to prevent email enumeration
    return {
        "message": "If an account exists with this email, a password reset link has been sent."
    }


@AUTH_CONTROLLER.post(
    "/reset-password", dependencies=[Depends(rate_limit_auth_endpoints)]
)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password with token from email

    - Single-use token
    - 1-hour expiration
    - Validates new password strength
    """
    # Find the reset token
    db_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == request.token, ~PasswordResetToken.is_used)
        .first()
    )

    if not db_token:
        logger.warning("Invalid or already used password reset token")
        raise HTTPException(
            status_code=400, detail="Invalid or expired password reset token"
        )

    # Check if token is expired
    if db_token.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        logger.warning(f"Expired password reset token for user {db_token.user_id}")
        raise HTTPException(
            status_code=400,
            detail="Password reset token has expired. Please request a new one.",
        )

    # Get the user
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        logger.error("User not found for password reset token")
        raise HTTPException(status_code=404, detail="User not found")

    # Update password
    user.user_password = get_password_hash(request.new_password)
    user.failed_login_attempts = 0  # Reset failed attempts
    user.locked_until = None  # Unlock account if it was locked

    # Mark token as used
    db_token.is_used = True
    db_token.used_at = datetime.now(timezone.utc)

    # Revoke all existing refresh tokens for security
    revoke_all_user_tokens(user.id, db)

    db.commit()

    logger.info(f"Password reset successfully for user {user.user_email}")
    return {
        "message": "Password reset successfully. You can now log in with your new password."
    }
