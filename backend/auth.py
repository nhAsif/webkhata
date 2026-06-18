from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import secrets
from sqlalchemy.orm import Session

from config import settings
from database import get_db
import models

bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${hashed.hex()}"


def verify_password(plain: str, hashed_str: str) -> bool:
    try:
        salt, stored_hash = hashed_str.split('$')
        new_hash = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(new_hash.hex(), stored_hash)
    except ValueError:
        return False


def create_access_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_token(credentials.credentials)
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_tutor(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access required")
    return current_user


def require_parent(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")
    return current_user


def init_default_tutor(db: Session):
    """Create default admin tutor account if no tutor exists."""
    existing = db.query(models.User).filter(models.User.role == "tutor").first()
    if not existing:
        admin = models.User(
            role="tutor",
            username=settings.DEFAULT_TUTOR_USERNAME,
            password_hash=hash_password(settings.DEFAULT_TUTOR_PASSWORD),
            is_active=True,
        )
        db.add(admin)
        db.commit()
