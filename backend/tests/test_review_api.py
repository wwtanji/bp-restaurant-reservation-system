from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant


class TestCreateReview:
    def test_success(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 5, "text": "Amazing!"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["rating"] == 5
        assert data["restaurant_id"] == restaurant.id

    def test_rating_recalculation(
        self, test_client, customer, restaurant, auth_headers, db_session,
    ):
        headers = auth_headers(customer)
        test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 4},
        )
        db_session.refresh(restaurant)
        assert restaurant.rating == 4.0
        assert restaurant.review_count == 1

    def test_duplicate(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 5},
        )
        resp = test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 3},
        )
        assert resp.status_code == 409

    def test_nonexistent_restaurant(self, test_client, customer, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(
            "/reviews/9999",
            headers=headers,
            json={"rating": 5},
        )
        assert resp.status_code == 404

    def test_no_auth(self, test_client, restaurant):
        resp = test_client.post(
            f"/reviews/{restaurant.id}",
            json={"rating": 5},
        )
        assert resp.status_code == 403

    def test_invalid_rating_too_high(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 6},
        )
        assert resp.status_code == 422

    def test_invalid_rating_too_low(self, test_client, customer, restaurant, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.post(
            f"/reviews/{restaurant.id}",
            headers=headers,
            json={"rating": 0},
        )
        assert resp.status_code == 422


class TestListReviews:
    def test_latest_no_auth(self, test_client, customer, restaurant, create_review):
        create_review(customer.id, restaurant.id, rating=4)
        resp = test_client.get("/reviews/latest")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_by_restaurant_no_auth(
        self, test_client, customer, restaurant, create_review,
    ):
        create_review(customer.id, restaurant.id, rating=5)
        resp = test_client.get(f"/reviews/restaurant/{restaurant.id}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_my_reviews(
        self, test_client, customer, restaurant, create_review, auth_headers,
    ):
        create_review(customer.id, restaurant.id)
        headers = auth_headers(customer)
        resp = test_client.get("/reviews/my", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_pagination(self, test_client, restaurant, create_review, create_user):
        for _ in range(5):
            user = create_user()
            create_review(user.id, restaurant.id, rating=3)
        resp = test_client.get(f"/reviews/restaurant/{restaurant.id}?skip=0&limit=3")
        assert resp.status_code == 200
        assert len(resp.json()) == 3


class TestUpdateReview:
    def test_updates_rating_and_recalculates(
        self, test_client, customer, restaurant, create_review,
        auth_headers, db_session,
    ):
        review = create_review(customer.id, restaurant.id, rating=3)
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reviews/{review.id}",
            headers=headers,
            json={"rating": 5},
        )
        assert resp.status_code == 200
        assert resp.json()["rating"] == 5
        db_session.refresh(restaurant)
        assert restaurant.rating == 5.0

    def test_other_user(
        self, test_client, customer, restaurant, create_review,
        create_user, auth_headers,
    ):
        other = create_user()
        review = create_review(other.id, restaurant.id)
        headers = auth_headers(customer)
        resp = test_client.put(
            f"/reviews/{review.id}",
            headers=headers,
            json={"rating": 1},
        )
        assert resp.status_code == 404


class TestDeleteReview:
    def test_success(self, test_client, customer, restaurant, create_review, auth_headers):
        review = create_review(customer.id, restaurant.id)
        headers = auth_headers(customer)
        resp = test_client.delete(f"/reviews/{review.id}", headers=headers)
        assert resp.status_code == 204

    def test_recalculates_rating(
        self, test_client, customer, restaurant, create_review,
        create_user, auth_headers, db_session,
    ):
        other = create_user()
        create_review(customer.id, restaurant.id, rating=5)
        review2 = create_review(other.id, restaurant.id, rating=3)
        headers = auth_headers(other)
        test_client.delete(f"/reviews/{review2.id}", headers=headers)
        db_session.refresh(restaurant)
        assert restaurant.rating == 5.0
        assert restaurant.review_count == 1

    def test_other_user(
        self, test_client, customer, restaurant, create_review,
        create_user, auth_headers,
    ):
        other = create_user()
        review = create_review(other.id, restaurant.id)
        headers = auth_headers(customer)
        resp = test_client.delete(f"/reviews/{review.id}", headers=headers)
        assert resp.status_code == 404
