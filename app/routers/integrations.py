import os
import uuid
from typing import Optional

import jwt as pyjwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.core.crypto import encrypt_token
from app.core.security import create_oauth_state_token, decode_oauth_state_token
from app.database import get_db
from app.integrations import google_calendar as gcal
from app.models.google_integration import GoogleIntegration
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.integration import GoogleAuthorizationUrl, GoogleStatus, GoogleSyncResult

load_dotenv()

router = APIRouter(prefix="/integrations/google", tags=["integrations"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _get_integration(db: Session, user_id) -> Optional[GoogleIntegration]:
    return db.query(GoogleIntegration).filter(GoogleIntegration.user_id == user_id).first()


@router.get("/status", response_model=GoogleStatus)
def status_(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    integration = _get_integration(db, current_user.id)
    if not integration:
        return GoogleStatus(connected=False)
    return GoogleStatus(
        connected=True,
        google_email=integration.google_email,
        calendar_id=integration.calendar_id,
        connected_at=integration.connected_at.isoformat() if integration.connected_at else None,
    )


@router.get("/connect", response_model=GoogleAuthorizationUrl)
def connect(current_user: User = Depends(get_current_user)):
    """Returns the Google consent URL to redirect the browser to. A plain GET
    doesn't carry our Authorization header through Google's redirect round-trip,
    so the frontend calls this (authenticated) first, then does the redirect
    itself with the URL we hand back."""
    if not gcal.is_configured():
        raise HTTPException(status_code=503, detail="Google Calendar isn't configured on this server yet")
    state = create_oauth_state_token(subject=str(current_user.id))
    return GoogleAuthorizationUrl(authorization_url=gcal.build_authorization_url(state))


@router.get("/callback")
def callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Google redirects the browser here directly - there's no Authorization
    header available, which is exactly what the signed `state` token is for."""
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/settings?google=error")

    try:
        user_id = uuid.UUID(decode_oauth_state_token(state))
    except (pyjwt.PyJWTError, ValueError):
        return RedirectResponse(f"{FRONTEND_URL}/settings?google=error")

    try:
        refresh_token, email = gcal.exchange_code(code)
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/settings?google=error")

    integration = _get_integration(db, user_id)
    if integration:
        integration.encrypted_refresh_token = encrypt_token(refresh_token)
        integration.google_email = email
    else:
        integration = GoogleIntegration(
            user_id=user_id,
            encrypted_refresh_token=encrypt_token(refresh_token),
            google_email=email,
        )
        db.add(integration)
    db.commit()

    return RedirectResponse(f"{FRONTEND_URL}/settings?google=connected")


@router.post("/disconnect", status_code=204)
def disconnect(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(GoogleIntegration).filter(GoogleIntegration.user_id == current_user.id).delete()
    db.commit()


@router.post("/sync", response_model=GoogleSyncResult)
def sync_now(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Pushes every active subscription and every dated plan to Google Calendar
    as a single all-day event each, creating or updating in place."""
    integration = _get_integration(db, current_user.id)
    if not integration:
        raise HTTPException(status_code=400, detail="Google Calendar isn't connected")

    subs_synced = 0
    plans_synced = 0
    errors = []

    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.active.is_(True))
        .all()
    )
    for sub in subscriptions:
        try:
            event_id = gcal.upsert_event(
                integration,
                existing_event_id=sub.calendar_event_id,
                title=f"{sub.name} due — {sub.amount}",
                on_date=sub.next_due_date,
                description=f"Life Dashboard subscription reminder ({sub.billing_cycle.value}).",
            )
            sub.calendar_event_id = event_id
            subs_synced += 1
        except Exception as e:
            errors.append(f"{sub.name}: {e}")

    plans = (
        db.query(Plan)
        .filter(Plan.user_id == current_user.id, Plan.linked_date.isnot(None))
        .all()
    )
    for plan in plans:
        try:
            event_id = gcal.upsert_event(
                integration,
                existing_event_id=plan.calendar_event_id,
                title=plan.title,
                on_date=plan.linked_date.date(),
                description=plan.description or "Life Dashboard plan reminder.",
            )
            plan.calendar_event_id = event_id
            plans_synced += 1
        except Exception as e:
            errors.append(f"{plan.title}: {e}")

    db.commit()
    return GoogleSyncResult(subscriptions_synced=subs_synced, plans_synced=plans_synced, errors=errors)
