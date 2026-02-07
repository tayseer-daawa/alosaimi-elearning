import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep, get_current_admin_or_superuser
from app.models import (
    Lesson,
    LessonCreate,
    LessonPublic,
    LessonsPublic,
    LessonUpdate,
    Message,
)

router = APIRouter(prefix="/lessons", tags=["lessons"])


# For guest users as well
@router.get("/book/{book_id}", response_model=LessonsPublic)
def read_lessons_by_book(
    session: SessionDep,
    book_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
) -> LessonsPublic:
    """
    Retrieve lessons for a specific book.
    """
    lessons = crud.get_lessons_by_book(
        session=session, book_id=book_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count()).select_from(Lesson).where(Lesson.book_id == book_id)
    )
    count = session.exec(count_statement).one()
    return LessonsPublic(data=lessons, count=count)


# For guest users as well
@router.get("/{lesson_id}", response_model=LessonPublic)
def read_lesson(session: SessionDep, lesson_id: uuid.UUID) -> Lesson:
    """
    Get lesson by ID.
    """
    lesson = crud.get_lesson(session=session, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post(
    "/",
    response_model=LessonPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_lesson(*, session: SessionDep, lesson_in: LessonCreate) -> Lesson:
    """
    Create new lesson.

    Only admins can create lessons.
    """
    # Verify book exists
    book = crud.get_book(session=session, book_id=lesson_in.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        lesson = crud.create_lesson(session=session, lesson_in=lesson_in)
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail=f"Lesson with order {lesson_in.order} already exists for this book",
        )
    return lesson


@router.patch(
    "/{lesson_id}",
    response_model=LessonPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_lesson(
    *,
    session: SessionDep,
    lesson_id: uuid.UUID,
    lesson_in: LessonUpdate,
) -> Lesson:
    """
    Update a lesson.

    Only admins can update lessons.
    """
    lesson = crud.get_lesson(session=session, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    try:
        lesson = crud.update_lesson(
            session=session, db_lesson=lesson, lesson_in=lesson_in
        )
        return lesson
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=ve.errors()[0]["msg"])


@router.delete(
    "/{lesson_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_lesson(session: SessionDep, lesson_id: uuid.UUID) -> Message:
    """
    Delete a lesson.

    Only admins can delete lessons.
    """
    success = crud.delete_lesson(session=session, lesson_id=lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return Message(message="Lesson deleted successfully")
