import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, Numeric, Date, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class BillingCycle(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    next_due_date = Column(Date, nullable=False, default=date.today)
    active = Column(Boolean, default=True)
    calendar_event_id = Column(String(255), nullable=True)  # Google Calendar event id, once synced

    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="subscription")
