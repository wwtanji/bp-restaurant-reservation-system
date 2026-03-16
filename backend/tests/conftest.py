from datetime import date, time, timedelta
from collections.abc import Callable, Generator

import pytest
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session

from app.db.database import Base
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.reservation import Reservation, ReservationStatus

SQLITE_TEST_URL = "sqlite://"

engine = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def owner(db_session: Session) -> User:
    user = User(
        first_name="Owner",
        last_name="Test",
        user_email="owner@test.com",
        user_password="hashed_pw",
        role=UserRole.RESTAURANT_OWNER,
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def customer(db_session: Session) -> User:
    user = User(
        first_name="Customer",
        last_name="Test",
        user_email="customer@test.com",
        user_password="hashed_pw",
        role=UserRole.CUSTOMER,
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def restaurant(db_session: Session, owner: User) -> Restaurant:
    r = Restaurant(
        owner_id=owner.id,
        name="Test Restaurant",
        slug="test-restaurant",
        cuisine="Slovak",
        address="Test 1",
        city="Bratislava",
        is_active=True,
    )
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


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
        table = Table(
            restaurant_id=restaurant_id,
            table_number=table_number,
            capacity=capacity,
            is_active=is_active,
        )
        db_session.add(table)
        db_session.commit()
        db_session.refresh(table)
        return table

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
        user = User(
            first_name=f"Test{_counter}",
            last_name="User",
            user_email=f"{email_prefix}{_counter}@test.com",
            user_password="hashed_pw",
            role=role,
            email_verified=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

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
        reservation = Reservation(
            user_id=user_id,
            restaurant_id=restaurant_id,
            table_id=table_id,
            party_size=party_size,
            reservation_date=reservation_date,
            reservation_time=reservation_time,
            guest_name="Test Guest",
            status=status,
        )
        db_session.add(reservation)
        db_session.commit()
        db_session.refresh(reservation)
        return reservation

    return _factory
