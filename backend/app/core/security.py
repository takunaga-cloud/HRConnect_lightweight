import os
from datetime import datetime, timedelta
from typing import Any, Optional, Union

import bcrypt

import jwt
import requests
from fastapi import Depends, HTTPException, status
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

from app.core.config import settings

# 環境変数からCognitoの設定を取得
COGNITO_USER_POOL_ID = settings.COGNITO_USER_POOL_ID
COGNITO_REGION = settings.COGNITO_REGION

JWKS_URL = ""
if COGNITO_USER_POOL_ID:
    JWKS_URL = (
        f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
        f"{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )
elif not settings.SUPABASE_JWT_SECRET:
    raise ValueError("COGNITO_USER_POOL_ID または SUPABASE_JWT_SECRET 環境変数を設定してください。")


def verify_token(token: str) -> dict:
    """
    CognitoのJWTトークンを検証し、ペイロードを返します。
    """
    try:
        jwks_client = PyJWKClient(JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token).key

        # トークンの検証
        decoded_token = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID, # Cognito Client IDを設定
            issuer=(
                f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
                f"{COGNITO_USER_POOL_ID}"
            ),
        )
        return decoded_token
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch JWKS: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during token verification: {e}",
        )



def _log_debug(msg: str):
    try:
        with open("debug_auth.log", "a") as f:
             f.write(msg + "\n")
    except Exception:
        pass


def verify_local_token(token: str) -> Optional[dict]:
    """
    ローカルのSECRET_KEYで署名されたトークンを検証します。
    """
    try:
        _log_debug(f"DEBUG: Verifying local token: {token[:10]}...")
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        _log_debug("DEBUG: Local token verification successful")
        return decoded_token
    except InvalidTokenError as e:
        _log_debug(f"DEBUG: Local token verification failed (InvalidTokenError): {e}")
        return None
    except Exception as e:
        _log_debug(f"DEBUG: Local token verification failed (Exception): {e}")
        return None


# pwd_context removed in favor of direct bcrypt use
ALGORITHM = "HS256"


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
