import json
import random
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/students", tags=["students"])


def generate_parent_code(db: Session) -> str:
    """Generate a unique 6-character alphanumeric parent code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=6))
        exists = db.query(models.Student).filter(models.Student.parent_code == code).first()
        if not exists:
            return code


@router.get("", response_model=list[schemas.StudentResponse])
def list_students(
    status: Optional[str] = Query(None),
    class_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Student)
    if status:
        query = query.filter(models.Student.status == status)
    if class_level:
        query = query.filter(models.Student.class_level == class_level)
    if search:
        query = query.filter(models.Student.name.ilike(f"%{search}%"))
    students = query.order_by(models.Student.name).all()
    for student in students:
        user = db.query(models.User).filter(models.User.student_id == student.id, models.User.role == "parent").first()
        setattr(student, "parent_username", user.username if user else None)
    return students


@router.post("", response_model=schemas.StudentResponse, status_code=201)
def create_student(
    body: schemas.StudentCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    # Check if parent_username is unique
    if db.query(models.User).filter(models.User.username == body.parent_username).first():
        raise HTTPException(status_code=400, detail="Parent username already exists")

    parent_code = generate_parent_code(db)
    student = models.Student(
        name=body.name,
        class_level=body.class_level,
        subjects=json.dumps(body.subjects),
        guardian_name=body.guardian_name,
        guardian_phone=body.guardian_phone,
        address=body.address,
        enrollment_date=body.enrollment_date,
        parent_code=parent_code,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Create the user for the parent
    from auth import hash_password
    parent_user = models.User(
        role="parent",
        username=body.parent_username,
        password_hash=hash_password(body.parent_password),
        student_id=student.id,
        is_active=True,
    )
    db.add(parent_user)
    db.commit()
    
    setattr(student, "parent_username", parent_user.username)
    return student


@router.get("/{student_id}", response_model=schemas.StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(models.User).filter(models.User.student_id == student.id, models.User.role == "parent").first()
    setattr(student, "parent_username", user.username if user else None)
    return student


@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    body: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = body.model_dump(exclude_unset=True)
    if "subjects" in update_data:
        update_data["subjects"] = json.dumps(update_data["subjects"])

    parent_username = update_data.pop("parent_username", None)
    parent_password = update_data.pop("parent_password", None)

    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)

    # Update or create the parent user
    from auth import hash_password
    parent_user = db.query(models.User).filter(models.User.student_id == student.id, models.User.role == "parent").first()
    
    if parent_username or parent_password:
        if parent_username:
            existing = db.query(models.User).filter(models.User.username == parent_username).first()
            if existing and (not parent_user or existing.id != parent_user.id):
                raise HTTPException(status_code=400, detail="Parent username already exists")
                
        if parent_user:
            if parent_username:
                parent_user.username = parent_username
            if parent_password:
                parent_user.password_hash = hash_password(parent_password)
            db.commit()
        else:
            if not parent_username or not parent_password:
                raise HTTPException(status_code=400, detail="Must provide both parent_username and parent_password to create a new parent user")
            parent_user = models.User(
                role="parent",
                username=parent_username,
                password_hash=hash_password(parent_password),
                student_id=student.id,
                is_active=True,
            )
            db.add(parent_user)
            db.commit()

    setattr(student, "parent_username", parent_user.username if parent_user else None)
    return student


@router.patch("/{student_id}/status", response_model=schemas.StudentResponse)
def update_student_status(
    student_id: int,
    body: schemas.StudentStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.status = body.status
    db.commit()
    db.refresh(student)
    return student
