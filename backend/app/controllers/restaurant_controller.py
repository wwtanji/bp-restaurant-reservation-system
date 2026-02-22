from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import get_db
from app.models.restaurant import Restaurant
from app.schemas.restaurant_schema import RestaurantListItem

RESTAURANT_CONTROLLER = APIRouter(prefix="/restaurants", tags=["restaurants"])


@RESTAURANT_CONTROLLER.get("", response_model=List[RestaurantListItem])
def list_restaurants(
    city: Optional[str] = Query(None, description="Filter by city"),
    cuisine_type: Optional[str] = Query(None, description="Filter by cuisine type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)  # noqa: E712

    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if cuisine_type:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))

    offset = (page - 1) * limit
    return (
        query.order_by(Restaurant.average_rating.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
