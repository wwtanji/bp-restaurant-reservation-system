import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.services.auth_service import bcrypt_context

REGISTER_URL = "/authentication/register"
LOGIN_URL = "/authentication/login"
REFRESH_URL = "/authentication/refresh"
LOGOUT_URL = "/authentication/logout"
LOGOUT_ALL_URL = "/authentication/logout-all"
ME_URL = "/authentication/me"
CHANGE_PASSWORD_URL = "/authentication/change-password"

VALID_PASSWORD = "StrongPass1"

VALID_REGISTRATION = {
    "first_name": "John",
    "last_name": "Doe",
    "user_email": "john@example.com",
    "user_password": VALID_PASSWORD,
}


def _register_and_login(client: TestClient, email: str = "john@example.com") -> dict:
    reg_data = {**VALID_REGISTRATION, "user_email": email}
    client.post(REGISTER_URL, json=reg_data)
    resp = client.post(
        LOGIN_URL,
        json={"user_email": email, "user_password": VALID_PASSWORD},
    )
    return resp.json()


class TestRegister:
    def test_success(self, test_client: TestClient):
        resp = test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == VALID_REGISTRATION["user_email"]
        assert "message" in data

    def test_duplicate_email(self, test_client: TestClient):
        test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        resp = test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        assert resp.status_code == 400

    @pytest.mark.parametrize("password", [
        "short1A",
        "nouppercase1",
        "NOLOWERCASE1",
        "NoDigitsHere",
    ])
    def test_weak_password(self, test_client: TestClient, password: str):
        data = {**VALID_REGISTRATION, "user_password": password}
        resp = test_client.post(REGISTER_URL, json=data)
        assert resp.status_code == 422

    def test_invalid_email(self, test_client: TestClient):
        data = {**VALID_REGISTRATION, "user_email": "not-an-email"}
        resp = test_client.post(REGISTER_URL, json=data)
        assert resp.status_code == 422

    def test_owner_role_registration(self, test_client: TestClient):
        data = {**VALID_REGISTRATION, "role": UserRole.RESTAURANT_OWNER}
        resp = test_client.post(REGISTER_URL, json=data)
        assert resp.status_code == 200


class TestLogin:
    def test_success(self, test_client: TestClient):
        test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        resp = test_client.post(
            LOGIN_URL,
            json={
                "user_email": VALID_REGISTRATION["user_email"],
                "user_password": VALID_REGISTRATION["user_password"],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_wrong_password(self, test_client: TestClient):
        test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        resp = test_client.post(
            LOGIN_URL,
            json={
                "user_email": VALID_REGISTRATION["user_email"],
                "user_password": "WrongPass1",
            },
        )
        assert resp.status_code == 400

    def test_nonexistent_email(self, test_client: TestClient):
        resp = test_client.post(
            LOGIN_URL,
            json={"user_email": "nobody@example.com", "user_password": VALID_PASSWORD},
        )
        assert resp.status_code == 400

    def test_lockout_after_failures(self, test_client: TestClient):
        test_client.post(REGISTER_URL, json=VALID_REGISTRATION)
        for _ in range(5):
            test_client.post(
                LOGIN_URL,
                json={
                    "user_email": VALID_REGISTRATION["user_email"],
                    "user_password": "WrongPass1",
                },
            )
        resp = test_client.post(
            LOGIN_URL,
            json={
                "user_email": VALID_REGISTRATION["user_email"],
                "user_password": "WrongPass1",
            },
        )
        assert resp.status_code == 423


class TestRefreshToken:
    def test_new_token_pair(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        resp = test_client.post(
            REFRESH_URL, json={"refresh_token": tokens["refresh_token"]}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_invalid_token(self, test_client: TestClient):
        resp = test_client.post(
            REFRESH_URL, json={"refresh_token": "invalid-token"}
        )
        assert resp.status_code == 401


class TestLogout:
    def test_revoke_single_token(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        resp = test_client.post(
            LOGOUT_URL, json={"refresh_token": tokens["refresh_token"]}
        )
        assert resp.status_code == 200

    def test_revoke_all_tokens(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        resp = test_client.post(
            LOGOUT_ALL_URL, json={"refresh_token": tokens["refresh_token"]}
        )
        assert resp.status_code == 200


class TestGetMe:
    def test_returns_profile(self, test_client: TestClient, customer: User, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.get(ME_URL, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_email"] == customer.user_email
        assert data["first_name"] == customer.first_name

    def test_no_token(self, test_client: TestClient):
        resp = test_client.get(ME_URL)
        assert resp.status_code == 403


class TestUpdateMe:
    def test_updates_name(self, test_client: TestClient, customer: User, auth_headers):
        headers = auth_headers(customer)
        resp = test_client.put(
            ME_URL,
            headers=headers,
            json={"first_name": "Updated", "last_name": "Name"},
        )
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Updated"

    def test_no_token(self, test_client: TestClient):
        resp = test_client.put(
            ME_URL, json={"first_name": "Updated", "last_name": "Name"}
        )
        assert resp.status_code == 403


class TestChangePassword:
    def test_success(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = test_client.put(
            CHANGE_PASSWORD_URL,
            headers=headers,
            json={"current_password": VALID_PASSWORD, "new_password": "NewStrong1"},
        )
        assert resp.status_code == 200

    def test_wrong_current_password(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = test_client.put(
            CHANGE_PASSWORD_URL,
            headers=headers,
            json={"current_password": "WrongCurrent1", "new_password": "NewStrong1"},
        )
        assert resp.status_code == 400

    def test_weak_new_password(self, test_client: TestClient):
        tokens = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = test_client.put(
            CHANGE_PASSWORD_URL,
            headers=headers,
            json={"current_password": VALID_PASSWORD, "new_password": "weak"},
        )
        assert resp.status_code == 422
