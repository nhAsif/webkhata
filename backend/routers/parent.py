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
    year, mon = month.split("-")

    sessions = db.query(models.Session).filter(
        func.strftime("%Y", models.Session.date) == year,
        func.strftime("%m", models.Session.date) == mon,
    ).all()

    session_ids = [s.id for s in sessions]
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.session_id.in_(session_ids),
    ).all()

    # Map session_id → date
    session_map = {s.id: s for s in sessions}
    calendar = {}
    for att in attendance_records:
        s = session_map.get(att.session_id)
        if s:
            calendar[str(s.date)] = att.status

    present = sum(1 for v in calendar.values() if v == "present")
    late = sum(1 for v in calendar.values() if v == "late")
    absent = sum(1 for v in calendar.values() if v == "absent")
    total = len(sessions)
    rate = round((present + late) / total * 100, 1) if total else 0

    return {
        "month": month,
        "student_name": student.name,
        "calendar": calendar,
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
    student = get_child(current_user, db)
    fees = db.query(models.Fee).filter(
        models.Fee.student_id == student.id
    ).order_by(models.Fee.month.desc()).all()

    today = date.today()
    current_month = today.strftime("%Y-%m")
    current_fee = next((f for f in fees if f.month == current_month), None)

    return {
        "student_name": student.name,
        "current_month": {
            "month": current_fee.month if current_fee else current_month,
            "amount_due": current_fee.amount_due if current_fee else 0,
            "amount_paid": current_fee.amount_paid if current_fee else 0,
            "status": current_fee.status if current_fee else "not_generated",
        } if current_fee else None,
        "history": [
            {
                "month": f.month,
                "amount_due": f.amount_due,
                "amount_paid": f.amount_paid,
                "status": f.status,
                "payment_date": str(f.payment_date) if f.payment_date else None,
                "payment_method": f.payment_method,
            }
            for f in fees
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
