import uuid

from sqlmodel import Session, select

from app.models import Lesson, LessonCreate, LessonUpdate


def create_lesson(*, session: Session, lesson_in: LessonCreate) -> Lesson:
    """Create a new lesson"""
    db_obj = Lesson.model_validate(lesson_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_lesson(*, session: Session, lesson_id: uuid.UUID) -> Lesson | None:
    """Get a lesson by ID"""
    return session.get(Lesson, lesson_id)


def get_lessons_by_book(
    *, session: Session, book_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Lesson]:
    """Get lessons for a specific book, ordered by lesson order"""
    statement = (
        select(Lesson)
        .where(Lesson.book_id == book_id)
        .order_by(Lesson.order)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_lesson(
    *, session: Session, db_lesson: Lesson, lesson_in: LessonUpdate
) -> Lesson:
    """Update a lesson"""
    lesson_data = lesson_in.model_dump(exclude_unset=True)
    db_lesson.sqlmodel_update(lesson_data)
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson


def delete_lesson(*, session: Session, lesson_id: uuid.UUID) -> bool:
    """Delete a lesson"""
    db_obj = session.get(Lesson, lesson_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
