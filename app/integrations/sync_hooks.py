from sqlalchemy.orm import Session

from app.integrations import google_calendar as gcal
from app.models.google_integration import GoogleIntegration

"""Best-effort push of subscriptions/plans to Google Calendar. Every function
here must never raise - a sync failure (not connected, Google API hiccup,
expired grant) must never break the underlying CRUD operation, since the
user's actual data is saved either way regardless of calendar sync."""


def _get_integration(db: Session, user_id):
    return db.query(GoogleIntegration).filter(GoogleIntegration.user_id == user_id).first()


def sync_subscription(db: Session, user_id, subscription) -> None:
    integration = _get_integration(db, user_id)
    if not integration:
        return
    try:
        event_id = gcal.upsert_event(
            integration,
            existing_event_id=subscription.calendar_event_id,
            title=f"{subscription.name} due — {subscription.amount}",
            on_date=subscription.next_due_date,
            description=f"Life Dashboard subscription reminder ({subscription.billing_cycle.value}).",
        )
        subscription.calendar_event_id = event_id
        db.commit()
    except Exception:
        db.rollback()


def unsync_subscription(db: Session, user_id, subscription) -> None:
    integration = _get_integration(db, user_id)
    if not integration or not subscription.calendar_event_id:
        return
    try:
        gcal.delete_event(integration, subscription.calendar_event_id)
    except Exception:
        pass


def sync_plan(db: Session, user_id, plan) -> None:
    integration = _get_integration(db, user_id)
    if not integration or not plan.linked_date:
        return
    try:
        event_id = gcal.upsert_event(
            integration,
            existing_event_id=plan.calendar_event_id,
            title=plan.title,
            on_date=plan.linked_date.date(),
            description=plan.description or "Life Dashboard plan reminder.",
        )
        plan.calendar_event_id = event_id
        db.commit()
    except Exception:
        db.rollback()


def unsync_plan(db: Session, user_id, plan) -> None:
    integration = _get_integration(db, user_id)
    if not integration or not plan.calendar_event_id:
        return
    try:
        gcal.delete_event(integration, plan.calendar_event_id)
    except Exception:
        pass
