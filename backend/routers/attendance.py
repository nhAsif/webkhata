from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(tags=["sessions"])
attendance_router = APIRouter(prefix="/api/attendance", tags=["attendance"])
sessions_router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ─── Sessions ────────────────────────────────────────────────────────────────

@sessions_router.get("", response_model=list[schemas.SessionResponse])
def list_sessions(
    batch_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Session)
    if batch_id:
        query = query.filter(models.Session.batch_id == batch_id)
    if from_date:
        query = query.filter(models.Session.date >= from_date)
    if to_date:
        query = query.filter(models.Session.date <= to_date)
    return query.order_by(models.Session.date.desc()).all()


@sessions_router.post("", response_model=schemas.SessionResponse, status_code=201)
def create_session(
    body: schemas.SessionCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == body.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    existing = db.query(models.Session).filter(
        models.Session.batch_id == body.batch_id,
        models.Session.date == body.date,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Session already exists for this batch on this date")

    session = models.Session(
        batch_id=body.batch_id,
        date=body.date,
        topic=body.topic,
        duration_minutes=body.duration_minutes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ─── Attendance ───────────────────────────────────────────────────────────────

@attendance_router.post("", status_code=201)
def bulk_mark_attendance(
    body: schemas.AttendanceBulkCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    session = db.query(models.Session).filter(models.Session.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for record in body.records:
        existing = db.query(models.Attendance).filter(
            models.Attendance.session_id == body.session_id,
            models.Attendance.student_id == record.student_id,
        ).first()

        if existing:
            existing.status = record.status
        else:
            att = models.Attendance(
                session_id=body.session_id,
                student_id=record.student_id,
                status=record.status,
            )
            db.add(att)

    db.commit()
    return {"message": f"Attendance marked for {len(body.records)} students"}


@attendance_router.get("/{session_id}", response_model=list[schemas.AttendanceResponse])
def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    return db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).all()


@attendance_router.get("/student/{student_id}", response_model=list[schemas.AttendanceResponse])
def get_student_attendance(
    student_id: int,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id
    ).join(models.Session)

    if from_date:
        query = query.filter(models.Session.date >= from_date)
    if to_date:
        query = query.filter(models.Session.date <= to_date)

    return query.order_by(models.Session.date.desc()).all()


@attendance_router.get("/summary/monthly")
def attendance_summary(
    month: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    from sqlalchemy import func
    year, mon = month.split("-")
    sessions = db.query(models.Session).filter(
        func.strftime("%Y", models.Session.date) == year,
        func.strftime("%m", models.Session.date) == mon,
    ).all()

    session_ids = [s.id for s in sessions]
    if not session_ids:
        return {"month": month, "total_sessions": 0, "summary": []}

    students = db.query(models.Student).filter(models.Student.status == "active").all()
    summary = []
    for student in students:
        records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.session_id.in_(session_ids),
        ).all()

        present_count = sum(1 for r in records if r.status == "present")
        absent_count = sum(1 for r in records if r.status == "absent")
        late_count = sum(1 for r in records if r.status == "late")
        total = len(session_ids)
        rate = round((present_count + late_count) / total * 100, 1) if total else 0

        summary.append({
            "student_id": student.id,
            "student_name": student.name,
            "present": present_count,
            "absent": absent_count,
            "late": late_count,
            "total_sessions": total,
            "attendance_rate": rate,
        })

    return {"month": month, "total_sessions": len(session_ids), "summary": summary}
