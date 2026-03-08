from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.user_schema import (
    UserRegister,
    UserLogin,
    UserProfile,
    UserProfileUpdate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    EmailVerificationRequest,
    RegistrationResponse,
    MessageResponse,
)
from app.schemas.token_schema import TokenResponse, TokenRefreshRequest, LogoutResponse
from app.services import auth_service
from app.utils.rate_limiter import rate_limit_auth_endpoints, rate_limit_strict
from app.utils.rbac import get_current_user

AUTH_CONTROLLER = APIRouter(prefix="/authentication")


@AUTH_CONTROLLER.post(
    "/register",
    response_model=RegistrationResponse,
    dependencies=[Depends(rate_limit_auth_endpoints)],
)
def register(user: UserRegister, db: Session = Depends(get_db)):
    new_user = auth_service.register_user(db, user)
    return {
        "message": "Registration successful. You can now log in immediately.",
        "email": new_user.user_email,
    }


@AUTH_CONTROLLER.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth_endpoints)],
)
def login(user: UserLogin, db: Session = Depends(get_db)):
    authenticated_user = auth_service.authenticate_user(
        db, user.user_email, user.user_password
    )
    return auth_service.create_auth_tokens(db, authenticated_user)


@AUTH_CONTROLLER.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_auth_tokens(db, refresh_request.refresh_token)


@AUTH_CONTROLLER.post("/logout", response_model=LogoutResponse)
def logout(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    auth_service.logout_user(db, refresh_request.refresh_token)
    return {"message": "Successfully logged out"}


@AUTH_CONTROLLER.post("/logout-all", response_model=LogoutResponse)
def logout_all(refresh_request: TokenRefreshRequest, db: Session = Depends(get_db)):
    auth_service.logout_all_devices(db, refresh_request.refresh_token)
    return {"message": "Successfully logged out from all devices"}


@AUTH_CONTROLLER.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@AUTH_CONTROLLER.put("/me", response_model=UserProfile)
def update_me(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.update_user_profile(db, current_user, update)


@AUTH_CONTROLLER.put("/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_user_password(
        db, current_user, request.current_password, request.new_password
    )
    return {"message": "Password changed successfully"}


@AUTH_CONTROLLER.post("/verify-email", response_model=RegistrationResponse)
def verify_email(
    verification: EmailVerificationRequest, db: Session = Depends(get_db)
):
    user = auth_service.verify_email_token(db, verification.token)
    return {
        "message": "Email verified successfully. You can now log in.",
        "email": user.user_email,
    }


@AUTH_CONTROLLER.post(
    "/forgot-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit_strict)],
)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    auth_service.create_password_reset(db, request.user_email)
    return {
        "message": "If an account exists with this email, a password reset link has been sent."
    }


@AUTH_CONTROLLER.post(
    "/reset-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit_auth_endpoints)],
)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_user_password(db, request.token, request.new_password)
    return {
        "message": "Password reset successfully. You can now log in with your new password."
    }
