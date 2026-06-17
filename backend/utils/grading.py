def calculate_grade(score: float, total_marks: float) -> str:
    """Calculate Bangladesh SSC/JSC grading scale grade from score and total marks."""
    if total_marks <= 0:
        raise ValueError("total_marks must be positive")
    pct = (score / total_marks) * 100
    if pct >= 80:
        return "A+"
    if pct >= 70:
        return "A"
    if pct >= 60:
        return "A-"
    if pct >= 50:
        return "B"
    if pct >= 40:
        return "C"
    if pct >= 33:
        return "D"
    return "F"


GRADE_POINTS = {
    "A+": 5.0,
    "A": 4.0,
    "A-": 3.5,
    "B": 3.0,
    "C": 2.0,
    "D": 1.0,
    "F": 0.0,
}


def grade_to_points(grade: str) -> float:
    return GRADE_POINTS.get(grade, 0.0)
