from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.services.auth import authenticate_user

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await authenticate_user(repo, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.cognito_sub, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
