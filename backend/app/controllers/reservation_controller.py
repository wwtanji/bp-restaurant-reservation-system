from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import exists
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.reservation import Reservation, ReservationStatus
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.reservation_schema import ReservationCreate, ReservationOut, ReservationStatusUpdate
from app.utils.rbac import get_current_user, require_customer, require_restaurant_owner_or_admin
from app.controllers.restaurant_controller import get_restaurant_by_slug

RESERVATION_CONTROLLER = APIRouter(prefix="/reservations")

TURN_HOURS = 1.5


def _overlap_window(reservation_date: date, reservation_time: time) -> list:
    _base = datetime.combine(date(2000, 6, 15), reservation_time)
    slot_start = (_base - timedelta(hours=TURN_HOURS)).time()
    slot_end   = (_base + timedelta(hours=TURN_HOURS)).time()
    _active = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
    return [
        Reservation.reservation_date == reservation_date,
        Reservation.status.in_(_active),
        Reservation.reservation_time > slot_start,
        Reservation.reservation_time < slot_end,
    ]


# Valid status transitions an owner/admin may apply
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

@RESERVATION_CONTROLLER.post("/{slug}", response_model=ReservationOut, status_code=201)
def create_reservation(
    data: ReservationCreate,
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    """
    Flow: slug path param → get_restaurant_by_slug resolves it to a Restaurant row
    (raises 404 automatically if unknown). We then check is_active before booking.
    The reservation is always tied to current_user.id and restaurant.id — never to
    anything the caller supplies directly.
    """
    if not restaurant.is_active:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.reservation_date < date.today():
        raise HTTPException(status_code=400, detail="Reservation date must be today or in the future")

    _overlap = _overlap_window(data.reservation_date, data.reservation_time)

    # ── Check 1: user-level double-booking (across all restaurants) ──────────
    # exists() emits SELECT EXISTS(...) — stops at first hit, no full scan.
    user_conflict = db.query(
        exists().where(Reservation.user_id == current_user.id, *_overlap)
    ).scalar()
    if user_conflict:
        raise HTTPException(
            status_code=409,
            detail="You already have a reservation at this time.",
        )

    # ── Check 2: restaurant capacity (pessimistic lock) ──────────────────────
    # Fetching rows with FOR UPDATE acquires InnoDB row + gap locks on the
    # (restaurant_id, reservation_date) index, serialising concurrent requests.
    overlapping = (
        db.query(Reservation)
        .filter(Reservation.restaurant_id == restaurant.id, *_overlap)
        .with_for_update()
        .all()
    )
    booked_seats = sum(r.party_size for r in overlapping)
    if booked_seats + data.party_size > restaurant.max_capacity:
        available = max(0, restaurant.max_capacity - booked_seats)
        raise HTTPException(
            status_code=409,
            detail=f"Not enough capacity. {available} seat(s) available for this time slot.",
        )

    reservation = Reservation(
        user_id=current_user.id,
        restaurant_id=restaurant.id,
        party_size=data.party_size,
        reservation_date=data.reservation_date,
        reservation_time=data.reservation_time,
        guest_name=data.guest_name,
        guest_phone=data.guest_phone,
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


@RESERVATION_CONTROLLER.get("/{slug}/availability")
def get_slot_availability(
    reservation_date: date = Query(...),
    reservation_time: time = Query(...),
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _overlap = _overlap_window(reservation_date, reservation_time)
    overlapping = (
        db.query(Reservation)
        .filter(Reservation.restaurant_id == restaurant.id, *_overlap)
        .all()
    )
    booked = sum(r.party_size for r in overlapping)
    return {
        "available_seats": max(0, restaurant.max_capacity - booked),
        "max_capacity": restaurant.max_capacity,
    }


# ── Owner / Admin endpoints ───────────────────────────────────────────────────

@RESERVATION_CONTROLLER.get("/restaurant/{slug}", response_model=list[ReservationOut])
def list_restaurant_reservations(
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    current_user: User = Depends(require_restaurant_owner_or_admin),
    db: Session = Depends(get_db),
):
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
