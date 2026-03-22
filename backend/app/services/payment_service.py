import os
import time

import stripe
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.payment import Payment, PaymentStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

CURRENCY = "eur"
SESSION_EXPIRY_SECONDS = 1800


def create_checkout_session(
    db: Session,
    current_user: User,
    reservation_id: int,
) -> dict[str, str]:
    reservation = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.id == reservation_id)
        .first()
    )

    if not reservation or reservation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.status not in (ReservationStatus.PENDING, ReservationStatus.CONFIRMED):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pay for a reservation with status '{reservation.status}'",
        )

    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation_id,
            Payment.status == PaymentStatus.PAID,
        )
        .first()
    )
    if existing_payment:
        raise HTTPException(status_code=409, detail="Reservation is already paid")

    amount = reservation.restaurant.reservation_fee
    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="This restaurant does not require payment for reservations",
        )

    pending_payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation_id,
            Payment.status == PaymentStatus.PENDING,
        )
        .first()
    )
    if pending_payment:
        try:
            session = stripe.checkout.Session.retrieve(pending_payment.stripe_session_id)
            if session.status == "open":
                return {
                    "checkout_url": session.url,
                    "session_id": session.id,
                }
        except stripe.StripeError:
            pass
        pending_payment.status = PaymentStatus.EXPIRED
        db.commit()

    restaurant_name = reservation.restaurant.name
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": CURRENCY,
                    "unit_amount": amount,
                    "product_data": {
                        "name": f"Reservation deposit - {restaurant_name}",
                        "description": (
                            f"Table for {reservation.party_size} on "
                            f"{reservation.reservation_date}"
                        ),
                    },
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        client_reference_id=str(reservation_id),
        success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/payment/cancel?reservation_id={reservation_id}",
        expires_at=int(time.time()) + SESSION_EXPIRY_SECONDS,
        idempotency_key=f"checkout_{reservation_id}_{db.query(Payment).filter(Payment.reservation_id == reservation_id).count()}",
    )

    payment = Payment(
        reservation_id=reservation_id,
        stripe_session_id=session.id,
        amount=amount,
        currency=CURRENCY,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()

    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    try:
        return stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")


def handle_checkout_completed(db: Session, session: stripe.checkout.Session) -> None:
    payment = (
        db.query(Payment)
        .filter(Payment.stripe_session_id == session.id)
        .first()
    )
    if not payment or payment.status == PaymentStatus.PAID:
        return

    payment.status = PaymentStatus.PAID

    reservation = db.query(Reservation).filter(
        Reservation.id == payment.reservation_id
    ).first()

    if reservation and reservation.status == ReservationStatus.PENDING:
        reservation.status = ReservationStatus.CONFIRMED

    db.commit()


def handle_checkout_expired(db: Session, session: stripe.checkout.Session) -> None:
    payment = (
        db.query(Payment)
        .filter(Payment.stripe_session_id == session.id)
        .first()
    )
    if not payment:
        return

    payment.status = PaymentStatus.EXPIRED
    db.commit()


def list_user_payments(
    db: Session, user_id: int, skip: int, limit: int
) -> list[dict]:
    from app.models.restaurant import Restaurant

    payments = (
        db.query(Payment)
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .join(Restaurant, Reservation.restaurant_id == Restaurant.id)
        .filter(Reservation.user_id == user_id)
        .options(
            joinedload(Payment.reservation).joinedload(Reservation.restaurant)
        )
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": p.id,
            "reservation_id": p.reservation_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "created_at": p.created_at,
            "restaurant_name": p.reservation.restaurant.name,
            "reservation_date": p.reservation.reservation_date,
            "party_size": p.reservation.party_size,
        }
        for p in payments
    ]


def get_payment_by_session(db: Session, session_id: str, user_id: int) -> Payment:
    payment = (
        db.query(Payment)
        .filter(Payment.stripe_session_id == session_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    reservation = db.query(Reservation).filter(
        Reservation.id == payment.reservation_id,
        Reservation.user_id == user_id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment


def get_payment_by_reservation(db: Session, reservation_id: int, user_id: int) -> Payment:
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == user_id,
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    payment = (
        db.query(Payment)
        .filter(Payment.reservation_id == reservation_id)
        .order_by(Payment.created_at.desc())
        .first()
    )

    if not payment:
        raise HTTPException(status_code=404, detail="No payment found for this reservation")

    return payment
