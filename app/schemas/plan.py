import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    linked_date: Optional[datetime] = None


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    linked_date: Optional[datetime] = None


class PlanOut(PlanBase):
    id: uuid.UUID
    calendar_event_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
