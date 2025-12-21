import uuid

from sqlmodel import Session, select

from app.models import Question, QuestionCreate, QuestionUpdate


def create_question(*, session: Session, question_in: QuestionCreate) -> Question:
    """Create a new question"""
    db_obj = Question.model_validate(question_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_question(*, session: Session, question_id: uuid.UUID) -> Question | None:
    """Get a question by ID"""
    return session.get(Question, question_id)


def get_questions_by_lesson(
    *, session: Session, lesson_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Question]:
    """Get questions for a specific lesson"""
    statement = (
        select(Question)
        .where(Question.lesson_id == lesson_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_question(
    *, session: Session, db_question: Question, question_in: QuestionUpdate
) -> Question:
    """Update a question"""
    question_data = question_in.model_dump(exclude_unset=True)
    db_question.sqlmodel_update(question_data)
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def delete_question(*, session: Session, question_id: uuid.UUID) -> bool:
    """Delete a question"""
    db_obj = session.get(Question, question_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
