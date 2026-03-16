from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant


class TestListRestaurants:
    def test_returns_active(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["slug"] == restaurant.slug

    def test_excludes_inactive(
        self, test_client, customer, create_restaurant, owner, auth_headers,
    ):
        create_restaurant(owner.id, is_active=False)
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_filter_city(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?city=Bratislava", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_filter_cuisine(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?cuisine=Slovak", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_search_query(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?q=Test", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_filter_rating_min(
        self, test_client, customer, auth_headers, db_session,
        owner, create_restaurant,
    ):
        r = create_restaurant(owner.id, name="Rated")
        r.rating = 4.5
        db_session.commit()
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?rating_min=4.0", headers=headers)
        assert resp.status_code == 200
        slugs = [x["slug"] for x in resp.json()]
        assert r.slug in slugs

    def test_sort_by_name(
        self, test_client, customer, auth_headers, owner, create_restaurant,
    ):
        create_restaurant(owner.id, name="Aaa")
        create_restaurant(owner.id, name="Zzz")
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?sort_by=name_asc", headers=headers)
        assert resp.status_code == 200
        names = [r["name"] for r in resp.json()]
        assert names == sorted(names)

    def test_pagination(
        self, test_client, customer, auth_headers, owner, create_restaurant,
    ):
        for i in range(5):
            create_restaurant(owner.id, name=f"Rest {i}")
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/?limit=3", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_no_auth(self, test_client):
        resp = test_client.get("/restaurants/")
        assert resp.status_code == 403


class TestListCities:
    def test_distinct_cities(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/cities", headers=headers)
        assert resp.status_code == 200
        assert "Bratislava" in resp.json()

    def test_excludes_inactive(
        self, test_client, customer, create_restaurant, owner, auth_headers,
    ):
        create_restaurant(owner.id, city="Ghost", is_active=False)
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/cities", headers=headers)
        assert resp.status_code == 200
        assert "Ghost" not in resp.json()


class TestGetRestaurantBySlug:
    def test_details(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get(f"/restaurants/{restaurant.slug}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == restaurant.id

    def test_nonexistent(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get("/restaurants/no-such-place", headers=headers)
        assert resp.status_code == 404

    def test_inactive(
        self, test_client, customer, create_restaurant, owner, auth_headers,
    ):
        r = create_restaurant(owner.id, is_active=False)
        headers = auth_headers(customer)
        resp = test_client.get(f"/restaurants/{r.slug}", headers=headers)
        assert resp.status_code == 404
