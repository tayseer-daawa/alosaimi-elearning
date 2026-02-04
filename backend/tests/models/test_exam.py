import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session
from datetime import date, timedelta

from app.models import Exam
from tests.utils.book import create_random_book
from tests.utils.session import create_random_session


def test_exam_db_constraint_integrity_error(db: Session):
    book = create_random_book(db)
    session = create_random_session(db)
    # Intentionally create invalid Exam (start_date > deadline)
    exam = Exam(
        start_date=date.today() + timedelta(days=2),
        deadline=date.today(),
        max_attempts=1,
        book_id=book.id,
        session_id=session.id,
    )
    db.add(exam)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
