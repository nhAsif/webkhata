from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/homework", tags=["homework"])


@router.get("", response_model=list[schemas.HomeworkResponse])
def list_homework(
    batch_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    query = db.query(models.Homework)
    if batch_id:
        query = query.filter(models.Homework.batch_id == batch_id)
    if from_date:
        query = query.filter(models.Homework.due_date >= from_date)
    if to_date:
        query = query.filter(models.Homework.due_date <= to_date)

    homework_list = query.order_by(models.Homework.due_date.desc()).all()
    result = []
    for hw in homework_list:
        sub_count = db.query(models.HomeworkSubmission).filter(
            models.HomeworkSubmission.homework_id == hw.id
        ).count()
        hw_data = schemas.HomeworkResponse.model_validate(hw)
        hw_data.submission_count = sub_count
        result.append(hw_data)
    return result


@router.post("", response_model=schemas.HomeworkResponse, status_code=201)
def create_homework(
    body: schemas.HomeworkCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch = db.query(models.Batch).filter(models.Batch.id == body.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    hw = models.Homework(
        batch_id=body.batch_id,
        title=body.title,
        description=body.description,
        assigned_date=body.assigned_date or date.today(),
        due_date=body.due_date,
    )
    db.add(hw)
    db.flush()  # Get ID before commit

    # Auto-create submission records for all students in the batch
    batch_students = db.query(models.BatchStudent).filter(
        models.BatchStudent.batch_id == body.batch_id
    ).all()

    for bs in batch_students:
        submission = models.HomeworkSubmission(
            homework_id=hw.id,
            student_id=bs.student_id,
            status="not_submitted",
        )
        db.add(submission)

    db.commit()
    db.refresh(hw)
    return hw


@router.put("/{homework_id}", response_model=schemas.HomeworkResponse)
def update_homework(
    homework_id: int,
    body: schemas.HomeworkUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    hw = db.query(models.Homework).filter(models.Homework.id == homework_id).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(hw, key, value)

    db.commit()
    db.refresh(hw)
    return hw


@router.get("/{homework_id}/submissions", response_model=list[schemas.SubmissionResponse])
def get_submissions(
    homework_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    hw = db.query(models.Homework).filter(models.Homework.id == homework_id).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    submissions = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.homework_id == homework_id
    ).all()

    result = []
    for sub in submissions:
        student = db.query(models.Student).filter(models.Student.id == sub.student_id).first()
        sub_data = schemas.SubmissionResponse.model_validate(sub)
        sub_data.student_name = student.name if student else None
        result.append(sub_data)
    return result


@router.put("/{homework_id}/submissions")
def bulk_update_submissions(
    homework_id: int,
    body: list[schemas.SubmissionUpdate],
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    hw = db.query(models.Homework).filter(models.Homework.id == homework_id).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    for update in body:
        sub = db.query(models.HomeworkSubmission).filter(
            models.HomeworkSubmission.homework_id == homework_id,
            models.HomeworkSubmission.student_id == update.student_id,
        ).first()

        if sub:
            sub.status = update.status
            if update.feedback is not None:
                sub.feedback = update.feedback

    db.commit()
    return {"message": f"Updated {len(body)} submissions"}
