from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.payment_schema import (
    PaymentCreate,
    PaymentOut,
    TransactionOut,
    CheckoutSessionResponse,
)
from app.services import payment_service
from app.utils.rbac import require_customer

PAYMENT_CONTROLLER = APIRouter(prefix="/payments")


@PAYMENT_CONTROLLER.post(
    "/create-session", response_model=CheckoutSessionResponse, status_code=201
)
def create_checkout_session(
    data: PaymentCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return payment_service.create_checkout_session(db, current_user, data.reservation_id)


@PAYMENT_CONTROLLER.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    event = payment_service.verify_webhook_signature(payload, sig_header)

    if event.type == "checkout.session.completed":
        payment_service.handle_checkout_completed(db, event.data.object)
    elif event.type == "checkout.session.expired":
        payment_service.handle_checkout_expired(db, event.data.object)
    elif event.type == "charge.refunded":
        payment_service.handle_charge_refunded(db, event.data.object)

    return {"status": "ok"}


@PAYMENT_CONTROLLER.get("/my", response_model=list[TransactionOut])
def list_my_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return payment_service.list_user_payments(db, current_user.id, skip, limit)


@PAYMENT_CONTROLLER.get(
    "/by-session/{session_id}", response_model=PaymentOut
)
def get_payment_by_session(
    session_id: str,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return payment_service.get_payment_by_session(db, session_id, current_user.id)


@PAYMENT_CONTROLLER.get(
    "/{reservation_id}", response_model=PaymentOut
)
def get_payment_status(
    reservation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return payment_service.get_payment_by_reservation(
        db, reservation_id, current_user.id
    )
