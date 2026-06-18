from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/payments", tags=["payments"])


# ─── List / filter payments ───────────────────────────────────────────────────

@router.get("", response_model=list[schemas.PaymentResponse])
def list_payments(
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Return all payments, optionally filtered by student_id."""
    query = db.query(models.Payment)
    if student_id is not None:
        query = query.filter(models.Payment.student_id == student_id)
    payments = query.order_by(models.Payment.payment_date.desc()).all()

    # Attach student name for convenience
    results = []
    for p in payments:
        resp = schemas.PaymentResponse.model_validate(p)
        if p.student:
            resp.student_name = p.student.name
        results.append(resp)
    return results


# ─── Payment history for a specific student ───────────────────────────────────

@router.get("/student/{student_id}", response_model=list[schemas.PaymentResponse])
def get_student_payments(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Return all payment records for a given student (chronological)."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    payments = (
        db.query(models.Payment)
        .filter(models.Payment.student_id == student_id)
        .order_by(models.Payment.payment_date.desc())
        .all()
    )

    results = []
    for p in payments:
        resp = schemas.PaymentResponse.model_validate(p)
        resp.student_name = student.name
        results.append(resp)
    return results


# ─── Create payment ───────────────────────────────────────────────────────────

@router.post("", response_model=schemas.PaymentResponse, status_code=201)
def create_payment(
    body: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Record a new tuition payment for a student."""
    student = db.query(models.Student).filter(models.Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    payment = models.Payment(
        student_id=body.student_id,
        amount=body.amount,
        payment_date=body.payment_date or date.today(),
        notes=body.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    resp = schemas.PaymentResponse.model_validate(payment)
    resp.student_name = student.name
    return resp


# ─── Update payment ───────────────────────────────────────────────────────────

@router.put("/{payment_id}", response_model=schemas.PaymentResponse)
def update_payment(
    payment_id: int,
    body: schemas.PaymentUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Update an existing payment record."""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)

    db.commit()
    db.refresh(payment)

    resp = schemas.PaymentResponse.model_validate(payment)
    if payment.student:
        resp.student_name = payment.student.name
    return resp


# ─── Delete payment ───────────────────────────────────────────────────────────

@router.delete("/{payment_id}", status_code=204)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """Delete a payment record."""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.delete(payment)
    db.commit()
