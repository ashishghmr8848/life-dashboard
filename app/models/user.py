import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=True)
    # The first account ever registered becomes admin automatically (see
    # app/routers/auth.py). Additional admins can only be promoted directly
    # in the database for now - there's no self-service promotion flow.
    is_admin = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Forgot-password flow (app/routers/auth.py): a hashed, short-lived,
    # single-use 6-digit code emailed to the account's own address. Cleared
    # on successful use; a new request overwrites any code still pending.
    reset_code_hash = Column(String(255), nullable=True)
    reset_code_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
