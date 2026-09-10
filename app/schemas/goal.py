import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class GoalBase(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Decimal = Decimal("0")
    target_date: Optional[date] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    target_date: Optional[date] = None


class GoalOut(GoalBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
