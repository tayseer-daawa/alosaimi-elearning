import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    ExamAttemptIDCurrentExaminer,
    ExamIDCurrentTeacher,
    ExamIDCurrentUser,
    SessionDep,
    SessionIDCurrentUser,
    get_current_admin_or_superuser,
)
from app.models import (
    Exam,
    ExamAttemptCreate,
    ExamAttemptPublic,
    ExamAttemptsPublic,
    ExamAttemptUpdate,
    ExamCreate,
    ExamPublic,
    ExamsPublic,
    ExamUpdate,
    Message,
)
from app.models.user import User

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("/session/{session_id}", response_model=ExamsPublic)
def read_exams_by_session(
    session: SessionDep,
    session_id: SessionIDCurrentUser,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Retrieve exams for a specific session.

    You must be enrolled or teaching the session.
    """
    exams = crud.get_exams_by_session(
        session=session, session_id=session_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count()).select_from(Exam).where(Exam.session_id == session_id)
    )
    count = session.exec(count_statement).one()
    return ExamsPublic(data=exams, count=count)


@router.get("/{exam_id}", response_model=ExamPublic)
def read_exam(session: SessionDep, exam_id: ExamIDCurrentUser):
    """
    Get exam by ID.

    You must be enrolled or teaching the session for this exam.
    """
    exam = crud.get_exam(session=session, exam_id=exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.post(
    "/",
    response_model=ExamPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_exam(*, session: SessionDep, exam_in: ExamCreate):
    """
    Create new exam.

    Only admins can create exams.
    """
    # Verify book and session exist
    book = crud.get_book(session=session, book_id=exam_in.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    db_session = crud.get_session(session=session, session_id=exam_in.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    exam = crud.create_exam(session=session, exam_in=exam_in)
    return exam


@router.patch(
    "/{exam_id}",
    response_model=ExamPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_exam(
    *,
    session: SessionDep,
    exam_id: uuid.UUID,
    exam_in: ExamUpdate,
):
    """
    Update an exam.

    Only admins can update exams.
    """
    exam = crud.get_exam(session=session, exam_id=exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam = crud.update_exam(session=session, db_exam=exam, exam_in=exam_in)
    return exam


@router.delete(
    "/{exam_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_exam(session: SessionDep, exam_id: uuid.UUID):
    """
    Delete an exam.

    Only admins can delete exams.
    """
    success = crud.delete_exam(session=session, exam_id=exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exam not found")

    return Message(message="Exam deleted successfully")


# Exam Attempts endpoints
@router.get(
    "/{exam_id}/attempts/student/{student_id}",
    response_model=ExamAttemptsPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def read_student_exam_attempts(
    session: SessionDep,
    exam_id: uuid.UUID,
    student_id: uuid.UUID,
):
    """
    Get attempts for a specific student on a specific exam.

    Only admins can see student's attempts.
    """
    attempts = crud.get_student_attempts_for_exam(
        session=session, exam_id=exam_id, student_id=student_id
    )
    return ExamAttemptsPublic(data=attempts, count=len(attempts))


@router.get(
    "/{exam_id}/attempts",
    response_model=ExamAttemptsPublic,
)
def read_my_exam_attempts(
    session: SessionDep,
    current_user: CurrentUser,
    exam_id: uuid.UUID,
):
    """
    Get current user's attempts for a specific exam.
    """
    attempts = crud.get_student_attempts_for_exam(
        session=session, exam_id=exam_id, student_id=current_user.id
    )
    return ExamAttemptsPublic(data=attempts, count=len(attempts))


@router.post(
    "/{exam_id}/attempts",
    response_model=ExamAttemptPublic,
)
def create_exam_attempt(
    *,
    session: SessionDep,
    exam_id: ExamIDCurrentTeacher,
    attempt_in: ExamAttemptCreate,
):
    """
    Create a new exam attempt.

    Teachers and admins can create attempts.
    """
    # Verify exam exists
    exam = crud.get_exam(session=session, exam_id=exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Verify it's still time for the exam
    now = date.today()
    if now < exam.start_date or now > exam.deadline:
        raise HTTPException(
            status_code=400,
            detail=f"Exam can only be taken between {exam.start_date} and {exam.deadline}",
        )

    # Verify attempt belongs to this exam
    if attempt_in.exam_id != exam_id:
        raise HTTPException(status_code=400, detail="Attempt exam_id mismatch")

    # Verify user is enrolled in the session
    student = session.get(User, attempt_in.student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    if exam.session not in student.student_sessions:
        raise HTTPException(
            status_code=400, detail="Student isn't enrolled in the exam's session"
        )

    # Check max attempts
    existing_attempts = crud.get_student_attempts_for_exam(
        session=session, exam_id=exam_id, student_id=attempt_in.student_id
    )
    if len(existing_attempts) >= exam.max_attempts:
        raise HTTPException(
            status_code=400,
            detail=f"Student has reached maximum attempts ({exam.max_attempts})",
        )

    attempt = crud.create_exam_attempt(session=session, attempt_in=attempt_in)
    return attempt


@router.patch("/attempts/{attempt_id}", response_model=ExamAttemptPublic)
def update_exam_attempt(
    *,
    session: SessionDep,
    attempt_id: ExamAttemptIDCurrentExaminer,
    attempt_in: ExamAttemptUpdate,
):
    """
    Update an exam attempt.

    Only the examiner or admins can update attempts.
    """
    attempt = crud.get_exam_attempt(session=session, attempt_id=attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")

    attempt = crud.update_exam_attempt(
        session=session, db_attempt=attempt, attempt_in=attempt_in
    )
    return attempt
