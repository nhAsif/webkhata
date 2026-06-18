import math
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/fees", tags=["fees"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _compute_cycles(start_date: date, today: date):
    """Return a list of (cycle_number, start, end) for all completed cycles."""
    if not start_date or start_date > today:
        return []
    completed = math.floor((today - start_date).days / 30)
    cycles = []
    for i in range(completed):
        c_start = start_date + timedelta(days=i * 30)
        c_end = start_date + timedelta(days=(i + 1) * 30 - 1)
        cycles.append((i + 1, c_start, c_end))
    return cycles


def _ensure_cycles(student: models.Student, db: Session, today: date):
    """Auto-generate missing StudentFeeCycle rows for all completed cycles."""
    if not student.start_date:
        return
    cycles = _compute_cycles(student.start_date, today)
    for cycle_number, c_start, c_end in cycles:
        existing = db.query(models.StudentFeeCycle).filter(
            models.StudentFeeCycle.student_id == student.id,
            models.StudentFeeCycle.cycle_number == cycle_number,
        ).first()
        if not existing:
            db.add(models.StudentFeeCycle(
                student_id=student.id,
                cycle_number=cycle_number,
                cycle_start_date=c_start,
                cycle_end_date=c_end,
                fee_amount=student.monthly_fee,
                is_paid=False,
            ))
    db.commit()


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=schemas.FeeDashboardStats)
def fee_dashboard_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    today = date.today()
    students = db.query(models.Student).filter(models.Student.status == "active").all()

    for student in students:
        _ensure_cycles(student, db, today)

    all_cycles = db.query(models.StudentFeeCycle).join(
        models.Student, models.Student.id == models.StudentFeeCycle.student_id
    ).filter(models.Student.status == "active").all()

    total_completed = len(all_cycles)
    total_paid = sum(1 for c in all_cycles if c.is_paid)
    total_unpaid = total_completed - total_paid
    total_collected = sum(c.fee_amount for c in all_cycles if c.is_paid)
    total_pending = sum(c.fee_amount for c in all_cycles if not c.is_paid)

    # Students with due fees
    students_with_due = set()
    for c in all_cycles:
        if not c.is_paid:
            students_with_due.add(c.student_id)

    return schemas.FeeDashboardStats(
        total_students=len(students),
        students_with_due=len(students_with_due),
        total_completed_cycles=total_completed,
        total_paid_cycles=total_paid,
        total_unpaid_cycles=total_unpaid,
        total_collected=total_collected,
        total_pending=total_pending,
    )


@router.get("/dashboard", response_model=List[schemas.FeeDashboardRow])
def fee_dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Return only students who have one or more unpaid completed cycles."""
    today = date.today()
    students = db.query(models.Student).filter(models.Student.status == "active").all()

    rows = []
    for student in students:
        _ensure_cycles(student, db, today)

        cycles = db.query(models.StudentFeeCycle).filter(
            models.StudentFeeCycle.student_id == student.id
        ).all()

        completed = len(cycles)
        paid = sum(1 for c in cycles if c.is_paid)
        unpaid = completed - paid

        if unpaid > 0:
            rows.append(schemas.FeeDashboardRow(
                student_id=student.id,
                student_name=student.name,
                monthly_fee=student.monthly_fee,
                start_date=student.start_date,
                completed_cycles=completed,
                paid_cycles=paid,
                unpaid_cycles=unpaid,
                amount_due=unpaid * student.monthly_fee,
            ))

    rows.sort(key=lambda r: r.amount_due, reverse=True)
    return rows


# ─── Student Cycles ───────────────────────────────────────────────────────────

@router.get("/student/{student_id}", response_model=List[schemas.FeeCycleResponse])
def get_student_cycles(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today = date.today()
    _ensure_cycles(student, db, today)

    cycles = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.student_id == student_id
    ).order_by(models.StudentFeeCycle.cycle_number).all()

    result = []
    for c in cycles:
        cd = schemas.FeeCycleResponse.model_validate(c)
        cd.student_name = student.name
        result.append(cd)
    return result


# ─── Mark Paid / Unpaid ───────────────────────────────────────────────────────

@router.post("/cycle/{cycle_id}/mark-paid", response_model=schemas.FeeCycleResponse)
def mark_cycle_paid(
    cycle_id: int,
    body: schemas.FeeCycleMarkPaid,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    cycle = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.id == cycle_id
    ).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    if cycle.is_paid:
        raise HTTPException(status_code=400, detail="Cycle is already paid")

    cycle.is_paid = True
    cycle.payment_date = body.payment_date or date.today()
    if body.notes:
        cycle.notes = body.notes

    db.commit()
    db.refresh(cycle)

    student = db.query(models.Student).filter(models.Student.id == cycle.student_id).first()
    result = schemas.FeeCycleResponse.model_validate(cycle)
    result.student_name = student.name if student else None
    return result


@router.post("/cycle/{cycle_id}/mark-unpaid", response_model=schemas.FeeCycleResponse)
def mark_cycle_unpaid(
    cycle_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    cycle = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.id == cycle_id
    ).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    cycle.is_paid = False
    cycle.payment_date = None
    cycle.notes = None

    db.commit()
    db.refresh(cycle)

    student = db.query(models.Student).filter(models.Student.id == cycle.student_id).first()
    result = schemas.FeeCycleResponse.model_validate(cycle)
    result.student_name = student.name if student else None
    return result


# ─── Legacy endpoints (kept for backward compatibility) ───────────────────────

@router.get("", response_model=list[schemas.FeeResponse])
def list_fees(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    fees = db.query(models.Fee).all()
    result = []
    for fee in fees:
        student = db.query(models.Student).filter(models.Student.id == fee.student_id).first()
        fee_data = schemas.FeeResponse.model_validate(fee)
        fee_data.student_name = student.name if student else None
        result.append(fee_data)
    return result
