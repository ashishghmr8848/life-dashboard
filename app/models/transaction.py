import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, Numeric, Date, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TransactionType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # e.g. groceries, remittance, subscription
    note = Column(String(255), nullable=True)
    occurred_on = Column(Date, nullable=False, default=date.today, index=True)
    is_subscription_charge = Column(Boolean, default=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    subscription = relationship("Subscription", back_populates="transactions")
