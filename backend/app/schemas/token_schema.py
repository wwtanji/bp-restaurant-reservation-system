from pydantic import BaseModel
from datetime import datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    exp: datetime | None = None


class LogoutResponse(BaseModel):
    message: str
