import re
from datetime import date, time, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from app.models.restaurant import Restaurant
from app.models.restaurant_details import RestaurantDetails
from app.models.restaurant_hours import RestaurantHours
from app.models.menu import MenuCategory, MenuItem
from app.models.faq import FaqItem
from app.models.reservation import Reservation, ReservationStatus, ACTIVE_STATUSES
from app.models.payment import Payment, PaymentStatus
from app.models.review import Review
from app.models.table import Table
from app.models.user import User
from app.schemas.owner_restaurant_schema import (
    RestaurantCreate,
    RestaurantUpdate,
    OwnerDashboardStats,
    OwnerTrendStats,
    DailyRevenue,
    HourlyCount,
    PartySizeCount,
    CustomerLoyalty,
)
from app.schemas.admin_schema import DailyCount, ReservationStatusBreakdown
from app.services.admin_service import _fill_daily_gaps

RESTAURANT_CORE_FIELDS = {
    "name", "description", "cuisine", "price_range", "phone_number", "email",
    "address", "city", "country", "latitude", "longitude", "cover_image",
    "gallery_images", "max_capacity", "reservation_fee", "is_active",
}

DETAIL_FIELDS = {
    "website", "dining_style", "dress_code", "parking_details", "payment_options",
    "neighborhood", "cross_street", "executive_chef", "public_transit",
    "delivery_takeout", "catering_info", "private_party_info", "additional_info",
    "overview_text", "highlights",
}


def _parse_time(time_str: Optional[str]) -> Optional[time]:
    if not time_str:
        return None
    h, m = time_str.split(":")
    return time(int(h), int(m))


def _save_restaurant_hours(db: Session, restaurant_id: int, hours_dict: Optional[dict]) -> None:
    db.query(RestaurantHours).filter(RestaurantHours.restaurant_id == restaurant_id).delete()
    if not hours_dict:
        return
    for day, day_hours in hours_dict.items():
        if day_hours is None:
            continue
        db.add(RestaurantHours(
            restaurant_id=restaurant_id,
            day_of_week=day,
            open_time=_parse_time(day_hours.get("open")),
            close_time=_parse_time(day_hours.get("close")),
            is_closed=day_hours.get("is_closed", False),
        ))


def _save_restaurant_menu(db: Session, restaurant_id: int, menu_data: Optional[list]) -> None:
    db.query(MenuCategory).filter(MenuCategory.restaurant_id == restaurant_id).delete()
    if not menu_data:
        return
    for position, cat_data in enumerate(menu_data):
        cat = MenuCategory(
            restaurant_id=restaurant_id,
            name=cat_data["name"],
            position=position,
        )
        db.add(cat)
        db.flush()
        for item_data in cat_data.get("items", []):
            db.add(MenuItem(
                category_id=cat.id,
                name=item_data["name"],
                price=item_data["price"],
                description=item_data.get("description"),
            ))


def _save_restaurant_faqs(db: Session, restaurant_id: int, faqs_data: Optional[list]) -> None:
    db.query(FaqItem).filter(FaqItem.restaurant_id == restaurant_id).delete()
    if not faqs_data:
        return
    for position, faq_data in enumerate(faqs_data):
        db.add(FaqItem(
            restaurant_id=restaurant_id,
            question=faq_data["question"],
            answer=faq_data["answer"],
            position=position,
        ))


def _upsert_restaurant_details(
    db: Session, restaurant: Restaurant, detail_values: dict
) -> None:
    if restaurant.details:
        for field, value in detail_values.items():
            setattr(restaurant.details, field, value)
    else:
        db.add(RestaurantDetails(restaurant_id=restaurant.id, **detail_values))

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
    )
    db.add(restaurant)
    db.flush()

    db.add(RestaurantDetails(
        restaurant_id=restaurant.id,
        **{field: getattr(data, field, None) for field in DETAIL_FIELDS},
    ))

    if data.opening_hours:
        _save_restaurant_hours(db, restaurant.id, data.opening_hours.model_dump())

    if data.menu:
        _save_restaurant_menu(db, restaurant.id, [cat.model_dump() for cat in data.menu])

    if data.faqs:
        _save_restaurant_faqs(db, restaurant.id, [faq.model_dump() for faq in data.faqs])

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

    if "name" in update_data and update_data["name"] != restaurant.name:
        update_data["slug"] = generate_unique_slug(db, update_data["name"])

    capacity_changed = (
        "max_capacity" in update_data
        and update_data["max_capacity"] != restaurant.max_capacity
    )

    for field, value in update_data.items():
        if field in RESTAURANT_CORE_FIELDS or field == "slug":
            setattr(restaurant, field, value)

    if capacity_changed:
        _replace_tables_for_restaurant(db, restaurant.id, restaurant.max_capacity)

    detail_updates = {k: v for k, v in update_data.items() if k in DETAIL_FIELDS}
    if detail_updates:
        _upsert_restaurant_details(db, restaurant, detail_updates)

    if "opening_hours" in update_data:
        hours_dict = data.opening_hours.model_dump() if data.opening_hours else None
        _save_restaurant_hours(db, restaurant.id, hours_dict)

    if "menu" in update_data:
        menu_dicts = [cat.model_dump() for cat in data.menu] if data.menu else None
        _save_restaurant_menu(db, restaurant.id, menu_dicts)

    if "faqs" in update_data:
        faqs_dicts = [faq.model_dump() for faq in data.faqs] if data.faqs else None
        _save_restaurant_faqs(db, restaurant.id, faqs_dicts)

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
) -> OwnerDashboardStats:
    all_ids = _resolve_owner_restaurant_ids(db, owner_id)
    ids = _resolve_owner_restaurant_ids(db, owner_id, restaurant_id)

    total_restaurants = len(all_ids)

    if not ids:
        return OwnerDashboardStats(
            total_restaurants=total_restaurants,
            total_reservations=0,
            todays_reservations=0,
            total_revenue_cents=0,
            average_rating=None,
            total_reviews=0,
            current_period_reservations=0,
            previous_period_reservations=0,
            current_period_revenue_cents=0,
            previous_period_revenue_cents=0,
        )

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

    return OwnerDashboardStats(
        total_restaurants=total_restaurants,
        total_reservations=total_reservations,
        todays_reservations=todays_reservations,
        total_revenue_cents=total_revenue_cents,
        average_rating=round(float(average_rating), 1) if average_rating else None,
        total_reviews=total_reviews,
        current_period_reservations=_reservation_count_in_range(db, ids, period_start, today),
        previous_period_reservations=_reservation_count_in_range(db, ids, previous_start, previous_end),
        current_period_revenue_cents=_revenue_in_range(db, ids, period_start, today),
        previous_period_revenue_cents=_revenue_in_range(db, ids, previous_start, previous_end),
    )


def _fill_daily_revenue_gaps(
    rows: list[tuple[date, int]], start: date, days: int,
) -> list[DailyRevenue]:
    amounts_by_day = {row[0]: row[1] for row in rows}
    return [
        DailyRevenue(date=start + timedelta(days=i), amount=amounts_by_day.get(start + timedelta(days=i), 0))
        for i in range(days)
    ]


def get_owner_trend_stats(
    db: Session, owner_id: int, restaurant_id: Optional[int] = None,
) -> OwnerTrendStats:
    ids = _resolve_owner_restaurant_ids(db, owner_id, restaurant_id)

    today = date.today()
    period_start = today - timedelta(days=PERIOD_DAYS - 1)

    if not ids:
        empty_days = _fill_daily_gaps([], period_start, PERIOD_DAYS)
        return OwnerTrendStats(
            reservation_trends=empty_days,
            revenue_trends=[DailyRevenue(date=d.date, amount=0) for d in empty_days],
            reservation_status_breakdown=ReservationStatusBreakdown(
                pending=0, confirmed=0, completed=0, cancelled=0, no_show=0,
            ),
            peak_hours=[],
            party_size_distribution=[],
            customer_loyalty=CustomerLoyalty(new_customers=0, repeat_customers=0),
        )

    reservation_rows = (
        db.query(func.date(Reservation.created_at).label("day"), func.count())
        .filter(
            Reservation.restaurant_id.in_(ids),
            func.date(Reservation.created_at) >= period_start,
        )
        .group_by("day")
        .all()
    )

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

    return OwnerTrendStats(
        reservation_trends=_fill_daily_gaps(reservation_rows, period_start, PERIOD_DAYS),
        revenue_trends=_fill_daily_revenue_gaps(revenue_rows, period_start, PERIOD_DAYS),
        reservation_status_breakdown=ReservationStatusBreakdown(
            pending=status_map.get(ReservationStatus.PENDING, 0),
            confirmed=status_map.get(ReservationStatus.CONFIRMED, 0),
            completed=status_map.get(ReservationStatus.COMPLETED, 0),
            cancelled=status_map.get(ReservationStatus.CANCELLED, 0),
            no_show=status_map.get(ReservationStatus.NO_SHOW, 0),
        ),
        peak_hours=[HourlyCount(hour=h, count=c) for h, c in peak_rows],
        party_size_distribution=[PartySizeCount(party_size=ps, count=c) for ps, c in party_rows],
        customer_loyalty=CustomerLoyalty(
            new_customers=loyalty.new_customers if loyalty else 0,
            repeat_customers=loyalty.repeat_customers if loyalty else 0,
        ),
    )
