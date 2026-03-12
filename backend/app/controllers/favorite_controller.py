from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.favorite_schema import FavoriteOut
from app.services import favorite_service
from app.utils.rbac import get_current_user

FAVORITE_CONTROLLER = APIRouter(prefix="/favorites")


@FAVORITE_CONTROLLER.get("/", response_model=list[FavoriteOut])
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return favorite_service.list_user_favorites(db, current_user.id)


@FAVORITE_CONTROLLER.post("/{restaurant_id}", response_model=FavoriteOut, status_code=201)
def add_favorite(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return favorite_service.add_favorite(db, current_user, restaurant_id)


@FAVORITE_CONTROLLER.delete("/{restaurant_id}", status_code=204)
def remove_favorite(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite_service.remove_favorite(db, current_user.id, restaurant_id)
