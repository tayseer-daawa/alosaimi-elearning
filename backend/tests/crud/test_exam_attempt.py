import uuid
from datetime import date, timedelta

from sqlmodel import Session

from app import crud
from app.models import ExamAttemptCreate, ExamAttemptUpdate, ExamCreate
from tests.utils.book import create_random_book
from tests.utils.session import create_random_session
from tests.utils.user import create_random_user


def test_get_exam_attempt(db: Session) -> None:
    """Test getting an exam attempt by ID"""
    book = create_random_book(db)
    session = create_random_session(db)
    exam_in = ExamCreate(
        start_date=date.today(),
        deadline=date.today() + timedelta(days=7),
        max_attempts=3,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)

    student = create_random_user(db)
    examiner = create_random_user(db)

    attempt_in = ExamAttemptCreate(
        observation="Test observation",
        passed=True,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    # Get the attempt by ID
    stored_attempt = crud.get_exam_attempt(session=db, attempt_id=attempt.id)
    assert stored_attempt is not None
    assert stored_attempt.id == attempt.id
    assert stored_attempt.observation == "Test observation"
    assert stored_attempt.passed is True


def test_get_exam_attempt_not_found(db: Session) -> None:
    """Test getting a non-existent exam attempt"""

    result = crud.get_exam_attempt(session=db, attempt_id=uuid.uuid4())
    assert result is None


def test_get_exam_attempts_by_student(db: Session) -> None:
    """Test getting exam attempts for a specific student"""
    book = create_random_book(db)
    session = create_random_session(db)
    exam_in = ExamCreate(
        start_date=date.today(),
        deadline=date.today() + timedelta(days=7),
        max_attempts=5,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)

    student = create_random_user(db)
    examiner = create_random_user(db)

    # Create multiple attempts for this student
    for i in range(3):
        attempt_in = ExamAttemptCreate(
            observation=f"Student attempt {i+1}",
            passed=i == 2,
            exam_id=exam.id,
            student_id=student.id,
            examiner_id=examiner.id,
        )
        crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    # Get attempts for this student
    attempts = crud.get_exam_attempts_by_student(
        session=db, student_id=student.id, skip=0, limit=10
    )
    assert len(attempts) >= 3


def test_update_exam_attempt(db: Session) -> None:
    """Test updating an exam attempt"""
    book = create_random_book(db)
    session = create_random_session(db)
    exam_in = ExamCreate(
        start_date=date.today(),
        deadline=date.today() + timedelta(days=7),
        max_attempts=3,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)

    student = create_random_user(db)
    examiner = create_random_user(db)

    attempt_in = ExamAttemptCreate(
        observation="Initial observation",
        passed=False,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    # Update the attempt
    update_data = ExamAttemptUpdate(
        observation="Updated observation",
        passed=True,
    )
    updated_attempt = crud.update_exam_attempt(
        session=db, db_attempt=attempt, attempt_in=update_data
    )

    assert updated_attempt.id == attempt.id
    assert updated_attempt.observation == "Updated observation"
    assert updated_attempt.passed is True


def test_delete_exam_attempt(db: Session) -> None:
    """Test deleting an exam attempt"""
    book = create_random_book(db)
    session = create_random_session(db)
    exam_in = ExamCreate(
        start_date=date.today(),
        deadline=date.today() + timedelta(days=7),
        max_attempts=3,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)

    student = create_random_user(db)
    examiner = create_random_user(db)

    attempt_in = ExamAttemptCreate(
        observation="To be deleted",
        passed=True,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    # Delete the attempt
    result = crud.delete_exam_attempt(session=db, attempt_id=attempt.id)
    assert result is True

    # Verify it's deleted
    deleted_attempt = crud.get_exam_attempt(session=db, attempt_id=attempt.id)
    assert deleted_attempt is None


def test_delete_exam_attempt_not_found(db: Session) -> None:
    """Test deleting a non-existent exam attempt"""

    result = crud.delete_exam_attempt(session=db, attempt_id=uuid.uuid4())
    assert result is False
