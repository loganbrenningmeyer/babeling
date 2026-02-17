import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException


CLERK_ISSUER = os.environ["CLERK_ISSUER"]
CLERK_JWKS_URL = os.environ["CLERK_JWKS_URL"]
CLERK_AUDIENCE = os.environ.get("CLERK_AUDIENCE")

_jwk_client = PyJWKClient(CLERK_JWKS_URL)


def get_current_clerk_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    
    token = authorization.split(" ", 1)[1].strip()

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token).key
        decoded = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            audience=CLERK_AUDIENCE if CLERK_AUDIENCE else None,
            options={"require": ["exp", "iat", "iss", "sub"]},
            leeway=60,
        )
    
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return decoded["sub"]