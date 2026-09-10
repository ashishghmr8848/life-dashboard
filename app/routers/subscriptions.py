import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.integrations.sync_hooks import sync_subscription, unsync_subscription
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionOut, SubscriptionUpdate

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("", response_model=SubscriptionOut)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = Subscription(**payload.model_dump(), user_id=current_user.id)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    sync_subscription(db, current_user.id, subscription)
    return subscription


@router.get("", response_model=List[SubscriptionOut])
def list_subscriptions(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Subscription).filter(Subscription.user_id == current_user.id)
    if active_only:
        query = query.filter(Subscription.active.is_(True))
    return query.order_by(Subscription.next_due_date).all()


@router.get("/{subscription_id}", response_model=SubscriptionOut)
def get_subscription(
    subscription_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == current_user.id)
        .first()
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.patch("/{subscription_id}", response_model=SubscriptionOut)
def update_subscription(
    subscription_id: uuid.UUID,
    payload: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == current_user.id)
        .first()
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subscription, field, value)
    db.commit()
    db.refresh(subscription)
    if subscription.active:
        sync_subscription(db, current_user.id, subscription)
    else:
        unsync_subscription(db, current_user.id, subscription)
        subscription.calendar_event_id = None
        db.commit()
    return subscription


@router.delete("/{subscription_id}", status_code=204)
def delete_subscription(
    subscription_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == current_user.id)
        .first()
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    unsync_subscription(db, current_user.id, subscription)
    db.delete(subscription)
    db.commit()
