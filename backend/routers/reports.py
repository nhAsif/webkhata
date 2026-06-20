import io
import math
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _compute_student_financial(student: models.Student, db: Session) -> schemas.StudentFinancial:
    """Helper: compute the financial summary for a single student."""
    today = date.today()

    # Completed 30-day billing cycles since the student's start_date
    if student.start_date and student.start_date <= today:
        completed_cycles = math.floor((today - student.start_date).days / 30)
    else:
        completed_cycles = 0

    total_due = completed_cycles * student.monthly_fee

    paid_cycles = (
        db.query(models.StudentFeeCycle)
        .filter(models.StudentFeeCycle.student_id == student.id, models.StudentFeeCycle.is_paid == True)
        .all()
    )
    total_paid = sum(c.fee_amount for c in paid_cycles)

    # Outstanding balance is never negative
    outstanding_balance = max(0.0, total_due - total_paid)

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


# ─── Monthly Collection Report ────────────────────────────────────────────────

@router.get("/monthly-collection")
def monthly_collection_report(
    month: Optional[str] = Query(None, description="Filter month YYYY-MM (for paid-this-month calculation)"),
    search: Optional[str] = Query(None, description="Search by student name"),
    export: Optional[str] = Query(None, description="Set to 'csv' to download as CSV"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    """
    Returns per-student financial data (using the 30-day cycle formula).
    Pass export=csv to receive a downloadable CSV file.
    The optional `month` param (YYYY-MM) narrows `total_paid_this_month`
    to only payments made within that calendar month.
    """
    query = db.query(models.Student)
    if search:
        query = query.filter(models.Student.name.ilike(f"%{search}%"))
    students = query.order_by(models.Student.name).all()

    today = date.today()
    rows: list[schemas.MonthlyCollectionRow] = []

    for student in students:
        # Completed 30-day billing cycles
        if student.start_date and student.start_date <= today:
            completed_cycles = math.floor((today - student.start_date).days / 30)
        else:
            completed_cycles = 0

        total_due = completed_cycles * student.monthly_fee

        # Total paid overall (for outstanding_balance)
        paid_cycles = (
            db.query(models.StudentFeeCycle)
            .filter(models.StudentFeeCycle.student_id == student.id, models.StudentFeeCycle.is_paid == True)
            .all()
        )
        total_paid_all = sum(c.fee_amount for c in paid_cycles)
        outstanding_balance = max(0.0, total_due - total_paid_all)

        # Paid within the requested calendar month (for the report column)
        if month:
            try:
                year_str, mon_str = month.split("-")
                month_cycles = [
                    c for c in paid_cycles
                    if c.payment_date and c.payment_date.year == int(year_str)
                    and c.payment_date.month == int(mon_str)
                ]
            except (ValueError, AttributeError):
                month_cycles = paid_cycles
        else:
            month_cycles = paid_cycles

        total_paid_this_month = sum(c.fee_amount for c in month_cycles)

        # Status label
        if outstanding_balance == 0.0:
            pay_status = "paid"
        elif total_paid_all > 0:
            pay_status = "partial"
        else:
            pay_status = "overdue"

        rows.append(schemas.MonthlyCollectionRow(
            student_id=student.id,
            student_name=student.name,
            class_level=student.class_level,
            monthly_fee=student.monthly_fee,
            total_due=total_due,
            total_paid=total_paid_all,
            total_paid_this_month=total_paid_this_month,
            outstanding_balance=outstanding_balance,
            status=pay_status,
        ))

    # ── CSV export ──────────────────────────────────────────────────────────
    if export and export.lower() == "csv":
        buf = io.StringIO()
        buf.write("Student ID,Student Name,Class,Monthly Fee,Paid This Month,Outstanding Balance,Status\n")
        for row in rows:
            buf.write(
                f"{row.student_id},"
                f'"{row.student_name}",'
                f"{row.class_level},"
                f"{row.monthly_fee:.2f},"
                f"{row.total_paid_this_month:.2f},"
                f"{row.outstanding_balance:.2f},"
                f"{row.status}\n"
            )
        buf.seek(0)
        filename = f"monthly_collection_{month or today.strftime('%Y-%m')}.csv"
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # ── JSON response ───────────────────────────────────────────────────────
    return rows
