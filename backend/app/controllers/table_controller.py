from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.table_schema import TableCreate, TableUpdate, TableOut
from app.services import table_service
from app.utils.rbac import require_restaurant_owner

TABLE_CONTROLLER = APIRouter(prefix="/owners/restaurants/{restaurant_id}/tables")


@TABLE_CONTROLLER.get("/", response_model=list[TableOut])
def list_tables(
    restaurant_id: int,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
) -> list[TableOut]:
    return table_service.list_tables(db, restaurant_id, current_user.id)


@TABLE_CONTROLLER.post("/", response_model=TableOut, status_code=201)
def create_table(
    restaurant_id: int,
    data: TableCreate,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
) -> TableOut:
    return table_service.create_table(db, restaurant_id, current_user.id, data)


@TABLE_CONTROLLER.get("/{table_id}", response_model=TableOut)
def get_table(
    restaurant_id: int,
    table_id: int,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
) -> TableOut:
    return table_service.get_table(db, table_id, restaurant_id, current_user.id)


@TABLE_CONTROLLER.put("/{table_id}", response_model=TableOut)
def update_table(
    restaurant_id: int,
    table_id: int,
    data: TableUpdate,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
) -> TableOut:
    return table_service.update_table(db, table_id, restaurant_id, current_user.id, data)


@TABLE_CONTROLLER.delete("/{table_id}", status_code=204)
def delete_table(
    restaurant_id: int,
    table_id: int,
    current_user: User = Depends(require_restaurant_owner),
    db: Session = Depends(get_db),
) -> None:
    table_service.delete_table(db, table_id, restaurant_id, current_user.id)
