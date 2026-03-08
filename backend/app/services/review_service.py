from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.review import Review
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.review_schema import ReviewCreate, ReviewUpdate


def recalculate_rating(db: Session, restaurant_id: int) -> None:
    result = db.query(
        func.avg(Review.rating),
        func.count(Review.id),
    ).filter(Review.restaurant_id == restaurant_id).one()

    avg_rating, count = result
    db.query(Restaurant).filter(Restaurant.id == restaurant_id).update({
        Restaurant.rating: round(float(avg_rating), 2) if avg_rating else None,
        Restaurant.review_count: count,
    })
    db.flush()


def create_review(
    db: Session,
    user: User,
    restaurant_id: int,
    data: ReviewCreate,
) -> Review:
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active == True,
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    existing = db.query(Review).filter(
        Review.user_id == user.id,
        Review.restaurant_id == restaurant_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this restaurant",
        )

    review = Review(
        user_id=user.id,
        restaurant_id=restaurant_id,
        rating=data.rating,
        text=data.text,
    )
    db.add(review)
    db.flush()

    recalculate_rating(db, restaurant_id)
    db.commit()

    return get_review_with_relations(db, review.id)


def list_restaurant_reviews(
    db: Session,
    restaurant_id: int,
    skip: int,
    limit: int,
) -> list[Review]:
    return (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.restaurant))
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_user_reviews(db: Session, user_id: int) -> list[Review]:
    return (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.restaurant))
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def update_review(
    db: Session,
    review_id: int,
    user_id: int,
    data: ReviewUpdate,
) -> Review:
    review = get_review_with_relations(db, review_id)

    if review.user_id != user_id:
        raise HTTPException(status_code=404, detail="Review not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)

    db.flush()
    recalculate_rating(db, review.restaurant_id)
    db.commit()
    db.refresh(review)

    return review


def delete_review(db: Session, review_id: int, user_id: int) -> None:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != user_id:
        raise HTTPException(status_code=404, detail="Review not found")

    restaurant_id = review.restaurant_id
    db.delete(review)
    db.flush()
    recalculate_rating(db, restaurant_id)
    db.commit()


def get_review_with_relations(db: Session, review_id: int) -> Review:
    review = (
        db.query(Review)
        .options(joinedload(Review.user), joinedload(Review.restaurant))
        .filter(Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review
