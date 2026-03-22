from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.owner_restaurant_schema import (
    RestaurantCreate,
    RestaurantUpdate,
    OwnerRestaurantOut,
    GalleryImageDelete,
    OwnerDashboardStats,
    OwnerTrendStats,
)
from app.services import restaurant_service, upload_service
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


@OWNER_CONTROLLER.get("/stats", response_model=OwnerDashboardStats)
def get_dashboard_stats(
    restaurant_id: Optional[int] = None,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.get_dashboard_stats(db, current_user.id, restaurant_id)


@OWNER_CONTROLLER.get("/stats/trends", response_model=OwnerTrendStats)
def get_trend_stats(
    restaurant_id: Optional[int] = None,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    return restaurant_service.get_owner_trend_stats(db, current_user.id, restaurant_id)


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


@OWNER_CONTROLLER.post("/{restaurant_id}/cover-image", response_model=OwnerRestaurantOut)
def upload_cover_image(
    restaurant_id: int,
    file: Annotated[UploadFile, File()],
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    restaurant = restaurant_service.get_owner_restaurant(db, restaurant_id, current_user.id)
    if restaurant.cover_image and restaurant.cover_image.startswith("/static/"):
        upload_service.delete_image(restaurant.cover_image)
    restaurant.cover_image = upload_service.save_image(file, restaurant_id, "cover")
    db.commit()
    db.refresh(restaurant)
    return restaurant


@OWNER_CONTROLLER.post("/{restaurant_id}/gallery-images", response_model=OwnerRestaurantOut)
def upload_gallery_images(
    restaurant_id: int,
    files: Annotated[list[UploadFile], File()],
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    restaurant = restaurant_service.get_owner_restaurant(db, restaurant_id, current_user.id)
    new_urls = [upload_service.save_image(f, restaurant_id, "gallery") for f in files]
    existing = restaurant.gallery_images or []
    restaurant.gallery_images = existing + new_urls
    db.commit()
    db.refresh(restaurant)
    return restaurant


@OWNER_CONTROLLER.delete("/{restaurant_id}/gallery-images", response_model=OwnerRestaurantOut)
def delete_gallery_image(
    restaurant_id: int,
    data: GalleryImageDelete,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
):
    restaurant = restaurant_service.get_owner_restaurant(db, restaurant_id, current_user.id)
    current_images = restaurant.gallery_images or []
    if data.image_url not in current_images:
        raise HTTPException(status_code=404, detail="Image not found in gallery")
    upload_service.delete_image(data.image_url)
    restaurant.gallery_images = [url for url in current_images if url != data.image_url]
    db.commit()
    db.refresh(restaurant)
    return restaurant
