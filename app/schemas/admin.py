import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.goal import GoalOut
from app.schemas.plan import PlanOut
from app.schemas.subscription import SubscriptionOut
from app.schemas.transaction import TransactionOut
from app.schemas.user import UserOut


class UserSummary(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_at: datetime

    transaction_count: int
    total_spend: float
    total_income: float
    subscription_count: int
    active_subscription_monthly_cost: float
    goal_count: int
    plan_count: int


class UserDetail(BaseModel):
    user: UserOut
    transactions: List[TransactionOut]
    subscriptions: List[SubscriptionOut]
    goals: List[GoalOut]
    plans: List[PlanOut]


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
