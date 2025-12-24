from datetime import date, timedelta

from sqlmodel import Session

from app import crud
from app.models import Exam, ExamCreate
from tests.utils.book import create_random_book
from tests.utils.session import create_random_session


def create_random_exam(db: Session) -> Exam:
    """Create a random exam for testing"""
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
    return crud.create_exam(session=db, exam_in=exam_in)


def create_exam_with_details(
    db: Session, start_date, deadline, max_attempts, book_id, session_id
):
    exam_in = ExamCreate(
        start_date=start_date,
        deadline=deadline,
        max_attempts=max_attempts,
        book_id=book_id,
        session_id=session_id,
    )
    return crud.create_exam(session=db, exam_in=exam_in)
