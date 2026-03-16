from datetime import datetime

import pytest

from app.models.user import UserRole
from app.models.reservation import ReservationStatus


class TestAdminStats:
    def test_all_fields(self, test_client, admin, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get("/admin/stats", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_restaurants" in data
        assert "active_restaurants" in data
        assert "total_reservations" in data
        assert "todays_reservations" in data
        assert "total_reviews" in data
        assert "users_by_role" in data

    @pytest.mark.parametrize("role", [UserRole.CUSTOMER, UserRole.RESTAURANT_OWNER])
    def test_wrong_role(self, test_client, create_user, auth_headers, role):
        user = create_user(role=role)
        headers = auth_headers(user)
        resp = test_client.get("/admin/stats", headers=headers)
        assert resp.status_code == 403


class TestAdminUsers:
    def test_list(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get("/admin/users", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_filter_by_query(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get(
            f"/admin/users?q={customer.first_name}", headers=headers,
        )
        assert resp.status_code == 200
        emails = [u["user_email"] for u in resp.json()]
        assert customer.user_email in emails

    def test_filter_by_role(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get(
            f"/admin/users?role={UserRole.CUSTOMER}", headers=headers,
        )
        assert resp.status_code == 200
        for u in resp.json():
            assert u["role"] == UserRole.CUSTOMER

    def test_get_detail(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get(f"/admin/users/{customer.id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == customer.id
        assert "restaurant_count" in data
        assert "reservation_count" in data
        assert "review_count" in data

    def test_change_role(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/users/{customer.id}/role",
            headers=headers,
            json={"role": UserRole.RESTAURANT_OWNER},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == UserRole.RESTAURANT_OWNER

    def test_cannot_change_own_role(self, test_client, admin, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/users/{admin.id}/role",
            headers=headers,
            json={"role": UserRole.CUSTOMER},
        )
        assert resp.status_code == 400


class TestAdminLock:
    def test_lock_user(self, test_client, admin, customer, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/users/{customer.id}/lock",
            headers=headers,
            json={"locked": True},
        )
        assert resp.status_code == 200
        assert resp.json()["locked_until"] is not None

    def test_unlock_user(self, test_client, admin, customer, auth_headers, db_session):
        customer.locked_until = datetime(2099, 12, 31)
        db_session.commit()
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/users/{customer.id}/lock",
            headers=headers,
            json={"locked": False},
        )
        assert resp.status_code == 200
        assert resp.json()["locked_until"] is None


class TestAdminRestaurants:
    def test_list_with_owner_name(self, test_client, admin, restaurant, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.get("/admin/restaurants", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert "owner_name" in data[0]

    def test_filter_by_active(
        self, test_client, admin, restaurant, create_restaurant,
        owner, auth_headers,
    ):
        create_restaurant(owner.id, is_active=False)
        headers = auth_headers(admin)
        resp = test_client.get("/admin/restaurants?is_active=true", headers=headers)
        assert resp.status_code == 200
        for r in resp.json():
            assert r["is_active"] is True

    def test_toggle_active(self, test_client, admin, restaurant, auth_headers):
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/restaurants/{restaurant.id}/active",
            headers=headers,
            json={"is_active": False},
        )
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False


class TestAdminReservations:
    def test_list(
        self, test_client, admin, customer, restaurant, create_table,
        create_reservation, auth_headers, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(admin)
        resp = test_client.get("/admin/reservations", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert "restaurant_name" in data[0]
        assert "user_name" in data[0]

    def test_filter_by_status(
        self, test_client, admin, customer, restaurant, create_table,
        create_reservation, auth_headers, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
            status=ReservationStatus.CONFIRMED,
        )
        headers = auth_headers(admin)
        resp = test_client.get("/admin/reservations?status=confirmed", headers=headers)
        assert resp.status_code == 200
        for r in resp.json():
            assert r["status"] == "confirmed"

    def test_filter_by_date(
        self, test_client, admin, customer, restaurant, create_table,
        create_reservation, auth_headers, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        create_reservation(customer.id, restaurant.id, table.id, future_date, default_time)
        headers = auth_headers(admin)
        resp = test_client.get(
            f"/admin/reservations?date_from={future_date}&date_to={future_date}",
            headers=headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_status(
        self, test_client, admin, customer, restaurant, create_table,
        create_reservation, auth_headers, future_date, default_time,
    ):
        table = create_table(restaurant.id, 1, 4)
        reservation = create_reservation(
            customer.id, restaurant.id, table.id, future_date, default_time,
        )
        headers = auth_headers(admin)
        resp = test_client.patch(
            f"/admin/reservations/{reservation.id}/status",
            headers=headers,
            json={"status": "confirmed"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "confirmed"


class TestAdminReviews:
    def test_list(
        self, test_client, admin, customer, restaurant, create_review, auth_headers,
    ):
        create_review(customer.id, restaurant.id, rating=5)
        headers = auth_headers(admin)
        resp = test_client.get("/admin/reviews", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert "author_name" in data[0]
        assert "restaurant_name" in data[0]

    def test_filter_by_rating(
        self, test_client, admin, customer, restaurant, create_review, auth_headers,
    ):
        create_review(customer.id, restaurant.id, rating=5)
        headers = auth_headers(admin)
        resp = test_client.get("/admin/reviews?rating=5", headers=headers)
        assert resp.status_code == 200
        for r in resp.json():
            assert r["rating"] == 5

    def test_delete_and_recalculate(
        self, test_client, admin, customer, restaurant, create_review,
        auth_headers, db_session,
    ):
        review = create_review(customer.id, restaurant.id, rating=5)
        headers = auth_headers(admin)
        resp = test_client.delete(f"/admin/reviews/{review.id}", headers=headers)
        assert resp.status_code == 204
        db_session.refresh(restaurant)
        assert restaurant.review_count == 0
        assert restaurant.rating is None
