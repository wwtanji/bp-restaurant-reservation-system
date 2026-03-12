import re
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.restaurant import Restaurant
from app.models.reservation import Reservation, ACTIVE_STATUSES
from app.models.user import User
from app.schemas.owner_restaurant_schema import RestaurantCreate, RestaurantUpdate


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
        opening_hours=opening_hours_dict,
    )
    db.add(restaurant)
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

    for field, value in update_data.items():
        setattr(restaurant, field, value)

    db.commit()
    db.refresh(restaurant)
    return restaurant


def delete_restaurant(db: Session, restaurant_id: int, owner_id: int) -> None:
    restaurant = get_owner_restaurant(db, restaurant_id, owner_id)
    restaurant.is_active = False
    db.commit()


def get_dashboard_stats(db: Session, owner_id: int) -> dict[str, int]:
    restaurant_ids = (
        db.query(Restaurant.id)
        .filter(Restaurant.owner_id == owner_id, Restaurant.is_active.is_(True))
        .all()
    )
    ids = [r.id for r in restaurant_ids]

    total_restaurants = len(ids)

    if not ids:
        return {
            "total_restaurants": 0,
            "total_reservations": 0,
            "todays_reservations": 0,
        }

    total_reservations = (
        db.query(func.count(Reservation.id))
        .filter(Reservation.restaurant_id.in_(ids))
        .scalar()
    )

    todays_reservations = (
        db.query(func.count(Reservation.id))
        .filter(
            Reservation.restaurant_id.in_(ids),
            Reservation.reservation_date == date.today(),
            Reservation.status.in_(ACTIVE_STATUSES),
        )
        .scalar()
    )

    return {
        "total_restaurants": total_restaurants,
        "total_reservations": total_reservations or 0,
        "todays_reservations": todays_reservations or 0,
    }
