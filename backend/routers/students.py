import json
import math
import random
import string
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas
from datetime import timedelta

router = APIRouter(prefix="/api/students", tags=["students"])


def generate_parent_code(db: Session) -> str:
    """Generate a unique 6-character alphanumeric parent code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=6))
        exists = db.query(models.Student).filter(models.Student.parent_code == code).first()
        if not exists:
            return code


def backfill_student_attendance(db: Session, student: models.Student, old_start_date: Optional[date] = None):
    """Automatically generates daily 'present' attendance from start_date to today."""
    today = date.today()
    if student.start_date and student.start_date > today:
        return

    # If start date moved later, delete auto-generated records before new start date
    if old_start_date and student.start_date and old_start_date < student.start_date:
        # We only delete "present" records (assumed auto-generated/default)
        db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.date >= old_start_date,
            models.Attendance.date < student.start_date,
            models.Attendance.status == 'present'
        ).delete()
        db.commit()

    if not student.start_date:
        return

    # Generate missing attendance
    start = student.start_date
    end = today
    
    existing = db.query(models.Attendance.date).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.date >= start,
        models.Attendance.date <= end
    ).all()
    existing_dates = {e[0] for e in existing}

    current = start
    while current <= end:
        if current not in existing_dates:
            att = models.Attendance(
                student_id=student.id,
                date=current,
                status="present"
            )
            db.add(att)
        current += timedelta(days=1)
    db.commit()


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
        monthly_fee=body.monthly_fee,
        start_date=body.start_date or date.today(),
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
    
    # Backfill attendance
    backfill_student_attendance(db, student)
    
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

    old_start_date = student.start_date

    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)

    # Backfill attendance if start date changed
    if "start_date" in update_data:
        backfill_student_attendance(db, student, old_start_date)

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


@router.get("/{student_id}/financial", response_model=schemas.StudentFinancial)
def get_student_financial(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Return the computed financial summary for a single student."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today = date.today()

    # Compute completed 30-day billing cycles since start_date.
    # A cycle completes every 30 days from start_date.
    if student.start_date and student.start_date <= today:
        completed_cycles = math.floor((today - student.start_date).days / 30)
    else:
        completed_cycles = 0

    total_due = completed_cycles * student.monthly_fee

    # Sum paid fee cycle records for this student
    paid_cycles = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.student_id == student_id,
        models.StudentFeeCycle.is_paid == True,
    ).all()
    total_paid = sum(c.fee_amount for c in paid_cycles)

    # Outstanding balance is never negative
    outstanding_balance = max(0.0, total_due - total_paid)

    # Determine payment status label
    if outstanding_balance == 0.0:
        pay_status = "paid"
    elif total_paid > 0:
        pay_status = "partial"
    else:
        pay_status = "overdue"

    return schemas.StudentFinancial(
        student_id=student.id,
        student_name=student.name,
        monthly_fee=student.monthly_fee,
        start_date=student.start_date,
        completed_cycles=completed_cycles,
        total_due=total_due,
        total_paid=total_paid,
        outstanding_balance=outstanding_balance,
        status=pay_status,
    )


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Delete related records that have RESTRICT
    db.query(models.Payment).filter(models.Payment.student_id == student_id).delete()
    db.query(models.Fee).filter(models.Fee.student_id == student_id).delete()
    db.query(models.Result).filter(models.Result.student_id == student_id).delete()
    
    # Also delete the parent user since the student is gone
    db.query(models.User).filter(models.User.student_id == student_id).delete()
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted permanently"}
