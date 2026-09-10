import os
from datetime import date
from typing import Optional

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2 import id_token as google_id_token
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.crypto import decrypt_token
from app.models.google_integration import GoogleIntegration

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")

# Least-privilege: only create/update/delete events we made, nothing else on
# the calendar. "openid" + "userinfo.email" just let us show *which* Google
# account is connected - we never read the user's existing events.
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]


def is_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI)


def _client_config() -> dict:
    return {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }


def build_authorization_url(state: str) -> str:
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        # Force Google to hand back a refresh token even on a repeat connect
        # (it only does this by default on the very first ever consent).
        prompt="consent",
        include_granted_scopes="true",
        state=state,
    )
    return auth_url


def exchange_code(code: str) -> tuple[str, Optional[str]]:
    """Exchanges an OAuth code for tokens. Returns (refresh_token, google_email)."""
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI)
    flow.fetch_token(code=code)
    creds = flow.credentials
    if not creds.refresh_token:
        raise ValueError(
            "Google didn't return a refresh token. If you've connected this app before, "
            "remove its access under myaccount.google.com/permissions and try connecting again."
        )

    email = None
    if creds.id_token:
        try:
            claims = google_id_token.verify_oauth2_token(creds.id_token, Request(), GOOGLE_CLIENT_ID)
            email = claims.get("email")
        except ValueError:
            pass  # non-fatal - sync still works without knowing the email to display

    return creds.refresh_token, email


def _credentials_for(integration: GoogleIntegration) -> Credentials:
    creds = Credentials(
        token=None,
        refresh_token=decrypt_token(integration.encrypted_refresh_token),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return creds


def _service_for(integration: GoogleIntegration):
    return build("calendar", "v3", credentials=_credentials_for(integration), cache_discovery=False)


def upsert_event(
    integration: GoogleIntegration,
    *,
    existing_event_id: Optional[str],
    title: str,
    on_date: date,
    description: str = "",
) -> str:
    """Creates or updates a single all-day event representing the next reminder
    for one subscription/plan. Returns the event id to store back on the record."""
    service = _service_for(integration)
    body = {
        "summary": title,
        "description": description,
        "start": {"date": on_date.isoformat()},
        "end": {"date": on_date.isoformat()},
    }
    if existing_event_id:
        try:
            event = (
                service.events()
                .update(calendarId=integration.calendar_id, eventId=existing_event_id, body=body)
                .execute()
            )
            return event["id"]
        except HttpError as e:
            if e.resp.status != 404:
                raise
            # Deleted on the Google side (e.g. by the user) - recreate it below.

    event = service.events().insert(calendarId=integration.calendar_id, body=body).execute()
    return event["id"]


def delete_event(integration: GoogleIntegration, event_id: str) -> None:
    service = _service_for(integration)
    try:
        service.events().delete(calendarId=integration.calendar_id, eventId=event_id).execute()
    except HttpError as e:
        if e.resp.status != 404:
            raise
