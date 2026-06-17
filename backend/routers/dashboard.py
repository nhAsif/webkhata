from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    today = date.today()
    current_month = today.strftime("%Y-%m")

    total_active_students = db.query(models.Student).filter(
        models.Student.status == "active"
    ).count()

    todays_sessions = db.query(models.Session).filter(
        models.Session.date == today
    ).count()

    unpaid_fees_count = db.query(models.Fee).filter(
        models.Fee.status.in_(["unpaid", "partial"]),
        models.Fee.month == current_month,
    ).count()

    monthly_fees = db.query(models.Fee).filter(
        models.Fee.month == current_month
    ).all()
    monthly_collection = sum(f.amount_paid for f in monthly_fees)

    # Overall attendance rate for current month
    year, mon = current_month.split("-")
    sessions_this_month = db.query(models.Session).filter(
        func.strftime("%Y", models.Session.date) == year,
        func.strftime("%m", models.Session.date) == mon,
    ).all()
    session_ids = [s.id for s in sessions_this_month]

    if session_ids:
        total_records = db.query(models.Attendance).filter(
            models.Attendance.session_id.in_(session_ids)
        ).count()
        present_records = db.query(models.Attendance).filter(
            models.Attendance.session_id.in_(session_ids),
            models.Attendance.status.in_(["present", "late"]),
        ).count()
        attendance_rate = round((present_records / total_records * 100), 1) if total_records else 0.0
    else:
        attendance_rate = 0.0

    return schemas.DashboardStats(
        total_active_students=total_active_students,
        todays_sessions=todays_sessions,
        unpaid_fees_count=unpaid_fees_count,
        monthly_collection=monthly_collection,
        attendance_rate=attendance_rate,
    )


@router.get("/alerts", response_model=list[schemas.DashboardAlert])
def get_alerts(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    alerts = []
    today = date.today()
    current_month = today.strftime("%Y-%m")
    year, mon = current_month.split("-")

    # Low attendance students (< 60% this month)
    sessions_this_month = db.query(models.Session).filter(
        func.strftime("%Y", models.Session.date) == year,
        func.strftime("%m", models.Session.date) == mon,
    ).all()
    session_ids = [s.id for s in sessions_this_month]

    if session_ids:
        students = db.query(models.Student).filter(models.Student.status == "active").all()
        for student in students:
            records = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.session_id.in_(session_ids),
            ).all()
            if records:
                present = sum(1 for r in records if r.status in ("present", "late"))
                rate = present / len(session_ids) * 100
                if rate < 60:
                    alerts.append(schemas.DashboardAlert(
                        type="low_attendance",
                        message=f"{student.name} has {rate:.0f}% attendance this month",
                        student_id=student.id,
                        student_name=student.name,
                    ))

    # Overdue fees
    overdue_fees = db.query(models.Fee).filter(
        models.Fee.status.in_(["unpaid", "partial"]),
        models.Fee.month < current_month,
    ).all()
    for fee in overdue_fees:
        student = db.query(models.Student).filter(models.Student.id == fee.student_id).first()
        if student:
            alerts.append(schemas.DashboardAlert(
                type="overdue_fee",
                message=f"{student.name} has unpaid fee for {fee.month}",
                student_id=student.id,
                student_name=student.name,
            ))

    # Upcoming homework due within 3 days
    from datetime import timedelta
    upcoming_due = db.query(models.Homework).filter(
        models.Homework.due_date >= today,
        models.Homework.due_date <= today + timedelta(days=3),
    ).all()
    for hw in upcoming_due:
        days_left = (hw.due_date - today).days
        alerts.append(schemas.DashboardAlert(
            type="homework_due",
            message=f'Homework "{hw.title}" is due in {days_left} day(s)',
        ))

    return alerts
