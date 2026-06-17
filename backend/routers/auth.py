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
def parent_login(body: schemas.ParentLoginRequest, db: Session = Depends(get_db)):
    # First, try to authenticate via the User table if they have already logged in before and possibly changed their password
    user = db.query(models.User).filter(
        models.User.username == body.username,
        models.User.role == "parent",
    ).first()

    student = None
    if user:
        if not verify_password(body.parent_code, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        student = db.query(models.Student).filter(models.Student.id == user.student_id).first()
        if not student or student.status != "active":
            raise HTTPException(status_code=401, detail="Student account is not active")
    else:
        # Fallback to authenticating via Student's parent_code for first-time login
        # We need to find the student and the parent user that matches
        # If the parent hasn't logged in, they might not have a user account, but wait, we just updated `create_student` to create the user account!
        # Wait, if `create_student` now creates the user account immediately, then `user` will ALWAYS exist!
        # The fallback is only for backwards compatibility with existing students whose parent user hasn't been created yet.
        # But wait, existing students might not have `parent_username` set!
        # For existing students without `parent_username`, their username was their `phone`.
        # Let's keep the fallback but use `body.username` as `guardian_phone` just in case, but actually if they use username it won't be phone.
        # For full backwards compatibility, let's look up Student by `parent_username` (if we add it) or just `guardian_phone`.
        student = db.query(models.Student).filter(
            (models.Student.guardian_phone == body.username) | (models.Student.parent_code == body.username), # allow either for fallback
            models.Student.parent_code == body.parent_code,
            models.Student.status == "active",
        ).first()

        if not student:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # Create parent user since this is their first time logging in
        user = models.User(
            role="parent",
            username=body.username,
            password_hash=hash_password(body.parent_code),
            student_id=student.id,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

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
