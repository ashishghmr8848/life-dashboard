import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    category: str
    note: Optional[str] = None
    occurred_on: date = date.today()
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
