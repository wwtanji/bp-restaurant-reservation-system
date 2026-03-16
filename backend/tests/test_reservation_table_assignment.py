from datetime import date, time, datetime, timedelta
from collections.abc import Callable

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.reservation_schema import ReservationCreate
from app.services import reservation_service
from app.services.reservation_service import TURN_HOURS

ARBITRARY_ANCHOR_DATE = date(2000, 6, 15)


def build_reservation_data(
    reservation_date: date,
    reservation_time: time,
    party_size: int = 2,
) -> ReservationCreate:
    return ReservationCreate(
        party_size=party_size,
        reservation_date=reservation_date,
        reservation_time=reservation_time,
        guest_name="Test Guest",
        guest_phone="+421900000000",
    )


def time_plus_minutes(base: time, minutes: int) -> time:
    anchor = datetime.combine(ARBITRARY_ANCHOR_DATE, base)
    return (anchor + timedelta(minutes=minutes)).time()


class TestBestFitTableSelection:
    def test_assigns_smallest_fitting_table(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=6)
        table_2 = create_table(restaurant.id, table_number=2, capacity=2)
        create_table(restaurant.id, table_number=3, capacity=10)

        data = build_reservation_data(future_date, default_time, party_size=2)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table_2.id

    def test_falls_back_to_next_smallest_when_best_fit_occupied(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table_2 = create_table(restaurant.id, table_number=1, capacity=2)
        table_4 = create_table(restaurant.id, table_number=2, capacity=4)
        create_table(restaurant.id, table_number=3, capacity=8)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table_2.id,
            future_date, default_time, party_size=2,
        )

        data = build_reservation_data(future_date, default_time, party_size=2)
        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table_4.id

    def test_skips_tables_with_insufficient_capacity(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=2)
        table_6 = create_table(restaurant.id, table_number=2, capacity=6)

        data = build_reservation_data(future_date, default_time, party_size=5)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table_6.id

    def test_exact_capacity_match_is_preferred_over_larger(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        table_4 = create_table(restaurant.id, table_number=1, capacity=4)
        create_table(restaurant.id, table_number=2, capacity=8)

        data = build_reservation_data(future_date, default_time, party_size=4)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table_4.id


class TestTableUnavailability:
    def test_fails_when_restaurant_has_no_tables(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        future_date: date,
        default_time: time,
    ):
        data = build_reservation_data(future_date, default_time, party_size=2)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409
        assert "no tables configured" in exc.value.detail.lower()

    def test_fails_when_no_table_has_sufficient_capacity(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=2)
        create_table(restaurant.id, table_number=2, capacity=4)

        data = build_reservation_data(future_date, default_time, party_size=8)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409
        assert "no suitable table" in exc.value.detail.lower()

    def test_fails_when_all_fitting_tables_are_occupied(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table.id,
            future_date, default_time, party_size=2,
        )

        data = build_reservation_data(future_date, default_time, party_size=2)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409

    def test_inactive_tables_are_invisible_to_assignment(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=4, is_active=False)

        data = build_reservation_data(future_date, default_time, party_size=2)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409

    def test_fails_when_restaurant_is_inactive(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=4)
        restaurant.is_active = False
        db_session.commit()

        data = build_reservation_data(future_date, default_time, party_size=2)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 404


class TestTimeSlotOverlapDetection:
    def test_overlapping_slot_assigns_different_table(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table_a = create_table(restaurant.id, table_number=1, capacity=4)
        table_b = create_table(restaurant.id, table_number=2, capacity=4)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table_a.id,
            future_date, default_time,
        )

        data = build_reservation_data(future_date, default_time, party_size=2)
        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table_b.id

    def test_non_overlapping_slot_reuses_same_table(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)
        first_time = time(12, 0)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table.id,
            future_date, first_time,
        )

        minutes_outside_window = int(TURN_HOURS * 60) + 1
        well_outside_window = time_plus_minutes(first_time, minutes_outside_window)
        data = build_reservation_data(future_date, well_outside_window, party_size=2)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table.id

    def test_different_date_same_time_reuses_same_table(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table.id,
            future_date, default_time,
        )

        next_day = future_date + timedelta(days=1)
        data = build_reservation_data(next_day, default_time, party_size=2)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table.id

    def test_reservation_just_inside_turn_window_causes_conflict(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table.id,
            future_date, time(18, 0),
        )

        minutes_inside_window = int(TURN_HOURS * 60) - 1
        near_time = time_plus_minutes(time(18, 0), minutes_inside_window)
        data = build_reservation_data(future_date, near_time, party_size=2)

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409

    def test_reservation_just_outside_turn_window_is_allowed(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        blocker = create_user()
        create_reservation(
            blocker.id, restaurant.id, table.id,
            future_date, time(12, 0),
        )

        minutes_outside_window = int(TURN_HOURS * 60) + 1
        outside_time = time_plus_minutes(time(12, 0), minutes_outside_window)

        data = build_reservation_data(future_date, outside_time, party_size=2)

        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table.id


class TestTerminalStatusFreesTable:
    @pytest.mark.parametrize("terminal_status", [
        ReservationStatus.CANCELLED,
        ReservationStatus.COMPLETED,
        ReservationStatus.NO_SHOW,
    ])
    def test_terminal_reservation_does_not_block_table(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
        terminal_status: str,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        previous_guest = create_user()
        create_reservation(
            previous_guest.id, restaurant.id, table.id,
            future_date, default_time, status=terminal_status,
        )

        data = build_reservation_data(future_date, default_time, party_size=2)
        result = reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        assert result.table_id == table.id


class TestUserDoubleBookingPrevention:
    def test_same_user_cannot_book_same_slot_twice(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=4)
        create_table(restaurant.id, table_number=2, capacity=4)

        data = build_reservation_data(future_date, default_time, party_size=2)
        reservation_service.create_reservation(
            db_session, customer, restaurant, data
        )

        with pytest.raises(HTTPException) as exc:
            reservation_service.create_reservation(
                db_session, customer, restaurant, data
            )

        assert exc.value.status_code == 409
        assert "already have a reservation" in exc.value.detail.lower()

    def test_same_user_can_book_non_overlapping_slots(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        future_date: date,
    ):
        create_table(restaurant.id, table_number=1, capacity=4)

        morning_time = time(10, 0)
        morning = build_reservation_data(future_date, morning_time, party_size=2)
        reservation_service.create_reservation(
            db_session, customer, restaurant, morning
        )

        minutes_outside_window = int(TURN_HOURS * 60) + 1
        evening_time = time_plus_minutes(morning_time, minutes_outside_window)
        evening = build_reservation_data(future_date, evening_time, party_size=2)
        result = reservation_service.create_reservation(
            db_session, customer, restaurant, evening
        )

        assert result.table_id is not None


class TestSlotAvailabilityQuery:
    def test_full_availability_when_no_reservations_exist(
        self,
        db_session: Session,
        restaurant: Restaurant,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=2)
        create_table(restaurant.id, table_number=2, capacity=4)

        result = reservation_service.get_slot_availability(
            db_session, restaurant, future_date, default_time, party_size=2
        )

        assert result["total_tables"] == 2
        assert result["available_tables"] == 2

    def test_availability_decrements_after_booking(
        self,
        db_session: Session,
        restaurant: Restaurant,
        customer: User,
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)
        create_table(restaurant.id, table_number=2, capacity=4)

        create_reservation(
            customer.id, restaurant.id, table.id,
            future_date, default_time,
        )

        result = reservation_service.get_slot_availability(
            db_session, restaurant, future_date, default_time, party_size=2
        )

        assert result["total_tables"] == 2
        assert result["available_tables"] == 1

    def test_total_tables_excludes_undersized_tables(
        self,
        db_session: Session,
        restaurant: Restaurant,
        create_table: Callable[..., Table],
        future_date: date,
        default_time: time,
    ):
        create_table(restaurant.id, table_number=1, capacity=2)
        create_table(restaurant.id, table_number=2, capacity=6)

        result = reservation_service.get_slot_availability(
            db_session, restaurant, future_date, default_time, party_size=5
        )

        assert result["total_tables"] == 1
        assert result["available_tables"] == 1

    def test_zero_availability_when_all_tables_booked(
        self,
        db_session: Session,
        restaurant: Restaurant,
        create_user: Callable[..., User],
        create_table: Callable[..., Table],
        create_reservation: Callable[..., Reservation],
        future_date: date,
        default_time: time,
    ):
        table_a = create_table(restaurant.id, table_number=1, capacity=4)
        table_b = create_table(restaurant.id, table_number=2, capacity=4)

        guest_a = create_user()
        guest_b = create_user()
        create_reservation(
            guest_a.id, restaurant.id, table_a.id,
            future_date, default_time,
        )
        create_reservation(
            guest_b.id, restaurant.id, table_b.id,
            future_date, default_time,
        )

        result = reservation_service.get_slot_availability(
            db_session, restaurant, future_date, default_time, party_size=2
        )

        assert result["total_tables"] == 2
        assert result["available_tables"] == 0
