from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.restaurant import Restaurant
from app.schemas.restaurant_schema import RestaurantOut
from app.utils.rbac import get_current_user

RESTAURANT_CONTROLLER = APIRouter(prefix="/restaurants")


def get_restaurant_by_slug(slug: str, db: Session = Depends(get_db)) -> Restaurant:
    restaurant = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@RESTAURANT_CONTROLLER.get("/", response_model=list[RestaurantOut])
def list_restaurants(
    q: Optional[str] = None,
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    price_range: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)  # noqa: E712

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
    if price_range is not None:
        query = query.filter(Restaurant.price_range == price_range)

    return query.offset(skip).limit(limit).all()


@RESTAURANT_CONTROLLER.get("/{slug}", response_model=RestaurantOut)
def get_restaurant(
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    _=Depends(get_current_user),
):
    if not restaurant.is_active:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant
