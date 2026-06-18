from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import (
    verify_password, create_access_token, hash_password,
    require_tutor, get_current_user, init_default_tutor,
)
from config import settings
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def tutor_login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == body.username,
        models.User.role == "tutor",
    ).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token(
        data={"user_id": user.id, "role": "tutor"},
        expires_delta=timedelta(hours=settings.TUTOR_TOKEN_EXPIRE_HOURS),
    )

    from sqlalchemy.sql import func
    user.last_login = func.now()
    db.commit()

    return schemas.TokenResponse(access_token=token, role="tutor")


@router.post("/parent-login", response_model=schemas.TokenResponse)
def parent_login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == body.username,
        models.User.role == "parent",
    ).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    student = db.query(models.Student).filter(models.Student.id == user.student_id).first()
    if not student or student.status != "active":
        raise HTTPException(status_code=401, detail="Student account is not active")

    token = create_access_token(
        data={"user_id": user.id, "role": "parent", "student_id": student.id},
        expires_delta=timedelta(hours=settings.PARENT_TOKEN_EXPIRE_HOURS),
    )

    from sqlalchemy.sql import func
    user.last_login = func.now()
    db.commit()

    return schemas.TokenResponse(access_token=token, role="parent", student_id=student.id)


@router.post("/change-password")
def change_password(
    body: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
