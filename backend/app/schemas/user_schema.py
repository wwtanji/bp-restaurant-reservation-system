from datetime import datetime

from pydantic import BaseModel, EmailStr, constr, field_validator, ConfigDict
from typing import Optional, Annotated
from email_validator import validate_email, EmailNotValidError
from enum import IntEnum

from app.schemas.validators import validate_password_strength


class UserRole(IntEnum):
    CUSTOMER = 0
    RESTAURANT_OWNER = 1
    ADMIN = 2


class UserRegister(BaseModel):
    role: UserRole = UserRole.CUSTOMER
    first_name: Annotated[str, constr(max_length=15)]
    last_name: Annotated[str, constr(max_length=15)]
    user_email: EmailStr
    user_password: Annotated[str, constr(min_length=8, max_length=80)]
    phone_number: Optional[Annotated[str, constr(max_length=20)]] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: int) -> int:
        try:
            return UserRole(value)
        except ValueError:
            raise ValueError(
                f"Invalid role. Must be one of: {[role.value for role in UserRole]}"
            )

    @field_validator("user_password")
    @classmethod
    def check_password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class UserLogin(BaseModel):
    user_email: EmailStr
    user_password: Annotated[str, constr(min_length=8)]

    @field_validator("user_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        try:
            valid = validate_email(value)
            return valid.email
        except EmailNotValidError as e:
            raise ValueError(str(e)) from e

    @field_validator("user_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: Optional[str] = None


class UserProfile(BaseModel):
    id: int
    first_name: str
    last_name: str
    user_email: EmailStr
    phone_number: Optional[str] = None
    role: UserRole
    email_verified: bool = False
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ForgotPasswordRequest(BaseModel):
    user_email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: Annotated[str, constr(min_length=8, max_length=80)]

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class EmailVerificationRequest(BaseModel):
    token: str


class UserProfileUpdate(BaseModel):
    first_name: Annotated[str, constr(min_length=1)]
    last_name: Annotated[str, constr(min_length=1)]
    phone_number: Optional[Annotated[str, constr(max_length=20)]] = None


class ChangePasswordRequest(BaseModel):
    current_password: Annotated[str, constr(min_length=8)]
    new_password: Annotated[str, constr(min_length=8, max_length=80)]

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class MessageResponse(BaseModel):
    message: str


class RegistrationResponse(BaseModel):
    message: str
    email: str
