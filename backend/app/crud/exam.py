import uuid

from sqlmodel import Session, select

from app.crud.utils import validate_update_model
from app.models import Exam, ExamCreate, ExamUpdate


def create_exam(*, session: Session, exam_in: ExamCreate) -> Exam:
    """Create a new exam"""
    db_obj = Exam.model_validate(exam_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_exam(*, session: Session, exam_id: uuid.UUID) -> Exam | None:
    """Get an exam by ID"""
    return session.get(Exam, exam_id)


def get_exams_by_session(
    *, session: Session, session_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Exam]:
    """Get exams for a specific session"""
    statement = (
        select(Exam).where(Exam.session_id == session_id).offset(skip).limit(limit)
    )
    return list(session.exec(statement).all())


def get_exams_by_book(
    *, session: Session, book_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Exam]:
    """Get exams for a specific book"""
    statement = select(Exam).where(Exam.book_id == book_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_exam(*, session: Session, db_exam: Exam, exam_in: ExamUpdate) -> Exam:
    """Update an exam"""
    exam_data = exam_in.model_dump(exclude_unset=True)
    validate_update_model(Exam, db_exam, exam_data)
    db_exam.sqlmodel_update(exam_data)
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam


def delete_exam(*, session: Session, exam_id: uuid.UUID) -> bool:
    """Delete an exam"""
    db_obj = session.get(Exam, exam_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
