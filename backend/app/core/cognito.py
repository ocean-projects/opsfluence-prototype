import json
import time
from typing import Any, Dict, Optional
from urllib.request import urlopen
from urllib.error import URLError

from jose import jwt
from jwt.algorithms import RSAAlgorithm

from app.core.config import settings


class _JWKSCache:
    jwks: Optional[Dict[str, Any]] = None
    fetched_at: float = 0.0
    ttl_seconds: int = 3600


_jwks_cache = _JWKSCache()


def _jwks_url() -> str:
    return (
        f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
        f"{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )


def get_jwks() -> Dict[str, Any]:
    now = time.time()
    if _jwks_cache.jwks and (now - _jwks_cache.fetched_at) < _jwks_cache.ttl_seconds:
        return _jwks_cache.jwks

    # IMPORTANT: timeout prevents hanging requests
    try:
        with urlopen(_jwks_url(), timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except URLError as e:
        raise ValueError(f"Failed to fetch JWKS: {e}") from e
    except Exception as e:
        raise ValueError(f"Failed to fetch JWKS: {e}") from e

    _jwks_cache.jwks = data
    _jwks_cache.fetched_at = now
    return data


def verify_cognito_access_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Cognito ACCESS token.
    Access tokens use `client_id` (not `aud`).
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise ValueError("Missing kid")

        jwks = get_jwks()
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        if not key:
            # refresh cache once
            _jwks_cache.jwks = None
            jwks = get_jwks()
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key:
                raise ValueError("Public key not found in JWKS")

        public_key = RSAAlgorithm.from_jwk(json.dumps(key))
        issuer = (
            f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/"
            f"{settings.COGNITO_USER_POOL_ID}"
        )

        claims = jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )

        if claims.get("token_use") != "access":
            raise ValueError(f"Wrong token_use: {claims.get('token_use')}")

        if claims.get("client_id") != settings.COGNITO_APP_CLIENT_ID:
            raise ValueError("client_id mismatch")

        return claims

    except Exception as e:
        raise ValueError("Invalid token") from e