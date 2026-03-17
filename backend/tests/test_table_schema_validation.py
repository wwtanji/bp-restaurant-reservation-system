import pytest
from pydantic import ValidationError

from app.schemas.table_schema import (
    TableCreate,
    TableUpdate,
    MIN_TABLE_CAPACITY,
    MAX_TABLE_CAPACITY,
    MIN_TABLE_NUMBER,
)


class TestTableCreateValidation:
    def test_valid_input_passes(self):
        data = TableCreate(table_number=1, capacity=4)

        assert data.table_number == 1
        assert data.capacity == 4

    def test_capacity_at_minimum_boundary(self):
        data = TableCreate(table_number=1, capacity=MIN_TABLE_CAPACITY)

        assert data.capacity == MIN_TABLE_CAPACITY

    def test_capacity_at_maximum_boundary(self):
        data = TableCreate(table_number=1, capacity=MAX_TABLE_CAPACITY)

        assert data.capacity == MAX_TABLE_CAPACITY

    def test_capacity_below_minimum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableCreate(table_number=1, capacity=MIN_TABLE_CAPACITY - 1)

        assert "capacity" in str(exc.value).lower()

    def test_capacity_above_maximum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableCreate(table_number=1, capacity=MAX_TABLE_CAPACITY + 1)

        assert "capacity" in str(exc.value).lower()

    def test_table_number_at_minimum_boundary(self):
        data = TableCreate(table_number=MIN_TABLE_NUMBER, capacity=4)

        assert data.table_number == MIN_TABLE_NUMBER

    def test_table_number_below_minimum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableCreate(table_number=MIN_TABLE_NUMBER - 1, capacity=4)

        assert "table_number" in str(exc.value).lower()


class TestTableUpdateValidation:
    def test_all_fields_optional(self):
        data = TableUpdate()

        assert data.table_number is None
        assert data.capacity is None
        assert data.is_active is None

    def test_partial_update_single_field(self):
        data = TableUpdate(capacity=6)

        assert data.capacity == 6
        assert data.table_number is None

    def test_capacity_above_maximum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableUpdate(capacity=MAX_TABLE_CAPACITY + 1)

        assert "capacity" in str(exc.value).lower()

    def test_capacity_below_minimum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableUpdate(capacity=MIN_TABLE_CAPACITY - 1)

        assert "capacity" in str(exc.value).lower()

    def test_table_number_below_minimum_rejected(self):
        with pytest.raises(ValidationError) as exc:
            TableUpdate(table_number=MIN_TABLE_NUMBER - 1)

        assert "table_number" in str(exc.value).lower()
