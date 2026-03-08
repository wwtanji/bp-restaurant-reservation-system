from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.review_schema import ReviewCreate, ReviewUpdate, ReviewOut
from app.services import review_service
from app.utils.rbac import get_current_user

REVIEW_CONTROLLER = APIRouter(prefix="/reviews")


@REVIEW_CONTROLLER.post("/{restaurant_id}", response_model=ReviewOut, status_code=201)
def create_review(
    restaurant_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.create_review(db, current_user, restaurant_id, data)


@REVIEW_CONTROLLER.get("/restaurant/{restaurant_id}", response_model=list[ReviewOut])
def list_restaurant_reviews(
    restaurant_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
):
    return review_service.list_restaurant_reviews(db, restaurant_id, skip, limit)


@REVIEW_CONTROLLER.get("/my", response_model=list[ReviewOut])
def list_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.list_user_reviews(db, current_user.id)


@REVIEW_CONTROLLER.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.update_review(db, review_id, current_user.id, data)


@REVIEW_CONTROLLER.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review_service.delete_review(db, review_id, current_user.id)
