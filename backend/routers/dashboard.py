from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas
from config import settings
from google import genai
import datetime

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

client = None
if settings.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"Error initializing Gemini client in dashboard: {e}")

import random

_cached_quotes = []
_cached_quote_date = None
_is_fetching_quotes = False

FALLBACK_QUOTES = [
    "শিক্ষা হল সবচেয়ে শক্তিশালী অস্ত্র, যা দিয়ে তুমি বিশ্বকে বদলে দিতে পারো। - নেলসন ম্যান্ডেলা",
    "জ্ঞানই শক্তি। - ফ্রান্সিস বেকন",
    "যাঁরা পড়াশোনা করে, তাঁরাই বিশ্ব জয় করে। - এ. পি. জে. আব্দুল কালাম",
    "শিক্ষার শেকড়ের স্বাদ তেতো হলেও এর ফল মিষ্টি। - অ্যারিস্টটল",
    "একটি ভালো বই একশ জন ভালো বন্ধুর সমান। - এ. পি. জে. আব্দুল কালাম"
]

def fetch_quotes_background():
    global _cached_quotes, _cached_quote_date, _is_fetching_quotes
    try:
        if not client:
            _is_fetching_quotes = False
            return
            
        prompt = "Generate 10 short, inspiring, and motivational educational quotes in Bengali (Bangla) by famous people (e.g. APJ Abdul Kalam, Nelson Mandela, Rabindranath Tagore, Einstein) for students. Provide only the quote text and the author, like 'Quote - Author'. Separate each quote with a newline. Do not include quote marks."
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        lines = [line.strip() for line in text.split('\n') if line.strip() and '-' in line]
        
        cleaned = [line.replace('"', '').replace('\"', '') for line in lines]
        if len(cleaned) > 0:
            _cached_quotes = cleaned
            _cached_quote_date = datetime.date.today()
    except Exception as e:
        print(f"Failed to fetch background quotes: {e}")
    finally:
        _is_fetching_quotes = False

@router.get("/quote")
def get_daily_quote(background_tasks: BackgroundTasks):
    global _cached_quotes, _cached_quote_date, _is_fetching_quotes
    today = datetime.date.today()
    
    if _cached_quotes and _cached_quote_date == today:
        return {"quote": random.choice(_cached_quotes)}
        
    if not _is_fetching_quotes:
        _is_fetching_quotes = True
        background_tasks.add_task(fetch_quotes_background)
        
    return {"quote": random.choice(FALLBACK_QUOTES)}


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    import math
    today = date.today()
    current_month = today.strftime("%Y-%m")

    total_students = db.query(models.Student).count()

    total_active_students = db.query(models.Student).filter(
        models.Student.status == "active"
    ).count()

    todays_sessions = db.query(models.Session).filter(
        models.Session.date == today
    ).count()

    unpaid_fees_count = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.is_paid == False
    ).count()

    monthly_collection = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.is_paid == True
    ).with_entities(func.coalesce(func.sum(models.StudentFeeCycle.fee_amount), 0.0)).scalar() or 0.0

    # Overall attendance rate for current month
    year_str, mon_str = current_month.split("-")
    
    total_records = db.query(models.Attendance).filter(
        func.strftime("%Y", models.Attendance.date) == year_str,
        func.strftime("%m", models.Attendance.date) == mon_str,
    ).count()
    
    if total_records > 0:
        present_records = db.query(models.Attendance).filter(
            func.strftime("%Y", models.Attendance.date) == year_str,
            func.strftime("%m", models.Attendance.date) == mon_str,
            models.Attendance.status.in_(["present", "late"]),
        ).count()
        attendance_rate = round((present_records / total_records * 100), 1)
    else:
        attendance_rate = 0.0

    # ── Payment-ledger financial aggregates ───────────────────────────────────
    # total_monthly_expected = sum of monthly_fee for all active students
    active_students = db.query(models.Student).filter(
        models.Student.status == "active"
    ).all()
    total_monthly_expected = sum(s.monthly_fee for s in active_students)

    # total_due = sum of (completed_cycles * monthly_fee) across ALL students
    all_students = db.query(models.Student).all()
    total_due = 0.0
    for student in all_students:
        if student.start_date and student.start_date <= today:
            cycles = math.floor((today - student.start_date).days / 30)
        else:
            cycles = 0
        total_due += cycles * student.monthly_fee

    # total_paid = sum of all paid cycles
    total_paid = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.is_paid == True
    ).with_entities(func.coalesce(func.sum(models.StudentFeeCycle.fee_amount), 0.0)).scalar() or 0.0

    outstanding_balance = max(0.0, total_due - total_paid)

    return schemas.DashboardStats(
        total_students=total_students,
        total_active_students=total_active_students,
        todays_sessions=todays_sessions,
        unpaid_fees_count=unpaid_fees_count,
        monthly_collection=monthly_collection,
        attendance_rate=attendance_rate,
        total_monthly_expected=total_monthly_expected,
        total_due=total_due,
        total_paid=total_paid,
        outstanding_balance=outstanding_balance,
    )


@router.get("/alerts", response_model=list[schemas.DashboardAlert])
def get_alerts(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    alerts = []
    today = date.today()
    current_month = today.strftime("%Y-%m")
    year_str, mon_str = current_month.split("-")

    # Low attendance students (< 60% this month)
    students = db.query(models.Student).filter(models.Student.status == "active").all()
    for student in students:
        records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            func.strftime("%Y", models.Attendance.date) == year_str,
            func.strftime("%m", models.Attendance.date) == mon_str,
        ).all()
        if records:
            present = sum(1 for r in records if r.status in ("present", "late"))
            rate = present / len(records) * 100
            if rate < 60:
                alerts.append(schemas.DashboardAlert(
                    type="low_attendance",
                    message=f"{student.name} has {rate:.0f}% attendance this month",
                    student_id=student.id,
                    student_name=student.name,
                ))

    # Overdue fees (unpaid cycles from StudentFeeCycle)
    unpaid_cycles = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.is_paid == False
    ).all()
    seen_students = set()
    for cycle in unpaid_cycles:
        if cycle.student_id in seen_students:
            continue
        student = db.query(models.Student).filter(models.Student.id == cycle.student_id).first()
        if student:
            seen_students.add(student.id)
            alerts.append(schemas.DashboardAlert(
                type="overdue_fee",
                message=f"{student.name} has unpaid fee cycles",
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
