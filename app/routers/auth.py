from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.core.email import send_password_reset_email
from app.core.security import (
    create_access_token,
    generate_reset_code,
    hash_password,
    hash_reset_code,
    verify_password,
    verify_reset_code,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_CODE_EXPIRE_MINUTES = 15


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # The very first account ever created becomes admin automatically - there's
    # no separate bootstrap step. Every account after that is a regular user.
    is_first_user = db.query(User).count() == 0

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_admin=is_first_user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm's field is named "username" by spec; we treat it as email.
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always the same response whether or not the email is registered -
    # otherwise this endpoint becomes a way to enumerate every account.
    generic_response = MessageResponse(
        detail="If that email is registered, a passcode has been sent to it."
    )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.is_active:
        return generic_response

    code = generate_reset_code()
    user.reset_code_hash = hash_reset_code(code)
    user.reset_code_expires_at = datetime.utcnow() + timedelta(minutes=RESET_CODE_EXPIRE_MINUTES)
    db.commit()

    send_password_reset_email(user.email, code, RESET_CODE_EXPIRE_MINUTES)
    return generic_response


@router.post("/reset-password", response_model=Token)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired passcode"
    )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.reset_code_hash or not user.reset_code_expires_at:
        raise invalid
    if datetime.utcnow() > user.reset_code_expires_at:
        raise invalid
    if not verify_reset_code(payload.code, user.reset_code_hash):
        raise invalid

    user.hashed_password = hash_password(payload.new_password)
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    db.commit()
    db.refresh(user)

    # Sign them straight in - no reason to make them log in again right
    # after proving ownership of the account via the emailed code.
    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))
