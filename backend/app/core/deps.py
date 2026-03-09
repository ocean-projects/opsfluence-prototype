from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.cognito import verify_cognito_access_token
from app.db.session import get_db
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token",
        )

    token = creds.credentials

    try:
        claims = verify_cognito_access_token(token)
    except Exception as e:
        print("COGNITO TOKEN VERIFY FAILED:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    cognito_sub = claims.get("sub")
    email = claims.get("email")

    if not cognito_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub claim",
        )

    fallback_email = f"{cognito_sub}@unknown"

    user = db.query(User).filter(User.cognito_sub == cognito_sub).first()

    if user:
        desired_email = email or user.email or fallback_email

        if desired_email != user.email:
            conflict = (
                db.query(User)
                .filter(User.email == desired_email, User.id != user.id)
                .first()
            )
            if not conflict:
                user.email = desired_email

        db.commit()
        db.refresh(user)
        return user

    desired_email = email or fallback_email

    conflict = db.query(User).filter(User.email == desired_email).first()
    if conflict:
        desired_email = f"{cognito_sub}-{fallback_email}"

    user = User(
        id=cognito_sub,
        cognito_sub=cognito_sub,
        email=desired_email,
        role="OPERATOR",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return user


def require_operator(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"ADMIN", "OPERATOR"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator role required",
        )
    return user


def require_roles(allowed: set[str]):
    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep