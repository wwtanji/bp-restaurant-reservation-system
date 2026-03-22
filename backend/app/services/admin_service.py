from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.reservation import Reservation, ReservationStatus
from app.models.review import Review

LOCK_FOREVER = datetime(2099, 12, 31)

ROLE_LABEL_MAP = {
    UserRole.CUSTOMER: "customer",
    UserRole.RESTAURANT_OWNER: "owner",
    UserRole.ADMIN: "admin",
}


def get_platform_stats(db: Session) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_restaurants = db.query(func.count(Restaurant.id)).scalar() or 0
    active_restaurants = (
        db.query(func.count(Restaurant.id))
        .filter(Restaurant.is_active.is_(True))
        .scalar() or 0
    )
    total_reservations = db.query(func.count(Reservation.id)).scalar() or 0
    todays_reservations = (
        db.query(func.count(Reservation.id))
        .filter(Reservation.reservation_date == date.today())
        .scalar() or 0
    )
    total_reviews = db.query(func.count(Review.id)).scalar() or 0

    role_rows = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    users_by_role = {
        ROLE_LABEL_MAP.get(role, str(role)): count
        for role, count in role_rows
    }

    return {
        "total_users": total_users,
        "total_restaurants": total_restaurants,
        "active_restaurants": active_restaurants,
        "total_reservations": total_reservations,
        "todays_reservations": todays_reservations,
        "total_reviews": total_reviews,
        "users_by_role": users_by_role,
    }


def _fill_daily_gaps(
    rows: list[tuple[date, int]],
    start: date,
    days: int,
) -> list[dict]:
    counts_by_day = {row[0]: row[1] for row in rows}
    return [
        {"date": start + timedelta(days=i), "count": counts_by_day.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]


def _count_in_range(db, model_class, date_column, start: date, end: date) -> int:
    return (
        db.query(func.count(model_class.id))
        .filter(func.date(date_column) >= start, func.date(date_column) <= end)
        .scalar() or 0
    )


def get_trend_stats(db: Session) -> dict:
    today = date.today()
    period_days = 30
    period_start = today - timedelta(days=period_days - 1)
    previous_end = period_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=period_days - 1)

    def _daily_trend(date_column):
        rows = (
            db.query(func.date(date_column).label("day"), func.count())
            .filter(func.date(date_column) >= period_start)
            .group_by("day")
            .all()
        )
        return _fill_daily_gaps(rows, period_start, period_days)

    reservation_trends = _daily_trend(Reservation.created_at)
    user_trends = _daily_trend(User.registered_at)
    review_trends = _daily_trend(Review.created_at)

    status_rows = (
        db.query(Reservation.status, func.count(Reservation.id))
        .group_by(Reservation.status)
        .all()
    )
    status_map = {status: count for status, count in status_rows}

    return {
        "reservation_trends": reservation_trends,
        "user_trends": user_trends,
        "review_trends": review_trends,
        "reservation_status_breakdown": {
            "pending": status_map.get(ReservationStatus.PENDING, 0),
            "confirmed": status_map.get(ReservationStatus.CONFIRMED, 0),
            "completed": status_map.get(ReservationStatus.COMPLETED, 0),
            "cancelled": status_map.get(ReservationStatus.CANCELLED, 0),
            "no_show": status_map.get(ReservationStatus.NO_SHOW, 0),
        },
        "current_period_reservations": _count_in_range(db, Reservation, Reservation.created_at, period_start, today),
        "previous_period_reservations": _count_in_range(db, Reservation, Reservation.created_at, previous_start, previous_end),
        "current_period_users": _count_in_range(db, User, User.registered_at, period_start, today),
        "previous_period_users": _count_in_range(db, User, User.registered_at, previous_start, previous_end),
        "current_period_reviews": _count_in_range(db, Review, Review.created_at, period_start, today),
        "previous_period_reviews": _count_in_range(db, Review, Review.created_at, previous_start, previous_end),
    }


def list_users(
    db: Session,
    q: Optional[str],
    role: Optional[int],
    skip: int,
    limit: int,
) -> list[User]:
    query = db.query(User)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.user_email.ilike(pattern),
            )
        )
    if role is not None:
        query = query.filter(User.role == role)
    return query.order_by(User.registered_at.desc()).offset(skip).limit(limit).all()


def get_user_detail(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    restaurant_count = (
        db.query(func.count(Restaurant.id))
        .filter(Restaurant.owner_id == user_id)
        .scalar() or 0
    )
    reservation_count = (
        db.query(func.count(Reservation.id))
        .filter(Reservation.user_id == user_id)
        .scalar() or 0
    )
    review_count = (
        db.query(func.count(Review.id))
        .filter(Review.user_id == user_id)
        .scalar() or 0
    )

    return {
        **{c.key: getattr(user, c.key) for c in User.__table__.columns},
        "restaurant_count": restaurant_count,
        "reservation_count": reservation_count,
        "review_count": review_count,
    }


def update_user_role(
    db: Session,
    user_id: int,
    new_role: int,
    current_user: User,
) -> User:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


def toggle_user_lock(db: Session, user_id: int, locked: bool) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if locked:
        user.locked_until = LOCK_FOREVER
    else:
        user.locked_until = None
        user.failed_login_attempts = 0

    db.commit()
    db.refresh(user)
    return user


def list_all_restaurants(
    db: Session,
    q: Optional[str],
    is_active: Optional[bool],
    city: Optional[str],
    skip: int,
    limit: int,
) -> list[dict]:
    query = db.query(Restaurant).options(joinedload(Restaurant.owner))

    if q:
        query = query.filter(Restaurant.name.ilike(f"%{q}%"))
    if is_active is not None:
        query = query.filter(Restaurant.is_active.is_(is_active))
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))

    restaurants = query.order_by(Restaurant.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            **{c.key: getattr(r, c.key) for c in Restaurant.__table__.columns},
            "owner_name": f"{r.owner.first_name} {r.owner.last_name}",
        }
        for r in restaurants
    ]


def toggle_restaurant_active(
    db: Session,
    restaurant_id: int,
    is_active: bool,
) -> dict:
    restaurant = (
        db.query(Restaurant)
        .options(joinedload(Restaurant.owner))
        .filter(Restaurant.id == restaurant_id)
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    restaurant.is_active = is_active
    db.commit()
    db.refresh(restaurant)

    return {
        **{c.key: getattr(restaurant, c.key) for c in Restaurant.__table__.columns},
        "owner_name": f"{restaurant.owner.first_name} {restaurant.owner.last_name}",
    }


def list_all_reservations(
    db: Session,
    status: Optional[str],
    restaurant_id: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    skip: int,
    limit: int,
) -> list[dict]:
    query = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant), joinedload(Reservation.user))
    )

    if status:
        query = query.filter(Reservation.status == status)
    if restaurant_id is not None:
        query = query.filter(Reservation.restaurant_id == restaurant_id)
    if date_from:
        query = query.filter(Reservation.reservation_date >= date_from)
    if date_to:
        query = query.filter(Reservation.reservation_date <= date_to)

    reservations = (
        query.order_by(Reservation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            **{c.key: getattr(r, c.key) for c in Reservation.__table__.columns},
            "restaurant_name": r.restaurant.name,
            "user_name": f"{r.user.first_name} {r.user.last_name}",
        }
        for r in reservations
    ]


def update_reservation_status(
    db: Session,
    reservation_id: int,
    new_status: str,
) -> dict:
    reservation = (
        db.query(Reservation)
        .options(joinedload(Reservation.restaurant), joinedload(Reservation.user))
        .filter(Reservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.status = new_status
    db.commit()
    db.refresh(reservation)

    return {
        **{c.key: getattr(reservation, c.key) for c in Reservation.__table__.columns},
        "restaurant_name": reservation.restaurant.name,
        "user_name": f"{reservation.user.first_name} {reservation.user.last_name}",
    }


def list_all_reviews(
    db: Session,
    q: Optional[str],
    rating: Optional[int],
    skip: int,
    limit: int,
) -> list[dict]:
    query = (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.restaurant))
    )

    if q:
        query = query.filter(Review.text.ilike(f"%{q}%"))
    if rating is not None:
        query = query.filter(Review.rating == rating)

    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "restaurant_id": r.restaurant_id,
            "rating": r.rating,
            "text": r.text,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "author_name": f"{r.user.first_name} {r.user.last_name}",
            "restaurant_name": r.restaurant.name,
            "restaurant_slug": r.restaurant.slug,
        }
        for r in reviews
    ]


def admin_delete_review(db: Session, review_id: int) -> None:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    restaurant = db.query(Restaurant).filter(Restaurant.id == review.restaurant_id).first()
    db.delete(review)
    db.flush()

    if restaurant:
        stats = (
            db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.restaurant_id == restaurant.id)
            .first()
        )
        restaurant.rating = float(stats[0]) if stats[0] else None
        restaurant.review_count = stats[1] or 0

    db.commit()
