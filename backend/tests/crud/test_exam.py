from datetime import date, timedelta

import pytest
from sqlmodel import Session

from app import crud
from app.models import ExamAttemptCreate, ExamCreate, ExamUpdate
from tests.utils.book import create_random_book
from tests.utils.session import create_random_session
from tests.utils.user import create_random_user


def test_create_exam(db: Session) -> None:
    book = create_random_book(db)
    session = create_random_session(db)
    start_date = date.today()
    deadline = date.today() + timedelta(days=7)

    exam_in = ExamCreate(
        start_date=start_date,
        deadline=deadline,
        max_attempts=3,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)
    assert exam.max_attempts == 3
    assert exam.book_id == book.id
    assert exam.session_id == session.id
    assert exam.id is not None


def test_create_exam_one_day(db: Session) -> None:
    book = create_random_book(db)
    session = create_random_session(db)
    start_date = date.today()
    deadline = date.today()

    exam_in = ExamCreate(
        start_date=start_date,
        deadline=deadline,
        max_attempts=3,
        book_id=book.id,
        session_id=session.id,
    )
    exam = crud.create_exam(session=db, exam_in=exam_in)
    assert exam.max_attempts == 3
    assert exam.book_id == book.id
    assert exam.session_id == session.id
    assert exam.id is not None


def test_create_exam_start_date_after_deadline(db: Session) -> None:
    book = create_random_book(db)
    session = create_random_session(db)
    start_date = date.today() + timedelta(days=8)
    deadline = date.today() + timedelta(days=7)

    with pytest.raises(ValueError, match="start_date cannot be after deadline"):
        ExamCreate(
            start_date=start_date,
            deadline=deadline,
            max_attempts=3,
            book_id=book.id,
            session_id=session.id,
        )


def test_get_exam(db: Session) -> None:
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

    stored_exam = crud.get_exam(session=db, exam_id=exam.id)
    assert stored_exam
    assert stored_exam.id == exam.id


def test_get_exams_by_session(db: Session) -> None:
    book = create_random_book(db)
    session = create_random_session(db)

    # Create multiple exams for the same session
    for i in range(2):
        exam_in = ExamCreate(
            start_date=date.today() + timedelta(days=i * 7),
            deadline=date.today() + timedelta(days=(i + 1) * 7),
            max_attempts=3,
            book_id=book.id,
            session_id=session.id,
        )
        crud.create_exam(session=db, exam_in=exam_in)

    exams = crud.get_exams_by_session(
        session=db, session_id=session.id, skip=0, limit=10
    )
    assert len(exams) >= 2


def test_get_exams_by_book(db: Session) -> None:
    book = create_random_book(db)
    session = create_random_session(db)

    # Create multiple exams for the same book
    for i in range(2):
        exam_in = ExamCreate(
            start_date=date.today() + timedelta(days=i * 7),
            deadline=date.today() + timedelta(days=(i + 1) * 7),
            max_attempts=3,
            book_id=book.id,
            session_id=session.id,
        )
        crud.create_exam(session=db, exam_in=exam_in)

    exams = crud.get_exams_by_book(session=db, book_id=book.id, skip=0, limit=10)
    assert len(exams) >= 2


def test_create_exam_attempt(db: Session) -> None:
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
        observation="Good performance",
        passed=True,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = crud.create_exam_attempt(session=db, attempt_in=attempt_in)
    assert attempt.passed is True
    assert attempt.exam_id == exam.id
    assert attempt.student_id == student.id
    assert attempt.examiner_id == examiner.id


def test_update_exam_invalid_model(db: Session) -> None:
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

    # Try to update with start_date after deadline
    exam_update = ExamUpdate(
        start_date=date.today() + timedelta(days=10),
        deadline=date.today() + timedelta(days=7),
    )
    with pytest.raises(ValueError, match="start_date cannot be after deadline"):
        crud.update_exam(session=db, db_exam=exam, exam_in=exam_update)

    # Try to update with start_date after deadline
    exam_update = ExamUpdate(
        start_date=date.today() + timedelta(days=8),
    )
    with pytest.raises(ValueError, match="start_date cannot be after deadline"):
        crud.update_exam(session=db, db_exam=exam, exam_in=exam_update)


def test_get_exam_attempts_by_exam(db: Session) -> None:
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

    # Create multiple attempts
    for i in range(2):
        attempt_in = ExamAttemptCreate(
            observation=f"Attempt {i+1}",
            passed=i == 1,  # Second attempt passes
            exam_id=exam.id,
            student_id=student.id,
            examiner_id=examiner.id,
        )
        crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    attempts = crud.get_exam_attempts_by_exam(
        session=db, exam_id=exam.id, skip=0, limit=10
    )
    assert len(attempts) >= 2


def test_get_student_attempts_for_exam(db: Session) -> None:
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

    # Create attempts for this student
    for i in range(2):
        attempt_in = ExamAttemptCreate(
            observation=f"Attempt {i+1}",
            passed=False,
            exam_id=exam.id,
            student_id=student.id,
            examiner_id=examiner.id,
        )
        crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    attempts = crud.get_student_attempts_for_exam(
        session=db, exam_id=exam.id, student_id=student.id
    )
    assert len(attempts) == 2


def test_delete_exam(db: Session) -> None:
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

    result = crud.delete_exam(session=db, exam_id=exam.id)
    assert result is True

    deleted_exam = crud.get_exam(session=db, exam_id=exam.id)
    assert deleted_exam is None
