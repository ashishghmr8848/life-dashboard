import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)  # e.g. "Emergency fund", "Trip to Nepal"
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), nullable=False, default=0)
    target_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
