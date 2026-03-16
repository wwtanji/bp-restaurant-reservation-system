from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime

MIN_TABLE_CAPACITY = 1
MAX_TABLE_CAPACITY = 20
MIN_TABLE_NUMBER = 1


class TableCreate(BaseModel):
    table_number: int
    capacity: int

    @field_validator("table_number")
    @classmethod
    def validate_table_number(cls, v: int) -> int:
        if v < MIN_TABLE_NUMBER:
            raise ValueError(f"Table number must be at least {MIN_TABLE_NUMBER}")
        return v

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v < MIN_TABLE_CAPACITY:
            raise ValueError(f"Capacity must be at least {MIN_TABLE_CAPACITY}")
        if v > MAX_TABLE_CAPACITY:
            raise ValueError(f"Capacity cannot exceed {MAX_TABLE_CAPACITY}")
        return v


class TableUpdate(BaseModel):
    table_number: Optional[int] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator("table_number")
    @classmethod
    def validate_table_number(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < MIN_TABLE_NUMBER:
            raise ValueError(f"Table number must be at least {MIN_TABLE_NUMBER}")
        return v

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None:
            if v < MIN_TABLE_CAPACITY:
                raise ValueError(f"Capacity must be at least {MIN_TABLE_CAPACITY}")
            if v > MAX_TABLE_CAPACITY:
                raise ValueError(f"Capacity cannot exceed {MAX_TABLE_CAPACITY}")
        return v


class TableOut(BaseModel):
    id: int
    table_number: int
    capacity: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class TableBrief(BaseModel):
    id: int
    table_number: int
    capacity: int

    model_config = ConfigDict(from_attributes=True)
