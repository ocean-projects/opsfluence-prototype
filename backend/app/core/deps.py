from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token",
        )

    token = credentials.credentials

    try:
        payload = jwt.get_unverified_claims(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    cognito_sub = payload.get("sub")
    email = payload.get("email")
    role = payload.get("custom:role") or payload.get("role") or "OPERATOR"

    if not cognito_sub:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.cognito_sub == cognito_sub).first()

    if not user:
        fallback_email = email or f"{cognito_sub}@unknown.local"
        user = User(
            cognito_sub=cognito_sub,
            email=fallback_email,
            role=role,
            first_name=payload.get("given_name"),
            last_name=payload.get("family_name"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is disabled")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user