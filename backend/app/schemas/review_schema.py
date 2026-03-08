from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime

MIN_RATING = 1
MAX_RATING = 5
MAX_TEXT_LENGTH = 2000


class ReviewCreate(BaseModel):
    rating: int
    text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v: int) -> int:
        if v < MIN_RATING or v > MAX_RATING:
            raise ValueError(f"Rating must be between {MIN_RATING} and {MAX_RATING}")
        return v

    @field_validator("text")
    @classmethod
    def text_length(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Review text cannot exceed {MAX_TEXT_LENGTH} characters")
        return v if v else None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < MIN_RATING or v > MAX_RATING):
            raise ValueError(f"Rating must be between {MIN_RATING} and {MAX_RATING}")
        return v

    @field_validator("text")
    @classmethod
    def text_length(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Review text cannot exceed {MAX_TEXT_LENGTH} characters")
        return v if v else None


class ReviewAuthor(BaseModel):
    id: int
    first_name: str

    model_config = ConfigDict(from_attributes=True)


class ReviewRestaurantBrief(BaseModel):
    id: int
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class ReviewOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    rating: int
    text: Optional[str]
    author: ReviewAuthor = Field(validation_alias="user")
    restaurant: ReviewRestaurantBrief
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
