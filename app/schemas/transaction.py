import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    category: str
    note: Optional[str] = None
    # default_factory, not `= date.today()` - a bare default is evaluated once at
    # class-definition time (server startup), not per-request, so it would freeze
    # to whatever day the server happened to start on.
    occurred_on: date = Field(default_factory=date.today)
    is_subscription_charge: bool = False
    subscription_id: Optional[uuid.UUID] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    note: Optional[str] = None
    occurred_on: Optional[date] = None


class TransactionOut(TransactionBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
