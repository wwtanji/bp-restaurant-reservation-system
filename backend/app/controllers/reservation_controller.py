from datetime import date, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.reservation_schema import (
    ReservationCreate,
    ReservationOut,
    ReservationStatusUpdate,
    SlotAvailabilityResponse,
)
from app.services import reservation_service
from app.utils.rbac import get_current_user, require_customer, require_restaurant_owner_or_admin
from app.controllers.restaurant_controller import get_restaurant_by_slug

RESERVATION_CONTROLLER = APIRouter(prefix="/reservations")


@RESERVATION_CONTROLLER.post("/{slug}", response_model=ReservationOut, status_code=201)
def create_reservation(
    data: ReservationCreate,
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return reservation_service.create_reservation(db, current_user, restaurant, data)


@RESERVATION_CONTROLLER.get("/my", response_model=list[ReservationOut])
def list_my_reservations(
    status: str | None = Query(default=None),
    upcoming: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return reservation_service.list_user_reservations(
        db, current_user.id, status, upcoming, skip, limit
    )


@RESERVATION_CONTROLLER.put("/{reservation_id}", response_model=ReservationOut)
def edit_reservation(
    reservation_id: int,
    data: ReservationCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    return reservation_service.update_reservation(
        db, reservation_id, current_user, data
    )


@RESERVATION_CONTROLLER.delete("/{reservation_id}", status_code=204)
def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    reservation_service.cancel_reservation(db, reservation_id, current_user.id)


@RESERVATION_CONTROLLER.get(
    "/{slug}/availability", response_model=SlotAvailabilityResponse
)
def get_slot_availability(
    reservation_date: date = Query(...),
    reservation_time: time = Query(...),
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reservation_service.get_slot_availability(
        db, restaurant, reservation_date, reservation_time
    )


@RESERVATION_CONTROLLER.get(
    "/restaurant/{slug}", response_model=list[ReservationOut]
)
def list_restaurant_reservations(
    restaurant: Restaurant = Depends(get_restaurant_by_slug),
    current_user: User = Depends(require_restaurant_owner_or_admin),
    db: Session = Depends(get_db),
):
    return reservation_service.list_restaurant_reservations(
        db, restaurant, current_user
    )


@RESERVATION_CONTROLLER.patch(
    "/{reservation_id}/status", response_model=ReservationOut
)
def update_reservation_status(
    reservation_id: int,
    data: ReservationStatusUpdate,
    current_user: User = Depends(require_restaurant_owner_or_admin),
    db: Session = Depends(get_db),
):
    return reservation_service.update_reservation_status(
        db, reservation_id, data.status, current_user
    )
