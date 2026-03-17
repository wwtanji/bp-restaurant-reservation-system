import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.models.reservation import ReservationStatus
from app.schemas.table_schema import TableCreate, TableUpdate
from app.services import table_service


class TestCreateTable:
    def test_create_table_persists_all_fields(
        self, db_session: Session, restaurant: Restaurant, owner: User
    ):
        data = TableCreate(table_number=1, capacity=4)

        table = table_service.create_table(db_session, restaurant.id, owner.id, data)

        persisted = db_session.get(Table, table.id)
        assert persisted is not None
        assert persisted.table_number == 1
        assert persisted.capacity == 4
        assert persisted.is_active is True
        assert persisted.restaurant_id == restaurant.id
        assert persisted.created_at is not None

    def test_create_duplicate_table_number_returns_409(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        create_table(restaurant.id, table_number=1, capacity=4)

        with pytest.raises(HTTPException) as exc:
            table_service.create_table(
                db_session, restaurant.id, owner.id,
                TableCreate(table_number=1, capacity=6),
            )

        assert exc.value.status_code == 409
        assert "already exists" in exc.value.detail

    def test_create_table_by_non_owner_returns_404(
        self, db_session: Session, restaurant: Restaurant, customer: User
    ):
        with pytest.raises(HTTPException) as exc:
            table_service.create_table(
                db_session, restaurant.id, customer.id,
                TableCreate(table_number=1, capacity=4),
            )

        assert exc.value.status_code == 404

    def test_same_table_number_allowed_in_different_restaurants(
        self, db_session: Session, owner: User, create_table, create_restaurant,
    ):
        other_restaurant = create_restaurant(owner.id, name="Other Place", city="Košice")

        table_a = create_table(other_restaurant.id, table_number=1, capacity=4)
        table_b = table_service.create_table(
            db_session, other_restaurant.id, owner.id,
            TableCreate(table_number=2, capacity=6),
        )

        assert table_a.table_number == 1
        assert table_b.table_number == 2


class TestListTables:
    def test_returns_tables_ordered_by_number(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        create_table(restaurant.id, table_number=3, capacity=6)
        create_table(restaurant.id, table_number=1, capacity=2)
        create_table(restaurant.id, table_number=2, capacity=4)

        tables = table_service.list_tables(db_session, restaurant.id, owner.id)

        assert [t.table_number for t in tables] == [1, 2, 3]

    def test_returns_empty_list_when_no_tables_exist(
        self, db_session: Session, restaurant: Restaurant, owner: User
    ):
        result = table_service.list_tables(db_session, restaurant.id, owner.id)

        assert result == []


class TestGetTable:
    def test_returns_existing_table(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        created = create_table(restaurant.id, table_number=1, capacity=4)

        table = table_service.get_table(
            db_session, created.id, restaurant.id, owner.id
        )

        assert table.id == created.id
        assert table.capacity == 4

    def test_nonexistent_table_returns_404(
        self, db_session: Session, restaurant: Restaurant, owner: User
    ):
        with pytest.raises(HTTPException) as exc:
            table_service.get_table(db_session, 9999, restaurant.id, owner.id)

        assert exc.value.status_code == 404


class TestUpdateTable:
    def test_update_capacity(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        updated = table_service.update_table(
            db_session, table.id, restaurant.id, owner.id,
            TableUpdate(capacity=6),
        )

        assert updated.capacity == 6
        assert updated.table_number == 1

    def test_update_table_number(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        updated = table_service.update_table(
            db_session, table.id, restaurant.id, owner.id,
            TableUpdate(table_number=5),
        )

        assert updated.table_number == 5

    def test_update_table_number_to_same_value_succeeds(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=3, capacity=4)

        updated = table_service.update_table(
            db_session, table.id, restaurant.id, owner.id,
            TableUpdate(table_number=3),
        )

        assert updated.table_number == 3

    def test_update_table_number_to_existing_returns_409(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        create_table(restaurant.id, table_number=1, capacity=4)
        table_b = create_table(restaurant.id, table_number=2, capacity=6)

        with pytest.raises(HTTPException) as exc:
            table_service.update_table(
                db_session, table_b.id, restaurant.id, owner.id,
                TableUpdate(table_number=1),
            )

        assert exc.value.status_code == 409

    def test_deactivate_table(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        updated = table_service.update_table(
            db_session, table.id, restaurant.id, owner.id,
            TableUpdate(is_active=False),
        )

        assert updated.is_active is False

    def test_partial_update_preserves_other_fields(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        updated = table_service.update_table(
            db_session, table.id, restaurant.id, owner.id,
            TableUpdate(capacity=8),
        )

        assert updated.capacity == 8
        assert updated.table_number == 1
        assert updated.is_active is True


class TestDeleteTable:
    def test_delete_removes_table_from_database(
        self, db_session: Session, restaurant: Restaurant, owner: User, create_table
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)

        table_service.delete_table(db_session, table.id, restaurant.id, owner.id)

        assert db_session.get(Table, table.id) is None

    @pytest.mark.parametrize("blocking_status", [
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
    ])
    def test_delete_blocked_by_active_reservation(
        self,
        db_session: Session,
        restaurant: Restaurant,
        owner: User,
        customer: User,
        create_table,
        create_reservation,
        future_date,
        default_time,
        blocking_status: str,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)
        create_reservation(
            customer.id, restaurant.id, table.id,
            future_date, default_time, status=blocking_status,
        )

        with pytest.raises(HTTPException) as exc:
            table_service.delete_table(db_session, table.id, restaurant.id, owner.id)

        assert exc.value.status_code == 409
        assert "active reservations" in exc.value.detail

    @pytest.mark.parametrize("terminal_status", [
        ReservationStatus.CANCELLED,
        ReservationStatus.COMPLETED,
        ReservationStatus.NO_SHOW,
    ])
    def test_delete_allowed_when_all_reservations_terminal(
        self,
        db_session: Session,
        restaurant: Restaurant,
        owner: User,
        customer: User,
        create_table,
        create_reservation,
        future_date,
        default_time,
        terminal_status: str,
    ):
        table = create_table(restaurant.id, table_number=1, capacity=4)
        create_reservation(
            customer.id, restaurant.id, table.id,
            future_date, default_time, status=terminal_status,
        )

        table_service.delete_table(db_session, table.id, restaurant.id, owner.id)

        assert db_session.get(Table, table.id) is None
