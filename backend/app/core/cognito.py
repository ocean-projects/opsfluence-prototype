import json
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.request import urlopen

from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings


@dataclass
class _JWKSCache:
    jwks: Optional[Dict[str, Any]] = None
    fetched_at: float = 0.0
    ttl_seconds: int = 60 * 60  # 1 hour


_jwks_cache = _JWKSCache()


def _jwks_url() -> str:
    return (
        f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
        f"{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )


def _issuer() -> str:
    return (
        f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
        f"{settings.COGNITO_USER_POOL_ID}"
    )


def get_jwks() -> Dict[str, Any]:
    now = time.time()
    if _jwks_cache.jwks and (now - _jwks_cache.fetched_at) < _jwks_cache.ttl_seconds:
        return _jwks_cache.jwks

    with urlopen(_jwks_url()) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    _jwks_cache.jwks = data
    _jwks_cache.fetched_at = now
    return data


def verify_cognito_access_token(token: str) -> Dict[str, Any]:
    """Verify a Cognito **access token** using the user pool JWKS.

    Returns decoded claims if valid; raises ValueError otherwise.

    Notes:
    - Cognito access tokens typically include `client_id` (not always `aud`).
    - We verify issuer + signature and then check `client_id`.
    """

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise ValueError("Token missing kid")

        jwks = get_jwks()
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            # Refresh once in case of rotation
            _jwks_cache.jwks = None
            jwks = get_jwks()
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key:
                raise ValueError("No matching JWKS key")

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=_issuer(),
            options={"verify_aud": False},
        )

        client_id = claims.get("client_id")
        if client_id != settings.COGNITO_APP_CLIENT_ID:
            raise ValueError("Invalid client_id")

        token_use = claims.get("token_use")
        if token_use and token_use != "access":
            raise ValueError("Expected access token")

        return claims

    except JWTError as e:
        raise ValueError("Invalid token") from e
