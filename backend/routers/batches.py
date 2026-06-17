import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.get("", response_model=list[schemas.BatchResponse])
def list_batches(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Batch)
    if status:
        query = query.filter(models.Batch.status == status)
    batches = query.order_by(models.Batch.name).all()

    result = []
    for batch in batches:
        count = db.query(models.BatchStudent).filter(models.BatchStudent.batch_id == batch.id).count()
        data = schemas.BatchResponse.model_validate(batch)
        data.student_count = count
        result.append(data)
    return result


@router.post("", response_model=schemas.BatchResponse, status_code=201)
def create_batch(
    body: schemas.BatchCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    existing = db.query(models.Batch).filter(models.Batch.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch name already exists")

    batch = models.Batch(
        name=body.name,
        subject=body.subject,
        schedule=json.dumps(body.schedule),
        time_slot=body.time_slot,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.put("/{batch_id}", response_model=schemas.BatchResponse)
def update_batch(
    batch_id: int,
    body: schemas.BatchUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    update_data = body.model_dump(exclude_unset=True)
    if "schedule" in update_data:
        update_data["schedule"] = json.dumps(update_data["schedule"])

    for key, value in update_data.items():
        setattr(batch, key, value)

    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/{batch_id}")
def archive_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.status = "archived"
    db.commit()
    return {"message": "Batch archived"}


@router.get("/{batch_id}/students", response_model=list[schemas.StudentResponse])
def get_batch_students(
    batch_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch_students = (
        db.query(models.BatchStudent)
        .filter(models.BatchStudent.batch_id == batch_id)
        .all()
    )
    student_ids = [bs.student_id for bs in batch_students]
    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    return students


@router.post("/{batch_id}/students")
def add_student_to_batch(
    batch_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student_id = body.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id required")

    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(models.BatchStudent).filter(
        models.BatchStudent.batch_id == batch_id,
        models.BatchStudent.student_id == student_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already in this batch")

    bs = models.BatchStudent(batch_id=batch_id, student_id=student_id)
    db.add(bs)
    db.commit()
    return {"message": "Student added to batch"}


@router.delete("/{batch_id}/students/{student_id}")
def remove_student_from_batch(
    batch_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    bs = db.query(models.BatchStudent).filter(
        models.BatchStudent.batch_id == batch_id,
        models.BatchStudent.student_id == student_id,
    ).first()
    if not bs:
        raise HTTPException(status_code=404, detail="Student not in this batch")

    db.delete(bs)
    db.commit()
    return {"message": "Student removed from batch"}


@router.get("/{batch_id}/routine")
def get_batch_routine(
    batch_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    schedule = json.loads(batch.schedule) if isinstance(batch.schedule, str) else batch.schedule
    routine = {
        "batch_id": batch.id,
        "batch_name": batch.name,
        "subject": batch.subject,
        "time_slot": batch.time_slot,
        "schedule": schedule,
        "weekly_timetable": {
            "Sat": ["Math", "English", "Science", "Bangla"] if "Sat" in schedule else [],
            "Sun": ["Math", "English", "BGS", "Religion"] if "Sun" in schedule else [],
            "Mon": ["Math", "English", "Science", "Bangla"] if "Mon" in schedule else [],
            "Tue": ["Math", "English", "BGS", "Religion"] if "Tue" in schedule else [],
            "Wed": ["Math", "English", "Science", "Bangla"] if "Wed" in schedule else [],
            "Thu": ["Math", "English", "BGS", "Religion"] if "Thu" in schedule else [],
            "Fri": [],
        }
    }
    return routine
