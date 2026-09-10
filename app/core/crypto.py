import os
import warnings

from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

_INSECURE_DEFAULT = "change-me-to-a-random-fernet-key"
_KEY = os.getenv("GOOGLE_TOKEN_ENCRYPTION_KEY", _INSECURE_DEFAULT)

if _KEY == _INSECURE_DEFAULT:
    warnings.warn(
        "GOOGLE_TOKEN_ENCRYPTION_KEY is not set - Google refresh tokens can't be "
        'stored until it is. Generate one with: python -c "from cryptography.fernet '
        'import Fernet; print(Fernet.generate_key().decode())"',
        stacklevel=1,
    )
    _fernet = None
else:
    _fernet = Fernet(_KEY.encode("utf-8"))


def encrypt_token(plaintext: str) -> str:
    if _fernet is None:
        raise RuntimeError("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured")
    return _fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_token(ciphertext: str) -> str:
    if _fernet is None:
        raise RuntimeError("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured")
    try:
        return _fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as e:
        raise ValueError("Stored token could not be decrypted - key may have changed") from e
