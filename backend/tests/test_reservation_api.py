from datetime import date, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.reservation import ReservationStatus


class TestCreateReservation:
    def test_success(
        self, test_client, customer, restaurant, create_table,
        future_date, default_time, auth_headers,
    ):
        create_table(restaurant.id, 1, 4)
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["party_size"] == 2
        assert data["status"] == "pending"
        assert data["table"] is not None

    def test_no_auth(self, test_client, restaurant):
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            json={
                "party_size": 2,
                "reservation_date": "2030-01-01",
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 403

    def test_wrong_role(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": "2030-01-01",
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 403

    def test_nonexistent_restaurant(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(
            "/reservations/nonexistent-slug",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": "2030-01-01",
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 404

    def test_past_date(
        self, test_client, customer, restaurant, create_table, auth_headers,
    ):
        create_table(restaurant.id, 1, 4)
        headers = auth_headers(customer)
        yesterday = date.today() - timedelta(days=1)
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": str(yesterday),
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 400

    def test_no_tables(
        self, test_client, customer, restaurant, auth_headers, future_date,
    ):
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": str(future_date),
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 409

    def test_user_conflict(
        self, test_client, customer, restaurant, create_table,
        future_date, default_time, auth_headers,
    ):
        create_table(restaurant.id, 1, 4)
        create_table(restaurant.id, 2, 4)
        headers = auth_headers(customer)
        test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
            },
        )
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 2,
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 409

    def test_invalid_party_size(
        self, test_client, customer, restaurant, auth_headers, future_date,
    ):
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reservations/{restaurant.slug}",
            headers=headers,
            json={
                "party_size": 0,
                "reservation_date": str(future_date),
                "reservation_time": "18:00:00",
            },
        )
        assert resp.status_code == 422


class TestListMyReservations:
    def test_own_only(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(customer)
        resp = test_client.get("/reservations/my", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_filter_by_status(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        headers = auth_headers(customer)
        resp = test_client.get("/reservations/my?status=confirmed", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_filter_upcoming(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(customer)
        resp = test_client.get("/reservations/my?upcoming=true", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_empty(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/reservations/my", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []


class TestEditReservation:
    def test_pending_ok(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        new_date = future_date + timedelta(days=1)
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reservations/{reservation.id}",
            headers=headers,
            json={
                "party_size": 3,
                "reservation_date": str(new_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 200
        assert resp.json()["party_size"] == 3

    def test_confirmed_ok(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        new_date = future_date + timedelta(days=1)
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reservations/{reservation.id}",
            headers=headers,
            json={
                "party_size": 3,
                "reservation_date": str(new_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 200

    def test_cancelled_fails(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CANCELLED,
        )
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reservations/{reservation.id}",
            headers=headers,
            json={
                "party_size": 3,
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 400

    def test_other_user(
        self, test_client, customer, restaurant, create_table,
        create_reservation, create_user, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        other = create_user(role=UserRole.CUSTOMER)
        reservation = create_reservation(
            other.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reservations/{reservation.id}",
            headers=headers,
            json={
                "party_size": 3,
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
            },
        )
        assert resp.status_code == 404


class TestCancelReservation:
    def test_pending(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(customer)
        resp = test_client.delete(
            f"/reservations/{reservation.id}", headers=headers,
        )
        assert resp.status_code == 204

    def test_confirmed(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        headers = auth_headers(customer)
        resp = test_client.delete(
            f"/reservations/{reservation.id}", headers=headers,
        )
        assert resp.status_code == 204

    def test_completed_fails(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.COMPLETED,
        )
        headers = auth_headers(customer)
        resp = test_client.delete(
            f"/reservations/{reservation.id}", headers=headers,
        )
        assert resp.status_code == 400

    def test_other_user(
        self, test_client, customer, restaurant, create_table,
        create_reservation, create_user, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        other = create_user(role=UserRole.CUSTOMER)
        reservation = create_reservation(
            other.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(customer)
        resp = test_client.delete(
            f"/reservations/{reservation.id}", headers=headers,
        )
        assert resp.status_code == 404


class TestSlotAvailability:
    def test_correct_counts(
        self, test_client, customer, restaurant, create_table,
        future_date, default_time, auth_headers,
    ):
        create_table(restaurant.id, 1, 4)
        create_table(restaurant.id, 2, 4)
        headers = auth_headers(customer)
        resp = test_client.get(
            f"/reservations/{restaurant.slug}/availability",
            headers=headers,
            params={
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
                "party_size": 2,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_tables"] == 2
        assert data["available_tables"] == 2

    def test_reflects_bookings(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_table(restaurant.id, 2, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(customer)
        resp = test_client.get(
            f"/reservations/{restaurant.slug}/availability",
            headers=headers,
            params={
                "reservation_date": str(future_date),
                "reservation_time": str(default_time),
                "party_size": 2,
            },
        )
        assert resp.status_code == 200
        assert resp.json()["available_tables"] == 1


class TestListRestaurantReservations:
    def test_owner_sees_own(
        self, test_client, owner, restaurant, create_table,
        create_reservation, customer, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(owner)
        resp = test_client.get(
            f"/reservations/restaurant/{restaurant.slug}", headers=headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_wrong_owner(self, test_client, restaurant, create_user, auth_headers):
        other_owner = create_user(role=UserRole.RESTAURANT_OWNER)
        headers = auth_headers(other_owner)
        resp = test_client.get(
            f"/reservations/restaurant/{restaurant.slug}", headers=headers,
        )
        assert resp.status_code == 403

    def test_customer_forbidden(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get(
            f"/reservations/restaurant/{restaurant.slug}", headers=headers,
        )
        assert resp.status_code == 403


class TestUpdateReservationStatus:
    def test_confirm(
        self, test_client, owner, restaurant, create_table,
        create_reservation, customer, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(owner)
        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "confirmed"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "confirmed"

    def test_complete(
        self, test_client, owner, restaurant, create_table,
        create_reservation, customer, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        headers = auth_headers(owner)
        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "completed"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_no_show(
        self, test_client, owner, restaurant, create_table,
        create_reservation, customer, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        headers = auth_headers(owner)
        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "no_show"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "no_show"

    def test_invalid_transition(
        self, test_client, owner, restaurant, create_table,
        create_reservation, customer, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(owner)
        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "completed"},
        )
        assert resp.status_code == 400

    def test_customer_forbidden(
        self, test_client, customer, restaurant, create_table,
        create_reservation, future_date, default_time, auth_headers,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(customer)
        resp = test_client.patch(
            f"/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "confirmed"},
        )
        assert resp.status_code == 403
