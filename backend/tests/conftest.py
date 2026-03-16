import os

os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import re
from datetime import date, time, timedelta
from collections.abc import Callable, Generator

import pytest
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from app.db.database import Base, get_db
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.reservation import Reservation, ReservationStatus
from app.models.review import Review
from app.utils.jwt_utils import create_access_token
from app.utils.rate_limiter import rate_limiter
from main import API

SQLITE_TEST_URL = "sqlite://"

engine = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _persist(db_session: Session, entity):
    db_session.add(entity)
    db_session.commit()
    db_session.refresh(entity)
    return entity


@pytest.fixture(autouse=True)
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    rate_limiter.requests = {}
    yield


@pytest.fixture
def test_client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db():
        yield db_session

    API.dependency_overrides[get_db] = _override_get_db
    with TestClient(API) as client:
        yield client
    API.dependency_overrides.clear()


@pytest.fixture
def auth_headers() -> Callable[[User], dict[str, str]]:
    def _factory(user: User) -> dict[str, str]:
        token = create_access_token({"sub": user.user_email})
        return {"Authorization": f"Bearer {token}"}

    return _factory


@pytest.fixture
def owner(db_session: Session) -> User:
    return _persist(db_session, User(
        first_name="Owner",
        last_name="Test",
        user_email="owner@test.com",
        user_password="hashed_pw",
        role=UserRole.RESTAURANT_OWNER,
        email_verified=True,
    ))


@pytest.fixture
def customer(db_session: Session) -> User:
    return _persist(db_session, User(
        first_name="Customer",
        last_name="Test",
        user_email="customer@test.com",
        user_password="hashed_pw",
        role=UserRole.CUSTOMER,
        email_verified=True,
    ))


@pytest.fixture
def admin(db_session: Session) -> User:
    return _persist(db_session, User(
        first_name="Admin",
        last_name="Test",
        user_email="admin@test.com",
        user_password="hashed_pw",
        role=UserRole.ADMIN,
        email_verified=True,
    ))


@pytest.fixture
def restaurant(db_session: Session, owner: User) -> Restaurant:
    return _persist(db_session, Restaurant(
        owner_id=owner.id,
        name="Test Restaurant",
        slug="test-restaurant",
        cuisine="Slovak",
        address="Test 1",
        city="Bratislava",
        is_active=True,
    ))


@pytest.fixture
def future_date() -> date:
    return date.today() + timedelta(days=7)


@pytest.fixture
def default_time() -> time:
    return time(18, 0)


@pytest.fixture
def create_table(db_session: Session) -> Callable[..., Table]:
    def _factory(
        restaurant_id: int,
        table_number: int,
        capacity: int,
        is_active: bool = True,
    ) -> Table:
        return _persist(db_session, Table(
            restaurant_id=restaurant_id,
            table_number=table_number,
            capacity=capacity,
            is_active=is_active,
        ))

    return _factory


@pytest.fixture
def create_user(db_session: Session) -> Callable[..., User]:
    _counter = 0

    def _factory(
        role: UserRole = UserRole.CUSTOMER,
        email_prefix: str = "user",
    ) -> User:
        nonlocal _counter
        _counter += 1
        return _persist(db_session, User(
            first_name=f"Test{_counter}",
            last_name="User",
            user_email=f"{email_prefix}{_counter}@test.com",
            user_password="hashed_pw",
            role=role,
            email_verified=True,
        ))

    return _factory


@pytest.fixture
def create_reservation(db_session: Session) -> Callable[..., Reservation]:
    def _factory(
        user_id: int,
        restaurant_id: int,
        table_id: int,
        reservation_date: date,
        reservation_time: time,
        party_size: int = 2,
        status: str = ReservationStatus.PENDING,
    ) -> Reservation:
        return _persist(db_session, Reservation(
            user_id=user_id,
            restaurant_id=restaurant_id,
            table_id=table_id,
            party_size=party_size,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
            guest_name="Test Guest",
            status=status,
        ))

    return _factory


@pytest.fixture
def create_restaurant(db_session: Session) -> Callable[..., Restaurant]:
    _counter = 0

    def _factory(
        owner_id: int,
        name: str = "Test Restaurant",
        city: str = "Bratislava",
        cuisine: str = "Slovak",
        is_active: bool = True,
    ) -> Restaurant:
        nonlocal _counter
        _counter += 1
        base_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        slug = f"{base_slug}-{_counter}"
        return _persist(db_session, Restaurant(
            owner_id=owner_id,
            name=name,
            slug=slug,
            cuisine=cuisine,
            address=f"Test Address {_counter}",
            city=city,
            is_active=is_active,
        ))

    return _factory


@pytest.fixture
def create_review(db_session: Session) -> Callable[..., Review]:
    def _factory(
        user_id: int,
        restaurant_id: int,
        rating: int = 4,
        text: str = "Great place!",
    ) -> Review:
        return _persist(db_session, Review(
            user_id=user_id,
            restaurant_id=restaurant_id,
            rating=rating,
            text=text,
        ))

    return _factory
