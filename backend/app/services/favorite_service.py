from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.favorite import Favorite
from app.models.user import User
from app.services.restaurant_service import get_active_restaurant_or_404


def add_favorite(db: Session, user: User, restaurant_id: int) -> Favorite:
    get_active_restaurant_or_404(db, restaurant_id)

    existing = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.restaurant_id == restaurant_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already in favorites")

    favorite = Favorite(user_id=user.id, restaurant_id=restaurant_id)
    db.add(favorite)
    db.commit()

    return (
        db.query(Favorite)
        .options(joinedload(Favorite.restaurant))
        .filter(
            Favorite.user_id == user.id,
            Favorite.restaurant_id == restaurant_id,
        )
        .one()
    )


def remove_favorite(db: Session, user_id: int, restaurant_id: int) -> None:
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.restaurant_id == restaurant_id,
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()


def list_user_favorites(db: Session, user_id: int) -> list[Favorite]:
    return (
        db.query(Favorite)
        .options(joinedload(Favorite.restaurant))
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
