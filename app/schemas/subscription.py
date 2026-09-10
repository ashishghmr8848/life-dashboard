import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.subscription import BillingCycle


class SubscriptionBase(BaseModel):
    name: str
    amount: Decimal
    billing_cycle: BillingCycle = BillingCycle.monthly
    next_due_date: date
    active: bool = True


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    billing_cycle: Optional[BillingCycle] = None
    next_due_date: Optional[date] = None
    active: Optional[bool] = None


class SubscriptionOut(SubscriptionBase):
    id: uuid.UUID
    calendar_event_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
