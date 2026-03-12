from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.admin_schema import (
    AdminPlatformStats,
    AdminUserOut,
    AdminUserDetail,
    AdminRoleUpdate,
    AdminLockUpdate,
    AdminRestaurantOut,
    AdminActiveToggle,
    AdminReservationOut,
    AdminReservationStatusUpdate,
    AdminReviewOut,
)
from app.services import admin_service
from app.utils.rbac import require_admin


ADMIN_CONTROLLER = APIRouter(prefix="/admin")


@ADMIN_CONTROLLER.get("/stats", response_model=AdminPlatformStats)
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.get_platform_stats(db)


@ADMIN_CONTROLLER.get("/users", response_model=list[AdminUserOut])
def list_users(
    q: Optional[str] = None,
    role: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.list_users(db, q, role, skip, limit)


@ADMIN_CONTROLLER.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.get_user_detail(db, user_id)


@ADMIN_CONTROLLER.patch("/users/{user_id}/role", response_model=AdminUserOut)
def update_user_role(
    user_id: int,
    data: AdminRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_service.update_user_role(db, user_id, data.role, current_user)


@ADMIN_CONTROLLER.patch("/users/{user_id}/lock", response_model=AdminUserOut)
def toggle_user_lock(
    user_id: int,
    data: AdminLockUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.toggle_user_lock(db, user_id, data.locked)


@ADMIN_CONTROLLER.get("/restaurants", response_model=list[AdminRestaurantOut])
def list_restaurants(
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
    city: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.list_all_restaurants(db, q, is_active, city, skip, limit)


@ADMIN_CONTROLLER.patch("/restaurants/{restaurant_id}/active", response_model=AdminRestaurantOut)
def toggle_restaurant_active(
    restaurant_id: int,
    data: AdminActiveToggle,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.toggle_restaurant_active(db, restaurant_id, data.is_active)


@ADMIN_CONTROLLER.get("/reservations", response_model=list[AdminReservationOut])
def list_reservations(
    status: Optional[str] = None,
    restaurant_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.list_all_reservations(db, status, restaurant_id, date_from, date_to, skip, limit)


@ADMIN_CONTROLLER.patch("/reservations/{reservation_id}/status", response_model=AdminReservationOut)
def update_reservation_status(
    reservation_id: int,
    data: AdminReservationStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.update_reservation_status(db, reservation_id, data.status)


@ADMIN_CONTROLLER.get("/reviews", response_model=list[AdminReviewOut])
def list_reviews(
    q: Optional[str] = None,
    rating: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return admin_service.list_all_reviews(db, q, rating, skip, limit)


@ADMIN_CONTROLLER.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    admin_service.admin_delete_review(db, review_id)
