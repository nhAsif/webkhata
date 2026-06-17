"""
Seed script — populates the database with demo data for development/testing.
Run from the backend directory:
    python ../scripts/seed.py
"""
import sys
import os
import json
import random
import string
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)) + "/backend")

from database import SessionLocal, engine
import models
from auth import hash_password
from utils.grading import calculate_grade

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()


def gen_code(db):
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=6))
        if not db.query(models.Student).filter_by(parent_code=code).first():
            return code


def random_phone():
    return f"017{random.randint(10000000, 99999999)}"


print("Creating tutor admin user...")
if not db.query(models.User).filter_by(username="admin").first():
    db.add(models.User(
        role="tutor",
        username="admin",
        password_hash=hash_password("changeme"),
        is_active=True,
    ))
    db.commit()

print("Creating students...")
STUDENTS = [
    ("Rahim Uddin", "SSC", ["Math", "English", "Science"]),
    ("Karim Hossain", "SSC", ["Math", "English", "Bangla"]),
    ("Sumaiya Begum", "JSC", ["Math", "English", "BGS"]),
    ("Farhan Ahmed", "SSC", ["Math", "Physics", "Chemistry"]),
    ("Nusrat Jahan", "JSC", ["Math", "English", "Bangla"]),
    ("Imran Khan", "SSC", ["Math", "English", "Biology"]),
    ("Tasnim Akter", "JSC", ["Math", "English", "BGS"]),
    ("Shakib Rahman", "SSC", ["Math", "English", "ICT"]),
]

students = []
for name, cls, subjects in STUDENTS:
    student = models.Student(
        name=name,
        class_level=cls,
        subjects=json.dumps(subjects),
        guardian_name=f"Parent of {name.split()[0]}",
        guardian_phone=random_phone(),
        address=f"{random.randint(1, 99)} Demo Street, Dhaka",
        enrollment_date=date.today() - timedelta(days=random.randint(30, 180)),
        parent_code=gen_code(db),
        status="active",
    )
    db.add(student)
    students.append(student)

db.commit()
for s in students:
    db.refresh(s)

print("Creating batches...")
batch_a = models.Batch(
    name="SSC Math — Batch A",
    subject="Mathematics",
    schedule=json.dumps(["Sat", "Mon", "Wed"]),
    time_slot="5:00 PM",
    status="active",
)
batch_b = models.Batch(
    name="JSC English — Batch B",
    subject="English",
    schedule=json.dumps(["Sun", "Tue", "Thu"]),
    time_slot="4:00 PM",
    status="active",
)
db.add_all([batch_a, batch_b])
db.commit()
db.refresh(batch_a)
db.refresh(batch_b)

print("Assigning students to batches...")
ssc_students = [s for s in students if s.class_level == "SSC"]
jsc_students = [s for s in students if s.class_level == "JSC"]

for s in ssc_students:
    db.add(models.BatchStudent(batch_id=batch_a.id, student_id=s.id))
for s in jsc_students:
    db.add(models.BatchStudent(batch_id=batch_b.id, student_id=s.id))
db.commit()

print("Creating sessions and attendance...")
today = date.today()
for i in range(10):
    session_date = today - timedelta(days=i * 3)
    for batch_id, batch_students_list in [(batch_a.id, ssc_students), (batch_b.id, jsc_students)]:
        try:
            session = models.Session(
                batch_id=batch_id,
                date=session_date,
                topic=f"Chapter {random.randint(1, 8)} revision",
                duration_minutes=60,
            )
            db.add(session)
            db.flush()

            for s in batch_students_list:
                status = random.choices(["present", "absent", "late"], weights=[75, 15, 10])[0]
                db.add(models.Attendance(
                    session_id=session.id,
                    student_id=s.id,
                    status=status,
                ))
        except Exception as e:
            db.rollback()
            print(f"  Skipped duplicate session: {e}")

db.commit()

print("Generating fee records...")
current_month = today.strftime("%Y-%m")
last_month = (today.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")

for s in students:
    for month in [last_month, current_month]:
        try:
            paid = random.choice([True, True, False])
            amount_paid = 1500 if paid else random.choice([0, 750])
            db.add(models.Fee(
                student_id=s.id,
                month=month,
                amount_due=1500,
                amount_paid=amount_paid,
                payment_method=random.choice(["cash", "bkash", "nagad"]) if amount_paid > 0 else None,
                payment_date=today if amount_paid > 0 else None,
                status="paid" if amount_paid >= 1500 else "partial" if amount_paid > 0 else "unpaid",
            ))
        except:
            pass

db.commit()

print("Adding homework...")
hw = models.Homework(
    batch_id=batch_a.id,
    title="Chapter 4 — Algebra exercises",
    description="Complete all problems from exercise 4.1 to 4.5",
    assigned_date=today - timedelta(days=3),
    due_date=today + timedelta(days=2),
)
db.add(hw)
db.flush()

for s in ssc_students:
    status = random.choice(["submitted", "not_submitted", "not_submitted"])
    db.add(models.HomeworkSubmission(
        homework_id=hw.id,
        student_id=s.id,
        status=status,
        feedback="Good work!" if status == "submitted" else None,
    ))

db.commit()

print("Adding exam results...")
exams = ["Class Test 1", "Monthly Test", "Class Test 2"]
subjects = ["Mathematics", "English"]

for s in students:
    for exam in exams:
        for subject in subjects:
            score = round(random.uniform(40, 95), 1)
            total = 100
            try:
                db.add(models.Result(
                    student_id=s.id,
                    subject=subject,
                    exam_name=exam,
                    exam_date=today - timedelta(days=random.randint(10, 90)),
                    score=score,
                    total_marks=total,
                    grade=calculate_grade(score, total),
                ))
            except:
                pass

db.commit()
db.close()

print("\n✅ Seed data created successfully!")
print(f"   Students: {len(STUDENTS)}")
print(f"   Default login: admin / changeme")
print(f"\nParent codes:")
db2 = SessionLocal()
for s in db2.query(models.Student).all():
    print(f"   {s.name}: phone={s.guardian_phone}  code={s.parent_code}")
db2.close()
