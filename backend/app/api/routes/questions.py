import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep, get_current_admin_or_superuser
from app.models import (
    Message,
    Question,
    QuestionCreate,
    QuestionPublic,
    QuestionsPublic,
    QuestionUpdate,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get(
    "/",
    response_model=QuestionsPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def read_questions(
    session: SessionDep, skip: int = 0, limit: int = Query(default=100, le=500)
):
    """
    Retrieve all questions.

    Only admins are supposed to read all questions.
    """
    count_statement = select(func.count()).select_from(Question)
    count = session.exec(count_statement).one()

    statement = select(Question).offset(skip).limit(limit)
    questions = session.exec(statement).all()

    return QuestionsPublic(data=questions, count=count)


# For guest users as well
@router.get("/lesson/{lesson_id}", response_model=QuestionsPublic)
def read_questions_by_lesson(
    session: SessionDep,
    lesson_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Retrieve questions for a specific lesson.
    """
    questions = crud.get_questions_by_lesson(
        session=session, lesson_id=lesson_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count())
        .select_from(Question)
        .where(Question.lesson_id == lesson_id)
    )
    count = session.exec(count_statement).one()
    return QuestionsPublic(data=questions, count=count)


# For guest users as well
@router.get("/{question_id}", response_model=QuestionPublic)
def read_question(session: SessionDep, question_id: uuid.UUID):
    """
    Get question by ID.
    """
    question = crud.get_question(session=session, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post(
    "/",
    response_model=QuestionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_question(*, session: SessionDep, question_in: QuestionCreate):
    """
    Create new question.

    Only admins can create questions.
    """
    # Verify lesson exists
    lesson = crud.get_lesson(session=session, lesson_id=question_in.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    question = crud.create_question(session=session, question_in=question_in)
    return question


@router.patch(
    "/{question_id}",
    response_model=QuestionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_question(
    *,
    session: SessionDep,
    question_id: uuid.UUID,
    question_in: QuestionUpdate,
):
    """
    Update a question.

    Only admins can update questions.
    """
    question = crud.get_question(session=session, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question = crud.update_question(
        session=session, db_question=question, question_in=question_in
    )
    return question


@router.delete(
    "/{question_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_question(session: SessionDep, question_id: uuid.UUID):
    """
    Delete a question.

    Only admins can delete questions.
    """
    success = crud.delete_question(session=session, question_id=question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")

    return Message(message="Question deleted successfully")
