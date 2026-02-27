from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.cognito import verify_cognito_access_token
from app.db.session import get_db
from app.models.user import User

_security = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_security),
    db: Session = Depends(get_db),
) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = creds.credentials
    try:
        claims = verify_cognito_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    cognito_sub = claims.get("sub")
    email = claims.get("email") or claims.get("username")

    if not cognito_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub",
        )

    # Just-in-time provisioning
    user = db.query(User).filter(User.cognito_sub == cognito_sub).first()
    if not user:
        user = User(
            cognito_sub=cognito_sub,
            email=email or f"{cognito_sub}@unknown",
            role="auditor",
            password_hash=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin required",
        )
    return user


def require_operator(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "operator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator required",
        )
    return user
