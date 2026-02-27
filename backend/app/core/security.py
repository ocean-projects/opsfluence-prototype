"""Security helpers.

Opsfluence uses AWS Cognito for authentication.
This module intentionally does NOT issue JWTs.

If you later decide to support a local-dev password fallback, you can
reintroduce password hashing here — but keep Cognito as the primary auth.
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
