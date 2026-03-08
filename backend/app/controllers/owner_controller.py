from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.owner_restaurant_schema import (
    RestaurantCreate,
    RestaurantUpdate,
    OwnerRestaurantOut,
    DashboardStats,
)
from app.services import restaurant_service
from app.utils.rbac import require_restaurant_owner


OWNER_CONTROLLER = APIRouter(prefix="/owners/restaurants")


@OWNER_CONTROLLER.post("/", response_model=OwnerRestaurantOut, status_code=201)
def create_restaurant(
    data: RestaurantCreate,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.create_restaurant(db, current_user, data)


@OWNER_CONTROLLER.get("/", response_model=list[OwnerRestaurantOut])
def list_restaurants(
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.list_owner_restaurants(db, current_user.id)


@OWNER_CONTROLLER.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.get_dashboard_stats(db, current_user.id)


@OWNER_CONTROLLER.get("/{restaurant_id}", response_model=OwnerRestaurantOut)
def get_restaurant(
    restaurant_id: int,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.get_owner_restaurant(db, restaurant_id, current_user.id)


@OWNER_CONTROLLER.put("/{restaurant_id}", response_model=OwnerRestaurantOut)
def update_restaurant(
    restaurant_id: int,
    data: RestaurantUpdate,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.update_restaurant(
        db, restaurant_id, current_user.id, data
    )


@OWNER_CONTROLLER.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(
    restaurant_id: int,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    restaurant_service.delete_restaurant(db, restaurant_id, current_user.id)
