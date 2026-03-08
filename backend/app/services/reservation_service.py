from datetime import date, time, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import exists
from sqlalchemy.orm import Session, joinedload

from app.models.reservation import Reservation, ReservationStatus
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.reservation_schema import ReservationCreate

TURN_HOURS = 1.5

OWNER_TRANSITIONS: dict[str, list[str]] = {
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


def build_overlap_filters(reservation_date: date, reservation_time: time) -> list:
    base = datetime.combine(date(2000, 6, 15), reservation_time)
    slot_start = (base - timedelta(hours=TURN_HOURS)).time()
    slot_end = (base + timedelta(hours=TURN_HOURS)).time()
    active_statuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
    return [
        Reservation.reservation_date == reservation_date,
        Reservation.status.in_(active_statuses),
        Reservation.reservation_time > slot_start,
        Reservation.reservation_time < slot_end,
    ]


def get_reservation_with_restaurant(db: Session, reservation_id: int) -> Reservation:
    reservation = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


def create_reservation(
    db: Session,
    current_user: User,
    restaurant: Restaurant,
    data: ReservationCreate,
) -> Reservation:
    if not restaurant.is_active:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.reservation_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Reservation date must be today or in the future",
        )

    overlap_filters = build_overlap_filters(data.reservation_date, data.reservation_time)

    user_conflict = db.query(
        exists().where(Reservation.user_id == current_user.id, *overlap_filters)
    ).scalar()
    if user_conflict:
        raise HTTPException(
            status_code=409,
            detail="You already have a reservation at this time.",
        )

    overlapping = (
        db.query(Reservation)
        .filter(Reservation.restaurant_id == restaurant.id, *overlap_filters)
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

    return get_reservation_with_restaurant(db, reservation.id)


def list_user_reservations(
    db: Session,
    user_id: int,
    status: str | None,
    upcoming: bool,
    skip: int,
    limit: int,
) -> list[Reservation]:
    query = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.user_id == user_id)
    )

    if status:
        valid = {s.value for s in ReservationStatus}
        if status in valid:
            query = query.filter(Reservation.status == status)

    if upcoming:
        query = query.filter(
            Reservation.reservation_date >= date.today(),
            Reservation.status.in_(
                [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
            ),
        )

    return (
        query.order_by(Reservation.reservation_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


EDITABLE_STATUSES = {ReservationStatus.PENDING, ReservationStatus.CONFIRMED}


def update_reservation(
    db: Session,
    reservation_id: int,
    current_user: User,
    data: ReservationCreate,
) -> Reservation:
    reservation = get_reservation_with_restaurant(db, reservation_id)

    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.status not in EDITABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit a reservation with status '{reservation.status}'",
        )

    if data.reservation_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Reservation date must be today or in the future",
        )

    overlap_filters = build_overlap_filters(data.reservation_date, data.reservation_time)

    user_conflict = db.query(
        exists().where(
            Reservation.user_id == current_user.id,
            Reservation.id != reservation_id,
            *overlap_filters,
        )
    ).scalar()
    if user_conflict:
        raise HTTPException(
            status_code=409,
            detail="You already have a reservation at this time.",
        )

    overlapping = (
        db.query(Reservation)
        .filter(
            Reservation.restaurant_id == reservation.restaurant_id,
            Reservation.id != reservation_id,
            *overlap_filters,
        )
        .with_for_update()
        .all()
    )
    booked_seats = sum(r.party_size for r in overlapping)
    if booked_seats + data.party_size > reservation.restaurant.max_capacity:
        available = max(0, reservation.restaurant.max_capacity - booked_seats)
        raise HTTPException(
            status_code=409,
            detail=f"Not enough capacity. {available} seat(s) available for this time slot.",
        )

    reservation.party_size = data.party_size
    reservation.reservation_date = data.reservation_date
    reservation.reservation_time = data.reservation_time
    reservation.guest_name = data.guest_name
    reservation.guest_phone = data.guest_phone
    reservation.special_requests = data.special_requests

    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation_id: int, user_id: int) -> None:
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.user_id == user_id,
        )
        .first()
    )
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


def get_slot_availability(
    db: Session,
    restaurant: Restaurant,
    reservation_date: date,
    reservation_time: time,
) -> dict[str, int]:
    overlap_filters = build_overlap_filters(reservation_date, reservation_time)
    overlapping = (
        db.query(Reservation)
        .filter(Reservation.restaurant_id == restaurant.id, *overlap_filters)
        .all()
    )
    booked = sum(r.party_size for r in overlapping)
    return {
        "available_seats": max(0, restaurant.max_capacity - booked),
        "max_capacity": restaurant.max_capacity,
    }


def list_restaurant_reservations(
    db: Session,
    restaurant: Restaurant,
    current_user: User,
) -> list[Reservation]:
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your restaurant")

    return (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant))
        .filter(Reservation.restaurant_id == restaurant.id)
        .order_by(Reservation.reservation_date.desc())
        .all()
    )


def update_reservation_status(
    db: Session,
    reservation_id: int,
    new_status_str: str,
    current_user: User,
) -> Reservation:
    reservation = get_reservation_with_restaurant(db, reservation_id)

    if (
        current_user.role != UserRole.ADMIN
        and reservation.restaurant.owner_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not your restaurant")

    new_status = ReservationStatus(new_status_str)
    allowed = OWNER_TRANSITIONS.get(reservation.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{reservation.status}' to '{new_status}'",
        )

    reservation.status = new_status
    db.commit()
    db.refresh(reservation)
    return reservation
