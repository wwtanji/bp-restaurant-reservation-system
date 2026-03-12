from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.reservation import Reservation, ReservationStatus
from app.models.restaurant import Restaurant
from app.schemas.restaurant_schema import RestaurantOut
from app.utils.rbac import get_current_user

RESTAURANT_CONTROLLER = APIRouter(prefix="/restaurants")

ACTIVE_BOOKING_STATUSES = (
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.COMPLETED,
)

SORT_OPTIONS: dict[str, list] = {
    "rating_desc": [Restaurant.rating.desc().nulls_last()],
    "reviews_desc": [Restaurant.review_count.desc()],
    "name_asc": [Restaurant.name.asc()],
}

WEEKDAY_NAMES = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def is_restaurant_open_now(opening_hours: Optional[dict]) -> bool:
    if not opening_hours:
        return False
    now = datetime.now()
    day_name = WEEKDAY_NAMES[now.weekday()]
    day_hours = opening_hours.get(day_name)
    if not day_hours or day_hours.get("closed"):
        return False
    open_str = day_hours.get("open", "")
    close_str = day_hours.get("close", "")
    if not open_str or not close_str:
        return False
    try:
        current_time = now.strftime("%H:%M")
        return open_str <= current_time <= close_str
    except (ValueError, TypeError):
        return False


def get_restaurant_by_slug(slug: str, db: Session = Depends(get_db)) -> Restaurant:
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.slug == slug, Restaurant.is_active.is_(True))
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@RESTAURANT_CONTROLLER.get("/", response_model=list[RestaurantOut])
def list_restaurants(
    q: Optional[str] = None,
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    price_range: list[int] = Query(default=[]),
    rating_min: Optional[float] = None,
    open_now: bool = False,
    sort_by: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Restaurant).filter(Restaurant.is_active.is_(True))

    if q:
        query = query.filter(
            or_(
                Restaurant.name.ilike(f"%{q}%"),
                Restaurant.description.ilike(f"%{q}%"),
            )
        )
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if cuisine:
        query = query.filter(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    if price_range:
        query = query.filter(Restaurant.price_range.in_(price_range))
    if rating_min is not None:
        query = query.filter(Restaurant.rating >= rating_min)

    order_clauses = SORT_OPTIONS.get(sort_by, [])
    for clause in order_clauses:
        query = query.order_by(clause)

    if open_now:
        all_results = query.all()
        filtered = [r for r in all_results if is_restaurant_open_now(r.opening_hours)]
        return filtered[skip:skip + limit]

    return query.offset(skip).limit(limit).all()


@RESTAURANT_CONTROLLER.get("/cities", response_model=list[str])
def list_cities(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[str]:
    rows = (
        db.query(Restaurant.city)
        .filter(Restaurant.is_active.is_(True))
        .distinct()
        .order_by(Restaurant.city)
        .all()
    )
    return [row[0] for row in rows]


@RESTAURANT_CONTROLLER.get("/booked-today", response_model=dict[int, int])
def get_booked_today_counts(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> dict[int, int]:
    today = date.today()
    rows = (
        db.query(Reservation.restaurant_id, func.count(Reservation.id))
        .filter(
            Reservation.reservation_date == today,
            Reservation.status.in_(ACTIVE_BOOKING_STATUSES),
        )
        .group_by(Reservation.restaurant_id)
        .all()
    )
    return {restaurant_id: count for restaurant_id, count in rows}


@RESTAURANT_CONTROLLER.get("/{slug}", response_model=RestaurantOut)
def get_restaurant(
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    _=Depends(get_current_user),
):
    return restaurant
