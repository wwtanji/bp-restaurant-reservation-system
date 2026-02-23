import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.seating import SeatingArea, TableType
from app.models.reservation import ReservationHold, Reservation
from app.schemas.reservation_schema import (
    SeatingOptionResponse,
    HoldRequest,
    HoldResponse,
    HoldDetailResponse,
    CompleteReservationRequest,
    ReservationConfirmation,
    UserReservationResponse,
)
from app.utils.jwt_utils import verify_token

RESERVATION_CONTROLLER = APIRouter(prefix="/reservations", tags=["reservations"])
AVAILABILITY_CONTROLLER = APIRouter(prefix="/restaurants", tags=["availability"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="authentication/login")
HOLD_DURATION_MINUTES = 5


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_token(token)
    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user = db.query(User).filter(User.user_email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Shared availability helper ────────────────────────────────────────────────

def _count_active_holds(db: Session, *, restaurant_id: int, table_type_id: Optional[int],
                         date, time: str, now: datetime) -> int:
    q = db.query(ReservationHold).filter(
        ReservationHold.restaurant_id == restaurant_id,
        ReservationHold.date == date,
        ReservationHold.time == time,
        ReservationHold.expires_at > now,
        ReservationHold.is_converted == False,  # noqa: E712
    )
    if table_type_id is not None:
        q = q.filter(ReservationHold.table_type_id == table_type_id)
    return q.count()


def _count_confirmed_reservations(db: Session, *, restaurant_id: int,
                                   table_type_id: Optional[int], date, time: str) -> int:
    q = db.query(Reservation).filter(
        Reservation.restaurant_id == restaurant_id,
        Reservation.date == date,
        Reservation.time == time,
        Reservation.status == "confirmed",
    )
    if table_type_id is not None:
        q = q.filter(Reservation.table_type_id == table_type_id)
    return q.count()


# ── GET /restaurants/{restaurant_id}/availability ─────────────────────────────

@AVAILABILITY_CONTROLLER.get("/{restaurant_id}/availability",
                              response_model=List[SeatingOptionResponse])
def check_availability(
    restaurant_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    time: str = Query(..., description="Time in HH:MM format"),
    party_size: int = Query(..., ge=1, le=20),
    db: Session = Depends(get_db),
):
    from datetime import date as date_type
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True,  # noqa: E712
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    parsed_date = date_type.fromisoformat(date)
    now = datetime.now(timezone.utc)
    result: list[SeatingOptionResponse] = []

    table_types = (
        db.query(TableType)
        .join(SeatingArea)
        .filter(
            TableType.restaurant_id == restaurant_id,
            TableType.capacity_min <= party_size,
            TableType.capacity_max >= party_size,
            TableType.is_active == True,  # noqa: E712
            SeatingArea.is_active == True,  # noqa: E712
        )
        .all()
    )

    if not table_types:
        # Fallback: treat the entire restaurant as a single pool
        res_count = _count_confirmed_reservations(
            db, restaurant_id=restaurant_id, table_type_id=None, date=parsed_date, time=time
        )
        hold_count = _count_active_holds(
            db, restaurant_id=restaurant_id, table_type_id=None,
            date=parsed_date, time=time, now=now
        )
        total = restaurant.total_tables or 10
        available = total - res_count - hold_count
        result.append(SeatingOptionResponse(
            table_type_id=None,
            seating_area_name="Restaurant",
            table_type_name="Standard",
            capacity_min=1,
            capacity_max=restaurant.total_capacity or 10,
            is_available=available > 0,
            available_count=max(0, available),
        ))
    else:
        for tt in table_types:
            res_count = _count_confirmed_reservations(
                db, restaurant_id=restaurant_id, table_type_id=tt.id,
                date=parsed_date, time=time
            )
            hold_count = _count_active_holds(
                db, restaurant_id=restaurant_id, table_type_id=tt.id,
                date=parsed_date, time=time, now=now
            )
            available = tt.quantity - res_count - hold_count
            result.append(SeatingOptionResponse(
                table_type_id=tt.id,
                seating_area_name=tt.seating_area.name,
                table_type_name=tt.name,
                capacity_min=tt.capacity_min,
                capacity_max=tt.capacity_max,
                is_available=available > 0,
                available_count=max(0, available),
            ))

    return result


# ── POST /reservations/hold ───────────────────────────────────────────────────

@RESERVATION_CONTROLLER.post("/hold", response_model=HoldResponse)
def create_hold(request: HoldRequest, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == request.restaurant_id,
        Restaurant.is_active == True,  # noqa: E712
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    now = datetime.now(timezone.utc)

    # Verify availability before creating hold
    if request.table_type_id:
        tt = db.query(TableType).filter(
            TableType.id == request.table_type_id,
            TableType.restaurant_id == request.restaurant_id,
            TableType.is_active == True,  # noqa: E712
        ).first()
        if not tt:
            raise HTTPException(status_code=400, detail="Invalid seating option")

        res_count = _count_confirmed_reservations(
            db, restaurant_id=request.restaurant_id, table_type_id=tt.id,
            date=request.date, time=request.time
        )
        hold_count = _count_active_holds(
            db, restaurant_id=request.restaurant_id, table_type_id=tt.id,
            date=request.date, time=request.time, now=now
        )
        if tt.quantity - res_count - hold_count <= 0:
            raise HTTPException(status_code=409, detail="No tables available for the selected time")

        seating_area_name = tt.seating_area.name
        table_type_name = tt.name
    else:
        # Restaurant-level availability fallback
        res_count = _count_confirmed_reservations(
            db, restaurant_id=request.restaurant_id, table_type_id=None,
            date=request.date, time=request.time
        )
        hold_count = _count_active_holds(
            db, restaurant_id=request.restaurant_id, table_type_id=None,
            date=request.date, time=request.time, now=now
        )
        total = restaurant.total_tables or 10
        if total - res_count - hold_count <= 0:
            raise HTTPException(status_code=409, detail="No tables available for the selected time")

        seating_area_name = "Restaurant"
        table_type_name = "Standard"

    token = str(uuid.uuid4())
    expires_at = now + timedelta(minutes=HOLD_DURATION_MINUTES)

    hold = ReservationHold(
        restaurant_id=request.restaurant_id,
        table_type_id=request.table_type_id,
        date=request.date,
        time=request.time,
        party_size=request.party_size,
        availability_token=token,
        expires_at=expires_at,
    )
    db.add(hold)
    db.commit()
    db.refresh(hold)

    return HoldResponse(
        availability_token=token,
        expires_at=expires_at,
        restaurant_id=restaurant.id,
        restaurant_name=restaurant.name,
        restaurant_slug=restaurant.slug,
        restaurant_cover_image_url=restaurant.cover_image_url,
        date=request.date,
        time=request.time,
        party_size=request.party_size,
        seating_area_name=seating_area_name,
        table_type_name=table_type_name,
    )


# ── GET /reservations/hold/{token} ───────────────────────────────────────────

@RESERVATION_CONTROLLER.get("/hold/{token}", response_model=HoldDetailResponse)
def get_hold(token: str, db: Session = Depends(get_db)):
    hold = db.query(ReservationHold).filter(
        ReservationHold.availability_token == token
    ).first()
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found")

    restaurant = db.query(Restaurant).filter(Restaurant.id == hold.restaurant_id).first()
    now = datetime.now(timezone.utc)

    seating_area_name = "Restaurant"
    table_type_name = "Standard"
    if hold.table_type_id and hold.table_type:
        seating_area_name = hold.table_type.seating_area.name
        table_type_name = hold.table_type.name

    return HoldDetailResponse(
        availability_token=hold.availability_token,
        expires_at=hold.expires_at,
        restaurant_id=restaurant.id if restaurant else hold.restaurant_id,
        restaurant_name=restaurant.name if restaurant else "",
        restaurant_slug=restaurant.slug if restaurant else None,
        restaurant_cover_image_url=restaurant.cover_image_url if restaurant else None,
        date=hold.date,
        time=hold.time,
        party_size=hold.party_size,
        seating_area_name=seating_area_name,
        table_type_name=table_type_name,
        is_converted=hold.is_converted,
        is_expired=hold.expires_at < now,
    )


# ── POST /reservations/complete ───────────────────────────────────────────────

@RESERVATION_CONTROLLER.post("/complete", response_model=ReservationConfirmation)
def complete_reservation(
    request: CompleteReservationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    hold = db.query(ReservationHold).filter(
        ReservationHold.availability_token == request.availability_token,
        ReservationHold.is_converted == False,  # noqa: E712
    ).first()

    if not hold:
        raise HTTPException(
            status_code=400,
            detail="Invalid or already used reservation token"
        )
    if hold.expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Reservation hold has expired. Please select a new time."
        )

    seating_area_name = "Restaurant"
    table_type_name = "Standard"
    if hold.table_type_id and hold.table_type:
        seating_area_name = hold.table_type.seating_area.name
        table_type_name = hold.table_type.name

    reservation = Reservation(
        user_id=current_user.id,
        restaurant_id=hold.restaurant_id,
        table_type_id=hold.table_type_id,
        availability_token=hold.availability_token,
        date=hold.date,
        time=hold.time,
        party_size=hold.party_size,
        seating_area_name=seating_area_name,
        table_type_name=table_type_name,
        occasion=request.occasion,
        special_requests=request.special_requests,
        status="confirmed",
        opt_in_restaurant=request.opt_in_restaurant,
        opt_in_platform=request.opt_in_platform,
        opt_in_sms=request.opt_in_sms,
    )
    hold.is_converted = True

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    restaurant = db.query(Restaurant).filter(Restaurant.id == hold.restaurant_id).first()

    return ReservationConfirmation(
        reservation_id=reservation.id,
        restaurant_name=restaurant.name if restaurant else "",
        restaurant_slug=restaurant.slug if restaurant else None,
        restaurant_cover_image_url=restaurant.cover_image_url if restaurant else None,
        date=reservation.date,
        time=reservation.time,
        party_size=reservation.party_size,
        seating_area_name=seating_area_name,
        table_type_name=table_type_name,
        status=reservation.status,
        created_at=reservation.created_at,
    )


# ── GET /reservations/my ─────────────────────────────────────────────────────

@RESERVATION_CONTROLLER.get("/my", response_model=List[UserReservationResponse])
def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reservations = (
        db.query(Reservation)
        .filter(Reservation.user_id == current_user.id)
        .order_by(Reservation.date.desc())
        .all()
    )

    result = []
    for r in reservations:
        restaurant = db.query(Restaurant).filter(Restaurant.id == r.restaurant_id).first()
        result.append(UserReservationResponse(
            id=r.id,
            restaurant_id=r.restaurant_id,
            restaurant_name=restaurant.name if restaurant else "",
            restaurant_slug=restaurant.slug if restaurant else None,
            restaurant_cover_image_url=restaurant.cover_image_url if restaurant else None,
            date=r.date,
            time=r.time,
            party_size=r.party_size,
            seating_area_name=r.seating_area_name,
            table_type_name=r.table_type_name,
            occasion=r.occasion,
            special_requests=r.special_requests,
            status=r.status,
            created_at=r.created_at,
        ))
    return result


# ── DELETE /reservations/{id} ─────────────────────────────────────────────────

@RESERVATION_CONTROLLER.delete("/{reservation_id}")
def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Only confirmed reservations can be cancelled"
        )
    reservation.status = "cancelled"
    db.commit()
    return {"message": "Reservation cancelled successfully"}
