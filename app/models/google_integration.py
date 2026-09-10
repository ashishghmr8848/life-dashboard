import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class GoogleIntegration(Base):
    """One row per user who has connected Google Calendar. The refresh token is
    the only long-lived secret we keep - it's encrypted at rest (see
    app/core/crypto.py) and used to mint short-lived access tokens on demand."""

    __tablename__ = "google_integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    google_email = Column(String(255), nullable=True)
    encrypted_refresh_token = Column(String(1000), nullable=False)
    calendar_id = Column(String(255), nullable=False, default="primary")

    connected_at = Column(DateTime, default=datetime.utcnow)
