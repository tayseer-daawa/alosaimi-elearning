import uuid

from sqlmodel import Session, col, select

from app.models import ExamAttempt, ExamAttemptCreate, ExamAttemptUpdate


def create_exam_attempt(
    *, session: Session, attempt_in: ExamAttemptCreate
) -> ExamAttempt:
    """Create a new exam attempt"""
    db_obj = ExamAttempt.model_validate(attempt_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_exam_attempt(*, session: Session, attempt_id: uuid.UUID) -> ExamAttempt | None:
    """Get an exam attempt by ID"""
    return session.get(ExamAttempt, attempt_id)


def get_exam_attempts_by_exam(
    *, session: Session, exam_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[ExamAttempt]:
    """Get exam attempts for a specific exam"""
    statement = (
        select(ExamAttempt)
        .where(ExamAttempt.exam_id == exam_id)
        .order_by(col(ExamAttempt.attempt_date))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_exam_attempts_by_student(
    *, session: Session, student_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[ExamAttempt]:
    """Get exam attempts for a specific student"""
    statement = (
        select(ExamAttempt)
        .where(ExamAttempt.student_id == student_id)
        .order_by(col(ExamAttempt.attempt_date))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_student_attempts_for_exam(
    *, session: Session, exam_id: uuid.UUID, student_id: uuid.UUID
) -> list[ExamAttempt]:
    """Get all attempts for a specific student on a specific exam"""
    statement = (
        select(ExamAttempt)
        .where(ExamAttempt.exam_id == exam_id, ExamAttempt.student_id == student_id)
        .order_by(col(ExamAttempt.attempt_date))
    )
    return list(session.exec(statement).all())


def update_exam_attempt(
    *, session: Session, db_attempt: ExamAttempt, attempt_in: ExamAttemptUpdate
) -> ExamAttempt:
    """Update an exam attempt"""
    attempt_data = attempt_in.model_dump(exclude_unset=True)
    db_attempt.sqlmodel_update(attempt_data)
    session.add(db_attempt)
    session.commit()
    session.refresh(db_attempt)
    return db_attempt


def delete_exam_attempt(*, session: Session, attempt_id: uuid.UUID) -> bool:
    """Delete an exam attempt"""
    db_obj = session.get(ExamAttempt, attempt_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
