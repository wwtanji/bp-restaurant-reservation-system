from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.table import Table
from app.models.reservation import Reservation, ACTIVE_STATUSES
from app.services.restaurant_service import get_owner_restaurant
from app.schemas.table_schema import TableCreate, TableUpdate


def list_tables(db: Session, restaurant_id: int, owner_id: int) -> list[Table]:
    get_owner_restaurant(db, restaurant_id, owner_id)
    return (
        db.query(Table)
        .filter(Table.restaurant_id == restaurant_id)
        .order_by(Table.table_number)
        .all()
    )


def get_table(db: Session, table_id: int, restaurant_id: int, owner_id: int) -> Table:
    get_owner_restaurant(db, restaurant_id, owner_id)
    table = (
        db.query(Table)
        .filter(Table.id == table_id, Table.restaurant_id == restaurant_id)
        .first()
    )
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


def create_table(
    db: Session, restaurant_id: int, owner_id: int, data: TableCreate
) -> Table:
    get_owner_restaurant(db, restaurant_id, owner_id)

    duplicate = (
        db.query(Table)
        .filter(
            Table.restaurant_id == restaurant_id,
            Table.table_number == data.table_number,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"Table number {data.table_number} already exists in this restaurant",
        )

    table = Table(
        restaurant_id=restaurant_id,
        table_number=data.table_number,
        capacity=data.capacity,
    )
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


def update_table(
    db: Session, table_id: int, restaurant_id: int, owner_id: int, data: TableUpdate
) -> Table:
    table = get_table(db, table_id, restaurant_id, owner_id)
    update_data = data.model_dump(exclude_unset=True)

    if "table_number" in update_data and update_data["table_number"] != table.table_number:
        duplicate = (
            db.query(Table)
            .filter(
                Table.restaurant_id == restaurant_id,
                Table.table_number == update_data["table_number"],
                Table.id != table_id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"Table number {update_data['table_number']} already exists in this restaurant",
            )

    for field, value in update_data.items():
        setattr(table, field, value)

    db.commit()
    db.refresh(table)
    return table


def delete_table(
    db: Session, table_id: int, restaurant_id: int, owner_id: int
) -> None:
    table = get_table(db, table_id, restaurant_id, owner_id)

    has_active = (
        db.query(Reservation)
        .filter(
            Reservation.table_id == table_id,
            Reservation.status.in_(ACTIVE_STATUSES),
        )
        .first()
    )
    if has_active:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a table with active reservations",
        )

    db.delete(table)
    db.commit()
