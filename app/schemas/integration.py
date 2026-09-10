from typing import List, Optional

from pydantic import BaseModel


class GoogleStatus(BaseModel):
    connected: bool
    google_email: Optional[str] = None
    calendar_id: Optional[str] = None
    connected_at: Optional[str] = None


class GoogleAuthorizationUrl(BaseModel):
    authorization_url: str


class GoogleSyncResult(BaseModel):
    subscriptions_synced: int
    plans_synced: int
    errors: List[str] = []
