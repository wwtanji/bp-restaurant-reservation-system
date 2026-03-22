from datetime import date, time, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import exists
from sqlalchemy.orm import Session, joinedload

from app.models.reservation import Reservation, ReservationStatus, ACTIVE_STATUSES
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.user import User, UserRole
from app.schemas.reservation_schema import ReservationCreate
from app.services.payment_service import refund_payment

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

EDITABLE_STATUSES = {ReservationStatus.PENDING, ReservationStatus.CONFIRMED}


def build_overlap_filters(reservation_date: date, reservation_time: time) -> list:
    base = datetime.combine(date(2000, 6, 15), reservation_time)
    slot_start = (base - timedelta(hours=TURN_HOURS)).time()
    slot_end = (base + timedelta(hours=TURN_HOURS)).time()
    return [
        Reservation.reservation_date == reservation_date,
        Reservation.status.in_(ACTIVE_STATUSES),
        Reservation.reservation_time > slot_start,
        Reservation.reservation_time < slot_end,
    ]


def _get_occupied_table_ids(
    db: Session,
    restaurant_id: int,
    overlap_filters: list,
    exclude_reservation_id: int | None = None,
) -> list[int]:
    query = db.query(Reservation.table_id).filter(
        Reservation.restaurant_id == restaurant_id,
        Reservation.table_id.isnot(None),
        *overlap_filters,
    )
    if exclude_reservation_id:
        query = query.filter(Reservation.id != exclude_reservation_id)
    return [row[0] for row in query.all()]


def _find_best_table(
    db: Session,
    restaurant_id: int,
    party_size: int,
    overlap_filters: list,
    exclude_reservation_id: int | None = None,
) -> Table:
    occupied_ids = _get_occupied_table_ids(
        db, restaurant_id, overlap_filters, exclude_reservation_id
    )

    query = db.query(Table).filter(
        Table.restaurant_id == restaurant_id,
        Table.is_active.is_(True),
        Table.capacity >= party_size,
    )

    if occupied_ids:
        query = query.filter(Table.id.notin_(occupied_ids))

    table = query.order_by(Table.capacity.asc()).with_for_update().first()

    if not table:
        raise HTTPException(
            status_code=409,
            detail="No suitable table available for this time slot and party size.",
        )

    return table


def get_reservation_with_restaurant(db: Session, reservation_id: int) -> Reservation:
    reservation = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant), joinedload(Reservation.table))
        .filter(Reservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


def _check_user_conflict(
    db: Session,
    user_id: int,
    overlap_filters: list,
    exclude_reservation_id: int | None = None,
) -> None:
    conflict_filters = [Reservation.user_id == user_id, *overlap_filters]
    if exclude_reservation_id:
        conflict_filters.append(Reservation.id != exclude_reservation_id)

    user_conflict = db.query(exists().where(*conflict_filters)).scalar()
    if user_conflict:
        raise HTTPException(
            status_code=409,
            detail="You already have a reservation at this time.",
        )


def _validate_reservation_date(reservation_date: date) -> None:
    if reservation_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Reservation date must be today or in the future",
        )


def _check_restaurant_has_tables(db: Session, restaurant_id: int) -> None:
    has_tables = (
        db.query(Table)
        .filter(Table.restaurant_id == restaurant_id, Table.is_active.is_(True))
        .first()
    )
    if not has_tables:
        raise HTTPException(
            status_code=409,
            detail="This restaurant has no tables configured for booking.",
        )


def create_reservation(
    db: Session,
    current_user: User,
    restaurant: Restaurant,
    data: ReservationCreate,
) -> Reservation:
    if not restaurant.is_active:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    _validate_reservation_date(data.reservation_date)
    _check_restaurant_has_tables(db, restaurant.id)
    overlap_filters = build_overlap_filters(data.reservation_date, data.reservation_time)
    _check_user_conflict(db, current_user.id, overlap_filters)
    table = _find_best_table(db, restaurant.id, data.party_size, overlap_filters)

    reservation = Reservation(
        user_id=current_user.id,
        restaurant_id=restaurant.id,
        table_id=table.id,
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
        .options(joinedload(Reservation.restaurant), joinedload(Reservation.table))
        .filter(Reservation.user_id == user_id)
    )

    if status:
        valid = {s.value for s in ReservationStatus}
        if status in valid:
            query = query.filter(Reservation.status == status)

    if upcoming:
        query = query.filter(
            Reservation.reservation_date >= date.today(),
            Reservation.status.in_(ACTIVE_STATUSES),
        )

    return (
        query.order_by(Reservation.reservation_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


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

    _validate_reservation_date(data.reservation_date)
    overlap_filters = build_overlap_filters(data.reservation_date, data.reservation_time)
    _check_user_conflict(db, current_user.id, overlap_filters, reservation_id)
    table = _find_best_table(
        db, reservation.restaurant_id, data.party_size, overlap_filters, reservation_id
    )

    reservation.table_id = table.id
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

    if reservation.status not in EDITABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a reservation with status '{reservation.status}'",
        )

    reservation.status = ReservationStatus.CANCELLED
    refund_payment(db, reservation_id)
    db.commit()


def get_slot_availability(
    db: Session,
    restaurant: Restaurant,
    reservation_date: date,
    reservation_time: time,
    party_size: int,
) -> dict[str, int]:
    total_tables = (
        db.query(Table)
        .filter(
            Table.restaurant_id == restaurant.id,
            Table.is_active.is_(True),
            Table.capacity >= party_size,
        )
        .count()
    )

    overlap_filters = build_overlap_filters(reservation_date, reservation_time)
    occupied_ids = _get_occupied_table_ids(db, restaurant.id, overlap_filters)

    query = db.query(Table).filter(
        Table.restaurant_id == restaurant.id,
        Table.is_active.is_(True),
        Table.capacity >= party_size,
    )
    if occupied_ids:
        query = query.filter(Table.id.notin_(occupied_ids))

    available_tables = query.count()

    return {
        "available_tables": available_tables,
        "total_tables": total_tables,
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
        .options(joinedload(Reservation.restaurant), joinedload(Reservation.table))
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
    if new_status == ReservationStatus.CANCELLED:
        refund_payment(db, reservation_id)
    db.commit()
    db.refresh(reservation)
    return reservation
