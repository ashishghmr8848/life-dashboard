import os
import warnings
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

_INSECURE_DEFAULT = "insecure-dev-secret-change-me"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", _INSECURE_DEFAULT)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

if JWT_SECRET_KEY == _INSECURE_DEFAULT:
    warnings.warn(
        "JWT_SECRET_KEY is not set - using an insecure default. Set it in .env "
        '(generate one with: python -c "import secrets; print(secrets.token_urlsafe(48))").',
        stacklevel=1,
    )


def hash_password(password: str) -> str:
    # bcrypt only reads the first 72 bytes of the input; truncate explicitly
    # rather than let a longer password silently collide with its prefix.
    truncated = password.encode("utf-8")[:72]
    return bcrypt.hashpw(truncated, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    truncated = password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(truncated, hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """Returns the subject (user id) encoded in the token. Raises jwt.PyJWTError
    (ExpiredSignatureError, InvalidTokenError, ...) on anything invalid."""
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    return payload["sub"]
