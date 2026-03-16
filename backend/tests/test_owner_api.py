from fastapi.testclient import TestClient

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant

BASE_URL = "/owners/restaurants"

RESTAURANT_DATA = {
    "name": "My Restaurant",
    "cuisine": "Italian",
    "address": "Via Roma 1",
    "city": "Bratislava",
}


class TestCreateRestaurant:
    def test_success(self, test_client, owner, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.post(f"{BASE_URL}/", headers=headers, json=RESTAURANT_DATA)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == RESTAURANT_DATA["name"]
        assert data["slug"]
        assert data["owner_id"] == owner.id

    def test_slug_generation(self, test_client, owner, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.post(f"{BASE_URL}/", headers=headers, json=RESTAURANT_DATA)
        assert resp.status_code == 201
        assert resp.json()["slug"] == "my-restaurant"

    def test_unique_slug_on_duplicate_name(self, test_client, owner, auth_headers):
        headers = auth_headers(owner)
        test_client.post(f"{BASE_URL}/", headers=headers, json=RESTAURANT_DATA)
        resp = test_client.post(f"{BASE_URL}/", headers=headers, json=RESTAURANT_DATA)
        assert resp.status_code == 201
        assert resp.json()["slug"] != "my-restaurant"

    def test_no_auth(self, test_client):
        resp = test_client.post(f"{BASE_URL}/", json=RESTAURANT_DATA)
        assert resp.status_code == 403

    def test_customer_forbidden(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(f"{BASE_URL}/", headers=headers, json=RESTAURANT_DATA)
        assert resp.status_code == 403


class TestListOwnerRestaurants:
    def test_own_active_only(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.get(f"{BASE_URL}/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_excludes_soft_deleted(
        self, test_client, owner, auth_headers, create_restaurant,
    ):
        create_restaurant(owner.id, is_active=False)
        headers = auth_headers(owner)
        resp = test_client.get(f"{BASE_URL}/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0


class TestGetOwnerRestaurant:
    def test_own_details(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.get(f"{BASE_URL}/{restaurant.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == restaurant.id

    def test_other_owner(self, test_client, restaurant, create_user, auth_headers):
        other = create_user(role=UserRole.RESTAURANT_OWNER)
        headers = auth_headers(other)
        resp = test_client.get(f"{BASE_URL}/{restaurant.id}", headers=headers)
        assert resp.status_code == 404


class TestUpdateRestaurant:
    def test_name_regenerates_slug(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.put(
            f"{BASE_URL}/{restaurant.id}",
            headers=headers,
            json={"name": "New Name"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "New Name"
        assert "new-name" in data["slug"]

    def test_partial_update_preserves_fields(
        self, test_client, owner, restaurant, auth_headers,
    ):
        headers = auth_headers(owner)
        resp = test_client.put(
            f"{BASE_URL}/{restaurant.id}",
            headers=headers,
            json={"cuisine": "French"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["cuisine"] == "French"
        assert data["city"] == restaurant.city


class TestDeleteRestaurant:
    def test_soft_deletes(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.delete(f"{BASE_URL}/{restaurant.id}", headers=headers)
        assert resp.status_code == 204
        resp = test_client.get(f"{BASE_URL}/{restaurant.id}", headers=headers)
        assert resp.status_code == 404

    def test_other_owner(self, test_client, restaurant, create_user, auth_headers):
        other = create_user(role=UserRole.RESTAURANT_OWNER)
        headers = auth_headers(other)
        resp = test_client.delete(f"{BASE_URL}/{restaurant.id}", headers=headers)
        assert resp.status_code == 404


class TestDashboardStats:
    def test_correct_counts(self, test_client, owner, restaurant, auth_headers):
        headers = auth_headers(owner)
        resp = test_client.get(f"{BASE_URL}/stats", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_restaurants"] == 1
        assert "total_reservations" in data
        assert "todays_reservations" in data

    def test_zero_with_no_restaurants(self, test_client, auth_headers, create_user):
        new_owner = create_user(role=UserRole.RESTAURANT_OWNER)
        headers = auth_headers(new_owner)
        resp = test_client.get(f"{BASE_URL}/stats", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total_restaurants"] == 0
