import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.subscription import Subscription
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _assert_subscription_owned(db: Session, subscription_id, user_id):
    if subscription_id is None:
        return
    owned = (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )
    if not owned:
        raise HTTPException(status_code=404, detail="Subscription not found")


@router.post("", response_model=TransactionOut)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_subscription_owned(db, payload.subscription_id, current_user.id)
    transaction = Transaction(**payload.model_dump(), user_id=current_user.id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if category:
        query = query.filter(Transaction.category == category)
    if start_date:
        query = query.filter(Transaction.occurred_on >= start_date)
    if end_date:
        query = query.filter(Transaction.occurred_on <= end_date)
    return query.order_by(Transaction.occurred_on.desc()).all()


@router.get("/summary")
def spending_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Total spend grouped by category, for dashboard charts."""
    query = db.query(Transaction.category, func.sum(Transaction.amount).label("total")).filter(
        Transaction.user_id == current_user.id
    )
    if start_date:
        query = query.filter(Transaction.occurred_on >= start_date)
    if end_date:
        query = query.filter(Transaction.occurred_on <= end_date)
    results = query.group_by(Transaction.category).all()
    return [{"category": category, "total": float(total)} for category, total in results]


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updates = payload.model_dump(exclude_unset=True)
    if "subscription_id" in updates:
        _assert_subscription_owned(db, updates["subscription_id"], current_user.id)
    for field, value in updates.items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()
