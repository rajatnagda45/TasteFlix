from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth_service import decode_access_token


security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        return None

    user = db.scalar(select(User).where(User.id == int(payload["sub"])))
    if not user:
        return None
    return user


def get_recommendation_service(request: Request):
    return request.app.state.recommendation_service
