from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/fees", tags=["fees"])


@router.get("", response_model=list[schemas.FeeResponse])
def list_fees(
    month: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Fee)
    if month:
        query = query.filter(models.Fee.month == month)
    if status:
        query = query.filter(models.Fee.status == status)
    if student_id:
        query = query.filter(models.Fee.student_id == student_id)

    fees = query.all()
    result = []
    for fee in fees:
        student = db.query(models.Student).filter(models.Student.id == fee.student_id).first()
        fee_data = schemas.FeeResponse.model_validate(fee)
        fee_data.student_name = student.name if student else None
        result.append(fee_data)
    return result


@router.post("/generate", status_code=201)
def generate_fees(
    body: schemas.FeeGenerate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    students = db.query(models.Student).filter(models.Student.status == "active").all()
    created = 0
    skipped = 0

    for student in students:
        existing = db.query(models.Fee).filter(
            models.Fee.student_id == student.id,
            models.Fee.month == body.month,
        ).first()

        if existing:
            skipped += 1
            continue

        fee = models.Fee(
            student_id=student.id,
            month=body.month,
            amount_due=body.amount_due,
            amount_paid=0,
            status="unpaid",
        )
        db.add(fee)
        created += 1

    db.commit()
    return {
        "message": f"Generated fees for {created} students",
        "created": created,
        "skipped": skipped,
    }


@router.put("/{fee_id}", response_model=schemas.FeeResponse)
def record_payment(
    fee_id: int,
    body: schemas.FeePayment,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    fee = db.query(models.Fee).filter(models.Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")

    fee.amount_paid = body.amount_paid
    fee.payment_method = body.payment_method
    fee.payment_date = body.payment_date or date.today()
    if body.notes:
        fee.notes = body.notes

    # Auto-determine status
    if body.amount_paid <= 0:
        fee.status = "unpaid"
    elif body.amount_paid >= fee.amount_due:
        fee.status = "paid"
    else:
        fee.status = "partial"

    db.commit()
    db.refresh(fee)

    student = db.query(models.Student).filter(models.Student.id == fee.student_id).first()
    fee_data = schemas.FeeResponse.model_validate(fee)
    fee_data.student_name = student.name if student else None
    return fee_data


@router.get("/student/{student_id}", response_model=list[schemas.FeeResponse])
def get_student_fees(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    fees = db.query(models.Fee).filter(
        models.Fee.student_id == student_id
    ).order_by(models.Fee.month.desc()).all()

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    result = []
    for fee in fees:
        fee_data = schemas.FeeResponse.model_validate(fee)
        fee_data.student_name = student.name if student else None
        result.append(fee_data)
    return result


@router.get("/summary/monthly")
def fee_summary(
    month: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    fees = db.query(models.Fee).filter(models.Fee.month == month).all()

    total_due = sum(f.amount_due for f in fees)
    total_collected = sum(f.amount_paid for f in fees)
    paid_count = sum(1 for f in fees if f.status == "paid")
    partial_count = sum(1 for f in fees if f.status == "partial")
    unpaid_count = sum(1 for f in fees if f.status == "unpaid")

    return {
        "month": month,
        "total_students": len(fees),
        "total_due": total_due,
        "total_collected": total_collected,
        "outstanding": total_due - total_collected,
        "paid_count": paid_count,
        "partial_count": partial_count,
        "unpaid_count": unpaid_count,
    }
