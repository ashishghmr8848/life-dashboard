import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models.goal import Goal
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.admin import AdminUserUpdate, UserDetail, UserSummary
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])

MONTHLY_MULTIPLIER = {"weekly": 52 / 12, "monthly": 1, "yearly": 1 / 12}


@router.get("/users", response_model=List[UserSummary])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    """All accounts with an at-a-glance summary of their data - the admin overview."""
    users = db.query(User).order_by(User.created_at).all()
    summaries = []
    for u in users:
        transactions = db.query(Transaction).filter(Transaction.user_id == u.id).all()
        total_spend = sum(float(t.amount) for t in transactions if t.type == TransactionType.debit)
        total_income = sum(float(t.amount) for t in transactions if t.type == TransactionType.credit)

        subscriptions = db.query(Subscription).filter(Subscription.user_id == u.id).all()
        monthly_cost = sum(
            float(s.amount) * MONTHLY_MULTIPLIER.get(s.billing_cycle.value, 1) for s in subscriptions if s.active
        )

        goal_count = db.query(Goal).filter(Goal.user_id == u.id).count()
        plan_count = db.query(Plan).filter(Plan.user_id == u.id).count()

        summaries.append(
            UserSummary(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                is_admin=u.is_admin,
                is_active=u.is_active,
                created_at=u.created_at,
                transaction_count=len(transactions),
                total_spend=total_spend,
                total_income=total_income,
                subscription_count=len(subscriptions),
                active_subscription_monthly_cost=monthly_cost,
                goal_count=goal_count,
                plan_count=plan_count,
            )
        )
    return summaries


@router.get("/users/{user_id}", response_model=UserDetail)
def get_user_detail(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Full read-only view into one user's data - transactions, subscriptions, goals, plans."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserDetail(
        user=UserOut.model_validate(user),
        transactions=db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.occurred_on.desc())
        .all(),
        subscriptions=db.query(Subscription)
        .filter(Subscription.user_id == user_id)
        .order_by(Subscription.next_due_date)
        .all(),
        goals=db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.target_date).all(),
        plans=db.query(Plan).filter(Plan.user_id == user_id).order_by(Plan.linked_date).all(),
    )


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Promote/demote admin access or enable/disable an account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id and payload.is_admin is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin access")
    if user.id == admin.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
