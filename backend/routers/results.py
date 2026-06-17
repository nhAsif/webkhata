from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import require_tutor
from database import get_db
from utils.grading import calculate_grade
import models
import schemas

router = APIRouter(prefix="/api/results", tags=["results"])


@router.post("", response_model=schemas.ResultResponse, status_code=201)
def add_result(
    body: schemas.ResultCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    student = db.query(models.Student).filter(models.Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(models.Result).filter(
        models.Result.student_id == body.student_id,
        models.Result.subject == body.subject,
        models.Result.exam_name == body.exam_name,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Result already exists for this student/subject/exam")

    grade = calculate_grade(body.score, body.total_marks)
    result = models.Result(
        student_id=body.student_id,
        subject=body.subject,
        exam_name=body.exam_name,
        exam_date=body.exam_date,
        score=body.score,
        total_marks=body.total_marks,
        grade=grade,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.post("/bulk", status_code=201)
def bulk_add_results(
    results: list[schemas.ResultCreate],
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    created = []
    errors = []

    for body in results:
        try:
            existing = db.query(models.Result).filter(
                models.Result.student_id == body.student_id,
                models.Result.subject == body.subject,
                models.Result.exam_name == body.exam_name,
            ).first()

            if existing:
                # Update instead of create
                existing.score = body.score
                existing.total_marks = body.total_marks
                existing.grade = calculate_grade(body.score, body.total_marks)
                existing.exam_date = body.exam_date
                created.append(body.student_id)
            else:
                grade = calculate_grade(body.score, body.total_marks)
                result = models.Result(
                    student_id=body.student_id,
                    subject=body.subject,
                    exam_name=body.exam_name,
                    exam_date=body.exam_date,
                    score=body.score,
                    total_marks=body.total_marks,
                    grade=grade,
                )
                db.add(result)
                created.append(body.student_id)
        except Exception as e:
            errors.append({"student_id": body.student_id, "error": str(e)})

    db.commit()
    return {"created": len(created), "errors": errors}


@router.get("/student/{student_id}", response_model=list[schemas.ResultResponse])
def get_student_results(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    return db.query(models.Result).filter(
        models.Result.student_id == student_id
    ).order_by(models.Result.exam_date.desc()).all()


@router.get("/batch/{batch_id}")
def get_batch_results(
    batch_id: int,
    exam_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    batch_students = db.query(models.BatchStudent).filter(
        models.BatchStudent.batch_id == batch_id
    ).all()
    student_ids = [bs.student_id for bs in batch_students]

    query = db.query(models.Result).filter(models.Result.student_id.in_(student_ids))
    if exam_name:
        query = query.filter(models.Result.exam_name == exam_name)

    results = query.all()
    return results


@router.put("/{result_id}", response_model=schemas.ResultResponse)
def update_result(
    result_id: int,
    body: schemas.ResultUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_tutor),
):
    result = db.query(models.Result).filter(models.Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(result, key, value)

    # Re-calculate grade
    result.grade = calculate_grade(result.score, result.total_marks)

    db.commit()
    db.refresh(result)
    return result
