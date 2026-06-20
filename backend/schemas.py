from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, field_validator, model_validator
import json


# ─── Auth ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class ParentLoginRequest(BaseModel):
    username: str
    parent_code: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    student_id: Optional[int] = None


# ─── Students ───────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    name: str
    class_level: str
    subjects: List[str]
    guardian_name: str
    guardian_phone: str
    parent_username: str
    parent_password: str
    address: Optional[str] = None
    enrollment_date: Optional[date] = None
    monthly_fee: float = 0.0
    start_date: Optional[date] = None

    @field_validator("class_level")
    @classmethod
    def validate_class_level(cls, v):
        valid_classes = ("Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "JSC", "SSC")
        if v not in valid_classes:
            raise ValueError(f"class_level must be one of {', '.join(valid_classes)}")
        return v

    @field_validator("subjects")
    @classmethod
    def validate_subjects(cls, v):
        if not v:
            raise ValueError("subjects must not be empty")
        return v

    @field_validator("monthly_fee")
    @classmethod
    def validate_monthly_fee(cls, v):
        if v < 0:
            raise ValueError("monthly_fee must be >= 0")
        return v


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    class_level: Optional[str] = None
    subjects: Optional[List[str]] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_username: Optional[str] = None
    parent_password: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    monthly_fee: Optional[float] = None
    start_date: Optional[date] = None

    @field_validator("class_level")
    @classmethod
    def validate_class_level(cls, v):
        valid_classes = ("Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "JSC", "SSC")
        if v is not None and v not in valid_classes:
            raise ValueError(f"class_level must be one of {', '.join(valid_classes)}")
        return v

    @field_validator("monthly_fee")
    @classmethod
    def validate_monthly_fee(cls, v):
        if v is not None and v < 0:
            raise ValueError("monthly_fee must be >= 0")
        return v


class StudentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("active", "inactive"):
            raise ValueError("status must be active or inactive")
        return v


class StudentResponse(BaseModel):
    id: int
    name: str
    class_level: str
    subjects: Any  # Will be parsed from JSON string
    guardian_name: str
    guardian_phone: str
    address: Optional[str]
    enrollment_date: date
    status: str
    parent_code: str
    parent_username: Optional[str] = None
    photo_path: Optional[str]
    monthly_fee: float
    start_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def parse_subjects(self):
        if isinstance(self.subjects, str):
            try:
                self.subjects = json.loads(self.subjects)
            except Exception:
                self.subjects = []
        return self


# ─── Batches ────────────────────────────────────────────────────────────────

class BatchCreate(BaseModel):
    name: str
    subject: str
    schedule: List[str]
    time_slot: str

    @field_validator("schedule")
    @classmethod
    def validate_schedule(cls, v):
        valid_days = {"Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"}
        for day in v:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}")
        return v


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    schedule: Optional[List[str]] = None
    time_slot: Optional[str] = None
    status: Optional[str] = None


class BatchResponse(BaseModel):
    id: int
    name: str
    subject: str
    schedule: Any
    time_slot: str
    status: str
    weekly_timetable: Optional[Any] = None
    created_at: datetime
    updated_at: datetime
    student_count: Optional[int] = 0

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def parse_fields(self):
        if isinstance(self.schedule, str):
            try:
                self.schedule = json.loads(self.schedule)
            except Exception:
                self.schedule = []
        if isinstance(self.weekly_timetable, str):
            try:
                self.weekly_timetable = json.loads(self.weekly_timetable)
            except Exception:
                self.weekly_timetable = None
        return self


class BatchTimetableUpdate(BaseModel):
    weekly_timetable: dict  # e.g. {"Sat": ["Math", "English"], "Sun": ["Science"]}


# ─── Sessions ───────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    batch_id: int
    date: date
    topic: Optional[str] = None
    duration_minutes: int = 60


class SessionResponse(BaseModel):
    id: int
    batch_id: int
    date: date
    topic: Optional[str]
    duration_minutes: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Attendance ──────────────────────────────────────────────────────────────

class AttendanceRecord(BaseModel):
    student_id: int
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("present", "absent", "late"):
            raise ValueError("status must be present, absent, or late")
        return v


class AttendanceBulkCreate(BaseModel):
    date: date
    records: List[AttendanceRecord]


class AttendanceResponse(BaseModel):
    id: int
    date: date
    student_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionAutoInit(BaseModel):
    """Body for auto-initialising a session and marking all students present."""
    batch_id: int
    date: date
    topic: Optional[str] = None
    duration_minutes: int = 60


class AttendanceStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("present", "absent", "late"):
            raise ValueError("status must be present, absent, or late")
        return v


# ─── Fees ────────────────────────────────────────────────────────────────────

class FeeGenerate(BaseModel):
    month: str  # YYYY-MM
    amount_due: float

    @field_validator("amount_due")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("amount_due must be positive")
        return v


class FeePayment(BaseModel):
    amount_paid: float
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("payment_method")
    @classmethod
    def validate_method(cls, v):
        if v is not None and v not in ("cash", "bkash", "nagad", "bank"):
            raise ValueError("Invalid payment method")
        return v


class FeeResponse(BaseModel):
    id: int
    student_id: int
    month: str
    amount_due: float
    amount_paid: float
    payment_date: Optional[date]
    payment_method: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Fee Cycles ──────────────────────────────────────────────────────────────

class FeeCycleResponse(BaseModel):
    id: int
    student_id: int
    cycle_number: int
    cycle_start_date: date
    cycle_end_date: date
    fee_amount: float
    is_paid: bool
    payment_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}


class FeeCycleMarkPaid(BaseModel):
    payment_date: Optional[date] = None
    notes: Optional[str] = None


class FeeDashboardRow(BaseModel):
    student_id: int
    student_name: str
    monthly_fee: float
    start_date: Optional[date]
    completed_cycles: int
    paid_cycles: int
    unpaid_cycles: int
    amount_due: float  # unpaid_cycles * monthly_fee

    model_config = {"from_attributes": True}


class FeeDashboardStats(BaseModel):
    total_students: int
    students_with_due: int
    total_completed_cycles: int
    total_paid_cycles: int
    total_unpaid_cycles: int
    total_collected: float
    total_pending: float


# ─── Homework ────────────────────────────────────────────────────────────────

class HomeworkCreate(BaseModel):
    batch_id: int
    title: str
    description: Optional[str] = None
    assigned_date: Optional[date] = None
    due_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        assigned = self.assigned_date or date.today()
        if self.due_date < assigned:
            raise ValueError("due_date must be >= assigned_date")
        return self


class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None


class HomeworkResponse(BaseModel):
    id: int
    batch_id: int
    title: str
    description: Optional[str]
    assigned_date: date
    due_date: date
    created_at: datetime
    submission_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class SubmissionUpdate(BaseModel):
    student_id: int
    status: str
    feedback: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("submitted", "not_submitted", "late"):
            raise ValueError("Invalid submission status")
        return v


class SubmissionResponse(BaseModel):
    id: int
    homework_id: int
    student_id: int
    status: str
    feedback: Optional[str]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Results ─────────────────────────────────────────────────────────────────

class ResultCreate(BaseModel):
    student_id: int
    subject: str
    exam_name: str
    exam_date: date
    score: float
    total_marks: float

    @model_validator(mode="after")
    def validate_scores(self):
        if self.score < 0:
            raise ValueError("score must be >= 0")
        if self.total_marks <= 0:
            raise ValueError("total_marks must be > 0")
        if self.score > self.total_marks:
            raise ValueError("score cannot exceed total_marks")
        return self


class ResultUpdate(BaseModel):
    subject: Optional[str] = None
    exam_name: Optional[str] = None
    exam_date: Optional[date] = None
    score: Optional[float] = None
    total_marks: Optional[float] = None


class ResultResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    exam_name: str
    exam_date: date
    score: float
    total_marks: float
    grade: Optional[str]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_students: int
    total_active_students: int
    todays_sessions: int
    unpaid_fees_count: int
    monthly_collection: float
    attendance_rate: float
    # New financial aggregates (payment ledger)
    total_monthly_expected: float
    total_due: float
    total_paid: float
    outstanding_balance: float


class DashboardAlert(BaseModel):
    type: str
    message: str
    student_id: Optional[int] = None
    student_name: Optional[str] = None


# ─── Payments ────────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    student_id: int
    amount: float
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("amount must be > 0")
        return v


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError("amount must be > 0")
        return v


class PaymentResponse(BaseModel):
    id: int
    student_id: int
    amount: float
    payment_date: date
    notes: Optional[str]
    created_at: datetime
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Student Financial Summary ────────────────────────────────────────────────

class StudentFinancial(BaseModel):
    """Per-student financial summary computed from the payment ledger."""
    student_id: int
    student_name: str
    monthly_fee: float
    start_date: Optional[date]
    completed_cycles: int
    total_due: float
    total_paid: float
    outstanding_balance: float
    # 'paid' | 'partial' | 'overdue'
    status: str


# ─── Reports ─────────────────────────────────────────────────────────────────

class MonthlyCollectionRow(BaseModel):
    """One row in the monthly collection report."""
    student_id: int
    student_name: str
    class_level: str
    monthly_fee: float
    total_paid_this_month: float
    outstanding_balance: float
    status: str  # 'paid' | 'partial' | 'overdue'


# ─── Vocabulary ──────────────────────────────────────────────────────────────

class VocabularyWordResponse(BaseModel):
    id: int
    word: str
    bangla_meaning: str
    part_of_speech: str
    synonyms: Optional[str]
    antonyms: Optional[str]
    example_sentence: Optional[str]
    bangla_sentence_meaning: Optional[str]
    bangla_pronunciation: Optional[str] = None

    model_config = {"from_attributes": True}


class DailyVocabularyResponse(BaseModel):
    id: int
    date: date
    word_id: int
    display_order: int
    word: VocabularyWordResponse

    model_config = {"from_attributes": True}


class StudentVocabularyProgressResponse(BaseModel):
    id: int
    student_id: int
    word_id: int
    viewed: bool
    bookmarked: bool
    viewed_at: Optional[datetime]
    word: VocabularyWordResponse

    model_config = {"from_attributes": True}


class PracticeResultCreate(BaseModel):
    mode: str
    score: int
    total_questions: int

    @field_validator("score")
    @classmethod
    def validate_score(cls, v, info):
        # We can't easily validate against total_questions here without info.data, but it's fine.
        if v < 0:
            raise ValueError("Score cannot be negative")
        return v


class PracticeResultResponse(BaseModel):
    id: int
    student_id: int
    date: date
    mode: str
    score: int
    total_questions: int
    created_at: datetime

    model_config = {"from_attributes": True}
