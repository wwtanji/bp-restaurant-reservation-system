from pydantic import BaseModel, ConfigDict
from datetime import datetime


class PaymentCreate(BaseModel):
    reservation_id: int


class PaymentBrief(BaseModel):
    id: int
    status: str
    amount: int
    currency: str

    model_config = ConfigDict(from_attributes=True)


class PaymentOut(BaseModel):
    id: int
    reservation_id: int
    stripe_session_id: str
    amount: int
    currency: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str
