import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    linked_date = Column(DateTime, nullable=True)
    calendar_event_id = Column(String(255), nullable=True)  # Google Calendar event id, once synced

    created_at = Column(DateTime, default=datetime.utcnow)
