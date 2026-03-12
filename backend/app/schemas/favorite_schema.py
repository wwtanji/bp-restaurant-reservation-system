from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.restaurant_schema import RestaurantOut


class FavoriteOut(BaseModel):
    restaurant_id: int
    restaurant: RestaurantOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
