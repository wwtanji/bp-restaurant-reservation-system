from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.reservation import Reservation, ReservationStatus
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.reservation_schema import ReservationCreate, ReservationOut, ReservationStatusUpdate
from app.utils.rbac import require_customer, require_restaurant_owner_or_admin

RESERVATION_CONTROLLER = APIRouter(prefix="/reservations")

# Which statuses an owner can transition to from each current status
_OWNER_TRANSITIONS: dict[str, list[str]] = {
    ReservationStatus.PENDING: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
    ],
    ReservationStatus.CONFIRMED: [
        ReservationStatus.COMPLETED,
        ReservationStatus.NO_SHOW,
        ReservationStatus.CANCELLED,
    ],
}


def _get_reservation_with_restaurant(reservation_id: int, db: Session) -> Reservation:
    reservation = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


# ── Customer endpoints ────────────────────────────────────────────────────────

@RESERVATION_CONTROLLER.post("/{restaurant_slug}", response_model=ReservationOut, status_code=201)
def create_reservation(
    restaurant_slug: str,
    data: ReservationCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.slug == restaurant_slug,
        Restaurant.is_active == True,  # noqa: E712
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.reservation_date < date.today():
        raise HTTPException(status_code=400, detail="Reservation date must be today or in the future")

    reservation = Reservation(
        user_id=current_user.id,
        restaurant_id=restaurant.id,
        party_size=data.party_size,
        reservation_date=data.reservation_date,
        reservation_time=data.reservation_time,
        special_requests=data.special_requests,
        status=ReservationStatus.PENDING,
    )
    db.add(reservation)
    db.commit()

    return _get_reservation_with_restaurant(reservation.id, db)


@RESERVATION_CONTROLLER.get("/my", response_model=list[ReservationOut])
def list_my_reservations(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.user_id == current_user.id)
        .order_by(Reservation.reservation_date.desc())
        .all()
    )


@RESERVATION_CONTROLLER.delete("/{reservation_id}", status_code=204)
def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    cancellable = {ReservationStatus.PENDING, ReservationStatus.CONFIRMED}
    if reservation.status not in cancellable:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a reservation with status '{reservation.status}'",
        )

    reservation.status = ReservationStatus.CANCELLED
    db.commit()


# ── Owner / Admin endpoints ───────────────────────────────────────────────────

@RESERVATION_CONTROLLER.get("/restaurant/{slug}", response_model=list[ReservationOut])
def list_restaurant_reservations(
    slug: str,
    current_user: User = Depends(require_restaurant_owner_or_admin),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    return (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.restaurant_id == restaurant.id)
        .order_by(Reservation.reservation_date.desc())
        .all()
    )


@RESERVATION_CONTROLLER.patch("/{reservation_id}/status", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int,
    data: ReservationStatusUpdate,
    current_user: User = Depends(require_restaurant_owner_or_admin),
    db: Session = Depends(get_db),
):
    reservation = _get_reservation_with_restaurant(reservation_id, db)

    if current_user.role != UserRole.ADMIN and reservation.restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    new_status = ReservationStatus(data.status)
    allowed = _OWNER_TRANSITIONS.get(reservation.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{reservation.status}' to '{new_status}'",
        )

    reservation.status = new_status
    db.commit()
    db.refresh(reservation)
    return reservation
