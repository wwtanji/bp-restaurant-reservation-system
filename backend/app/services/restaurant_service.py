import re
from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from app.models.restaurant import Restaurant
from app.models.reservation import Reservation, ReservationStatus, ACTIVE_STATUSES
from app.models.payment import Payment, PaymentStatus
from app.models.review import Review
from app.models.table import Table
from app.models.user import User
from app.schemas.owner_restaurant_schema import RestaurantCreate, RestaurantUpdate
from app.services.admin_service import _fill_daily_gaps

TABLE_SIZE_LARGE = 6
TABLE_SIZE_MEDIUM = 4
TABLE_SIZE_SMALL = 2


def get_active_restaurant_or_404(db: Session, restaurant_id: int) -> Restaurant:
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active.is_(True),
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


def generate_unique_slug(db: Session, name: str) -> str:
    base_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not base_slug:
        base_slug = "restaurant"
    slug = base_slug
    counter = 2
    while db.query(Restaurant).filter(Restaurant.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def _generate_table_layout(max_capacity: int) -> list[int]:
    capacities: list[int] = []
    remaining = max_capacity

    if remaining >= 18:
        large_count = max(1, remaining // 20)
        capacities.extend([TABLE_SIZE_LARGE] * large_count)
        remaining -= large_count * TABLE_SIZE_LARGE

    medium_count = round(remaining * 0.6) // TABLE_SIZE_MEDIUM
    capacities.extend([TABLE_SIZE_MEDIUM] * medium_count)
    remaining -= medium_count * TABLE_SIZE_MEDIUM

    small_count = max(remaining // TABLE_SIZE_SMALL, int(remaining > 0))
    capacities.extend([TABLE_SIZE_SMALL] * small_count)

    return capacities


def _create_tables_for_restaurant(
    db: Session, restaurant_id: int, max_capacity: int
) -> None:
    layout = _generate_table_layout(max_capacity)
    for table_number, capacity in enumerate(layout, start=1):
        db.add(
            Table(
                restaurant_id=restaurant_id,
                table_number=table_number,
                capacity=capacity,
            )
        )


def _replace_tables_for_restaurant(
    db: Session, restaurant_id: int, new_capacity: int
) -> None:
    db.query(Table).filter(
        Table.restaurant_id == restaurant_id,
        Table.is_active.is_(True),
    ).update({Table.is_active: False})
    _create_tables_for_restaurant(db, restaurant_id, new_capacity)


def create_restaurant(db: Session, owner: User, data: RestaurantCreate) -> Restaurant:
    slug = generate_unique_slug(db, data.name)
    opening_hours_dict = None
    if data.opening_hours:
        opening_hours_dict = data.opening_hours.model_dump()

    restaurant = Restaurant(
        owner_id=owner.id,
        name=data.name,
        slug=slug,
        description=data.description,
        cuisine=data.cuisine,
        price_range=data.price_range,
        phone_number=data.phone_number,
        email=data.email,
        address=data.address,
        city=data.city,
        country=data.country,
        latitude=data.latitude,
        longitude=data.longitude,
        cover_image=data.cover_image,
        max_capacity=data.max_capacity,
        reservation_fee=data.reservation_fee,
        opening_hours=opening_hours_dict,
    )
    db.add(restaurant)
    db.flush()
    _create_tables_for_restaurant(db, restaurant.id, data.max_capacity)
    db.commit()
    db.refresh(restaurant)
    return restaurant


def list_owner_restaurants(db: Session, owner_id: int) -> list[Restaurant]:
    return (
        db.query(Restaurant)
        .filter(Restaurant.owner_id == owner_id, Restaurant.is_active.is_(True))
        .order_by(Restaurant.created_at.desc())
        .all()
    )


def get_owner_restaurant(db: Session, restaurant_id: int, owner_id: int) -> Restaurant:
    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.owner_id == owner_id,
            Restaurant.is_active.is_(True),
        )
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


def update_restaurant(
    db: Session, restaurant_id: int, owner_id: int, data: RestaurantUpdate
) -> Restaurant:
    restaurant = get_owner_restaurant(db, restaurant_id, owner_id)
    update_data = data.model_dump(exclude_unset=True)

    if "opening_hours" in update_data and update_data["opening_hours"] is not None:
        update_data["opening_hours"] = data.opening_hours.model_dump()

    if "name" in update_data and update_data["name"] != restaurant.name:
        update_data["slug"] = generate_unique_slug(db, update_data["name"])

    capacity_changed = (
        "max_capacity" in update_data
        and update_data["max_capacity"] != restaurant.max_capacity
    )

    for field, value in update_data.items():
        setattr(restaurant, field, value)

    if capacity_changed:
        _replace_tables_for_restaurant(db, restaurant.id, restaurant.max_capacity)

    db.commit()
    db.refresh(restaurant)
    return restaurant


def delete_restaurant(db: Session, restaurant_id: int, owner_id: int) -> None:
    restaurant = get_owner_restaurant(db, restaurant_id, owner_id)
    restaurant.is_active = False
    db.commit()


def _resolve_owner_restaurant_ids(
    db: Session, owner_id: int, restaurant_id: Optional[int] = None,
) -> list[int]:
    if restaurant_id is not None:
        exists = (
            db.query(Restaurant.id)
            .filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
                Restaurant.is_active.is_(True),
            )
            .first()
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return [restaurant_id]

    rows = (
        db.query(Restaurant.id)
        .filter(Restaurant.owner_id == owner_id, Restaurant.is_active.is_(True))
        .all()
    )
    return [r.id for r in rows]


PERIOD_DAYS = 30
EMPTY_STATS: dict = {
    "total_restaurants": 0,
    "total_reservations": 0,
    "todays_reservations": 0,
    "total_revenue_cents": 0,
    "average_rating": None,
    "total_reviews": 0,
    "current_period_reservations": 0,
    "previous_period_reservations": 0,
    "current_period_revenue_cents": 0,
    "previous_period_revenue_cents": 0,
}


def _revenue_in_range(
    db: Session, ids: list[int], start: date, end: date,
) -> int:
    return (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .filter(
            Reservation.restaurant_id.in_(ids),
            Payment.status == PaymentStatus.PAID,
            func.date(Payment.created_at) >= start,
            func.date(Payment.created_at) <= end,
        )
        .scalar()
    ) or 0


def _reservation_count_in_range(
    db: Session, ids: list[int], start: date, end: date,
) -> int:
    return (
        db.query(func.count(Reservation.id))
        .filter(
            Reservation.restaurant_id.in_(ids),
            func.date(Reservation.created_at) >= start,
            func.date(Reservation.created_at) <= end,
        )
        .scalar()
    ) or 0


def get_dashboard_stats(
    db: Session, owner_id: int, restaurant_id: Optional[int] = None,
) -> dict:
    all_ids = _resolve_owner_restaurant_ids(db, owner_id)
    ids = _resolve_owner_restaurant_ids(db, owner_id, restaurant_id)

    total_restaurants = len(all_ids)

    if not ids:
        return {**EMPTY_STATS, "total_restaurants": total_restaurants}

    today = date.today()
    period_start = today - timedelta(days=PERIOD_DAYS - 1)
    previous_end = period_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=PERIOD_DAYS - 1)

    total_reservations = (
        db.query(func.count(Reservation.id))
        .filter(Reservation.restaurant_id.in_(ids))
        .scalar()
    ) or 0

    todays_reservations = (
        db.query(func.count(Reservation.id))
        .filter(
            Reservation.restaurant_id.in_(ids),
            Reservation.reservation_date == today,
            Reservation.status.in_(ACTIVE_STATUSES),
        )
        .scalar()
    ) or 0

    total_revenue_cents = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .filter(
            Reservation.restaurant_id.in_(ids),
            Payment.status == PaymentStatus.PAID,
        )
        .scalar()
    ) or 0

    average_rating = (
        db.query(func.avg(Restaurant.rating))
        .filter(Restaurant.id.in_(ids), Restaurant.rating.isnot(None))
        .scalar()
    )

    total_reviews = (
        db.query(func.count(Review.id))
        .filter(Review.restaurant_id.in_(ids))
        .scalar()
    ) or 0

    return {
        "total_restaurants": total_restaurants,
        "total_reservations": total_reservations,
        "todays_reservations": todays_reservations,
        "total_revenue_cents": total_revenue_cents,
        "average_rating": round(float(average_rating), 1) if average_rating else None,
        "total_reviews": total_reviews,
        "current_period_reservations": _reservation_count_in_range(db, ids, period_start, today),
        "previous_period_reservations": _reservation_count_in_range(db, ids, previous_start, previous_end),
        "current_period_revenue_cents": _revenue_in_range(db, ids, period_start, today),
        "previous_period_revenue_cents": _revenue_in_range(db, ids, previous_start, previous_end),
    }


def _fill_daily_revenue_gaps(
    rows: list[tuple[date, int]], start: date, days: int,
) -> list[dict]:
    amounts_by_day = {row[0]: row[1] for row in rows}
    return [
        {"date": start + timedelta(days=i), "amount": amounts_by_day.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]


def get_owner_trend_stats(
    db: Session, owner_id: int, restaurant_id: Optional[int] = None,
) -> dict:
    ids = _resolve_owner_restaurant_ids(db, owner_id, restaurant_id)

    today = date.today()
    period_start = today - timedelta(days=PERIOD_DAYS - 1)

    if not ids:
        empty_days = _fill_daily_gaps([], period_start, PERIOD_DAYS)
        return {
            "reservation_trends": empty_days,
            "revenue_trends": [{"date": d["date"], "amount": 0} for d in empty_days],
            "reservation_status_breakdown": {
                "pending": 0, "confirmed": 0, "completed": 0, "cancelled": 0, "no_show": 0,
            },
            "peak_hours": [],
            "party_size_distribution": [],
            "customer_loyalty": {"new_customers": 0, "repeat_customers": 0},
        }

    reservation_rows = (
        db.query(func.date(Reservation.created_at).label("day"), func.count())
        .filter(
            Reservation.restaurant_id.in_(ids),
            func.date(Reservation.created_at) >= period_start,
        )
        .group_by("day")
        .all()
    )
    reservation_trends = _fill_daily_gaps(reservation_rows, period_start, PERIOD_DAYS)

    revenue_rows = (
        db.query(
            func.date(Payment.created_at).label("day"),
            func.coalesce(func.sum(Payment.amount), 0),
        )
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .filter(
            Reservation.restaurant_id.in_(ids),
            Payment.status == PaymentStatus.PAID,
            func.date(Payment.created_at) >= period_start,
        )
        .group_by("day")
        .all()
    )
    revenue_trends = _fill_daily_revenue_gaps(revenue_rows, period_start, PERIOD_DAYS)

    status_rows = (
        db.query(Reservation.status, func.count(Reservation.id))
        .filter(Reservation.restaurant_id.in_(ids))
        .group_by(Reservation.status)
        .all()
    )
    status_map = {status: count for status, count in status_rows}

    peak_rows = (
        db.query(
            func.hour(Reservation.reservation_time).label("hour"),
            func.count(),
        )
        .filter(Reservation.restaurant_id.in_(ids))
        .group_by("hour")
        .order_by("hour")
        .all()
    )

    party_rows = (
        db.query(Reservation.party_size, func.count())
        .filter(Reservation.restaurant_id.in_(ids))
        .group_by(Reservation.party_size)
        .order_by(Reservation.party_size)
        .all()
    )

    user_visits = (
        db.query(
            Reservation.user_id,
            func.count(Reservation.id).label("cnt"),
        )
        .filter(Reservation.restaurant_id.in_(ids))
        .group_by(Reservation.user_id)
        .subquery()
    )
    loyalty = db.query(
        func.count(case((user_visits.c.cnt == 1, 1))).label("new_customers"),
        func.count(case((user_visits.c.cnt > 1, 1))).label("repeat_customers"),
    ).select_from(user_visits).first()

    return {
        "reservation_trends": reservation_trends,
        "revenue_trends": revenue_trends,
        "reservation_status_breakdown": {
            "pending": status_map.get(ReservationStatus.PENDING, 0),
            "confirmed": status_map.get(ReservationStatus.CONFIRMED, 0),
            "completed": status_map.get(ReservationStatus.COMPLETED, 0),
            "cancelled": status_map.get(ReservationStatus.CANCELLED, 0),
            "no_show": status_map.get(ReservationStatus.NO_SHOW, 0),
        },
        "peak_hours": [{"hour": h, "count": c} for h, c in peak_rows],
        "party_size_distribution": [{"party_size": ps, "count": c} for ps, c in party_rows],
        "customer_loyalty": {
            "new_customers": loyalty.new_customers if loyalty else 0,
            "repeat_customers": loyalty.repeat_customers if loyalty else 0,
        },
    }
