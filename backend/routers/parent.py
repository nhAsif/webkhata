import json
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_parent
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/parent", tags=["parent"])


def get_child(current_user: models.User, db: Session) -> models.Student:
    if not current_user.student_id:
        raise HTTPException(status_code=403, detail="No student linked to this account")
    student = db.query(models.Student).filter(models.Student.id == current_user.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/profile")
def get_profile(
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    student = get_child(current_user, db)
    batches = db.query(models.Batch).join(
        models.BatchStudent,
        models.BatchStudent.batch_id == models.Batch.id
    ).filter(models.BatchStudent.student_id == student.id).all()

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "class_level": student.class_level,
            "subjects": json.loads(student.subjects) if isinstance(student.subjects, str) else student.subjects,
            "enrollment_date": str(student.enrollment_date),
            "status": student.status,
        },
        "batches": [{"id": b.id, "name": b.name, "subject": b.subject, "time_slot": b.time_slot} for b in batches],
    }


@router.get("/attendance")
def get_attendance(
    month: Optional[str] = Query(None),
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    student = get_child(current_user, db)
    today = date.today()
    month = month or today.strftime("%Y-%m")
    year_str, mon_str = month.split("-")
    year, mon = int(year_str), int(mon_str)

    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        func.strftime("%Y", models.Attendance.date) == year_str,
        func.strftime("%m", models.Attendance.date) == mon_str,
    ).all()

    calendar_dict = {}
    for att in attendance_records:
        calendar_dict[str(att.date)] = att.status

    present = sum(1 for v in calendar_dict.values() if v == "present")
    late = sum(1 for v in calendar_dict.values() if v == "late")
    absent = sum(1 for v in calendar_dict.values() if v == "absent")
    
    import calendar
    if today.year == year and today.month == mon:
        days_in_month = today.day
    elif today.year < year or (today.year == year and today.month < mon):
        days_in_month = 0
    else:
        days_in_month = calendar.monthrange(year, mon)[1]

    # Total days considered for the student is from their start_date
    student_start = student.start_date or date(year, mon, 1)
    start_of_month = date(year, mon, 1)
    end_of_month = date(year, mon, calendar.monthrange(year, mon)[1])
    
    if student_start > end_of_month:
        total = 0
    else:
        calc_start = max(start_of_month, student_start)
        calc_end = min(end_of_month, today)
        total = (calc_end - calc_start).days + 1

    total = max(0, total)
    rate = round((present + late) / total * 100, 1) if total > 0 else 0

    return {
        "month": month,
        "student_name": student.name,
        "calendar": calendar_dict,
        "summary": {
            "present": present,
            "late": late,
            "absent": absent,
            "total_sessions": total,
            "attendance_rate": rate,
        }
    }


@router.get("/fees")
def get_fees(
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    import math
    from datetime import timedelta

    student = get_child(current_user, db)
    today = date.today()

    # Auto-generate missing completed cycles
    if student.start_date and student.start_date <= today:
        completed_count = math.floor((today - student.start_date).days / 30)
        for i in range(completed_count):
            cycle_number = i + 1
            c_start = student.start_date + timedelta(days=i * 30)
            c_end = student.start_date + timedelta(days=(i + 1) * 30 - 1)
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

    cycles = db.query(models.StudentFeeCycle).filter(
        models.StudentFeeCycle.student_id == student.id
    ).order_by(models.StudentFeeCycle.cycle_number).all()

    completed = len(cycles)
    paid = sum(1 for c in cycles if c.is_paid)
    unpaid = completed - paid
    pending_amount = unpaid * student.monthly_fee

    return {
        "student_name": student.name,
        "monthly_fee": student.monthly_fee,
        "start_date": str(student.start_date) if student.start_date else None,
        "summary": {
            "completed_cycles": completed,
            "paid_cycles": paid,
            "unpaid_cycles": unpaid,
            "pending_amount": pending_amount,
        },
        "cycles": [
            {
                "cycle_number": c.cycle_number,
                "cycle_start_date": str(c.cycle_start_date),
                "cycle_end_date": str(c.cycle_end_date),
                "fee_amount": c.fee_amount,
                "is_paid": c.is_paid,
                "payment_date": str(c.payment_date) if c.payment_date else None,
                "notes": c.notes,
            }
            for c in cycles
        ],
    }


@router.get("/routine")
def get_routine(
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    student = get_child(current_user, db)
    batches = db.query(models.Batch).join(
        models.BatchStudent,
        models.BatchStudent.batch_id == models.Batch.id
    ).filter(models.BatchStudent.student_id == student.id).all()

    ALL_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]

    # Build merged timetable from all enrolled batches
    # Each day's subjects = union across all batches that have that day in their timetable
    merged_timetable = {day: [] for day in ALL_DAYS}
    for batch in batches:
        if not batch.weekly_timetable:
            continue
        bt = json.loads(batch.weekly_timetable) if isinstance(batch.weekly_timetable, str) else batch.weekly_timetable
        for day, subjects in bt.items():
            if day in merged_timetable and isinstance(subjects, list):
                for subj in subjects:
                    if subj not in merged_timetable[day]:
                        merged_timetable[day].append(subj)

    batch_details = []
    for batch in batches:
        schedule = json.loads(batch.schedule) if isinstance(batch.schedule, str) else batch.schedule
        batch_details.append({
            "batch_name": batch.name,
            "subject": batch.subject,
            "time_slot": batch.time_slot,
            "days": schedule,
        })

    return {
        "student_name": student.name,
        "batches": batch_details,
        "weekly_timetable": merged_timetable,
    }



@router.get("/homework")
def get_homework(
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    student = get_child(current_user, db)
    submissions = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student.id
    ).all()

    result = []
    for sub in submissions:
        hw = db.query(models.Homework).filter(models.Homework.id == sub.homework_id).first()
        if hw:
            result.append({
                "homework_id": hw.id,
                "title": hw.title,
                "description": hw.description,
                "assigned_date": str(hw.assigned_date),
                "due_date": str(hw.due_date),
                "submission_status": sub.status,
                "feedback": sub.feedback,
            })

    result.sort(key=lambda x: x["due_date"], reverse=True)
    return {"student_name": student.name, "homework": result}


@router.get("/results")
def get_results(
    current_user: models.User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    student = get_child(current_user, db)
    results = db.query(models.Result).filter(
        models.Result.student_id == student.id
    ).order_by(models.Result.exam_date.desc()).all()

    return {
        "student_name": student.name,
        "results": [
            {
                "id": r.id,
                "subject": r.subject,
                "exam_name": r.exam_name,
                "exam_date": str(r.exam_date),
                "score": r.score,
                "total_marks": r.total_marks,
                "percentage": round(r.score / r.total_marks * 100, 1),
                "grade": r.grade,
            }
            for r in results
        ],
    }
