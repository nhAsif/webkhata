from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, event
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('tutor', 'parent')", name="check_user_role"),
    )


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_level = Column(String, nullable=False)
    subjects = Column(Text, nullable=False)  # JSON array
    guardian_name = Column(String, nullable=False)
    guardian_phone = Column(String, nullable=False, index=True)
    address = Column(Text, nullable=True)
    enrollment_date = Column(Date, nullable=False, default=date.today)
    status = Column(String, nullable=False, default="active")
    parent_code = Column(String, unique=True, nullable=False, index=True)
    photo_path = Column(String, nullable=True)
    # Fee-related fields for the new payment ledger system
    monthly_fee = Column(Float, nullable=False, default=0.0)
    start_date = Column(Date, nullable=True, default=date.today)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="check_student_status"),
    )

    # Relationships
    batch_students = relationship("BatchStudent", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    fees = relationship("Fee", back_populates="student")
    fee_cycles = relationship("StudentFeeCycle", back_populates="student", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    homework_submissions = relationship("HomeworkSubmission", back_populates="student", cascade="all, delete-orphan")
    results = relationship("Result", back_populates="student")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    subject = Column(String, nullable=False)
    schedule = Column(Text, nullable=False)  # JSON array of days
    time_slot = Column(String, nullable=False)
    weekly_timetable = Column(Text, nullable=True)  # JSON object: {day: [subjects]}
    status = Column(String, default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('active', 'archived')", name="check_batch_status"),
    )

    # Relationships
    batch_students = relationship("BatchStudent", back_populates="batch", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="batch", cascade="all, delete-orphan")
    homework = relationship("Homework", back_populates="batch", cascade="all, delete-orphan")


class BatchStudent(Base):
    __tablename__ = "batch_students"

    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=func.now())

    # Relationships
    batch = relationship("Batch", back_populates="batch_students")
    student = relationship("Student", back_populates="batch_students")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    topic = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=60)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("batch_id", "date", name="uq_session_batch_date"),
    )

    # Relationships
    batch = relationship("Batch", back_populates="sessions")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, nullable=False, default="present")
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("date", "student_id", name="uq_attendance_date_student"),
        CheckConstraint("status IN ('present', 'absent', 'late')", name="check_attendance_status"),
    )

    # Relationships
    student = relationship("Student", back_populates="attendance_records")


class Payment(Base):
    """New payment ledger — records individual tuition payments per student."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False, default=date.today)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_payment_amount_positive"),
    )

    # Relationships
    student = relationship("Student", back_populates="payments")


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="RESTRICT"), nullable=False, index=True)
    month = Column(String, nullable=False)  # YYYY-MM
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String, nullable=True)
    status = Column(String, nullable=False, default="unpaid")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "month", name="uq_fee_student_month"),
        CheckConstraint("amount_due > 0", name="check_fee_amount_due"),
        CheckConstraint("amount_paid >= 0", name="check_fee_amount_paid"),
        CheckConstraint("status IN ('paid', 'unpaid', 'partial')", name="check_fee_status"),
        CheckConstraint(
            "payment_method IS NULL OR payment_method IN ('cash', 'bkash', 'nagad', 'bank')",
            name="check_fee_payment_method"
        ),
    )

    # Relationships
    student = relationship("Student", back_populates="fees")


class StudentFeeCycle(Base):
    """Tracks each 30-day billing cycle per student."""
    __tablename__ = "student_fee_cycles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_number = Column(Integer, nullable=False)  # 1-based
    cycle_start_date = Column(Date, nullable=False)
    cycle_end_date = Column(Date, nullable=False)
    fee_amount = Column(Float, nullable=False)
    is_paid = Column(Boolean, default=False, nullable=False)
    payment_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "cycle_number", name="uq_fee_cycle_student_cycle"),
        CheckConstraint("fee_amount >= 0", name="check_fee_cycle_amount"),
        CheckConstraint("cycle_number >= 1", name="check_fee_cycle_number"),
    )

    # Relationships
    student = relationship("Student", back_populates="fee_cycles")


class Homework(Base):
    __tablename__ = "homework"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assigned_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    batch = relationship("Batch", back_populates="homework")
    submissions = relationship("HomeworkSubmission", back_populates="homework", cascade="all, delete-orphan")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, index=True)
    homework_id = Column(Integer, ForeignKey("homework.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="not_submitted")
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("homework_id", "student_id", name="uq_submission_homework_student"),
        CheckConstraint(
            "status IN ('submitted', 'not_submitted', 'late')",
            name="check_submission_status"
        ),
    )

    # Relationships
    homework = relationship("Homework", back_populates="submissions")
    student = relationship("Student", back_populates="homework_submissions")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="RESTRICT"), nullable=False)
    subject = Column(String, nullable=False)
    exam_name = Column(String, nullable=False)
    exam_date = Column(Date, nullable=False)
    score = Column(Float, nullable=False)
    total_marks = Column(Float, nullable=False)
    grade = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "subject", "exam_name", name="uq_result_student_subject_exam"),
        CheckConstraint("score >= 0", name="check_result_score"),
        CheckConstraint("total_marks > 0", name="check_result_total_marks"),
    )

    # Relationships
    student = relationship("Student", back_populates="results")


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, nullable=False, index=True)
    bangla_meaning = Column(String, nullable=False)
    part_of_speech = Column(String, nullable=False)
    synonyms = Column(String, nullable=True)
    antonyms = Column(String, nullable=True)
    example_sentence = Column(Text, nullable=True)
    bangla_sentence_meaning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())


class DailyVocabularySet(Base):
    __tablename__ = "daily_vocabulary_sets"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("vocabulary_words.id", ondelete="CASCADE"), nullable=False)
    display_order = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("date", "word_id", name="uq_daily_vocab_date_word"),
    )

    word = relationship("VocabularyWord")


class StudentVocabularyProgress(Base):
    __tablename__ = "student_vocabulary_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("vocabulary_words.id", ondelete="CASCADE"), nullable=False)
    viewed = Column(Boolean, default=False)
    bookmarked = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("student_id", "word_id", name="uq_student_vocab_student_word"),
    )

    student = relationship("Student")
    word = relationship("VocabularyWord")
