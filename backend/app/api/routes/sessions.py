import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    SessionDep,
    get_current_admin_or_superuser,
    get_current_teacher_or_admin,
)
from app.models import (
    Message,
    SessionCreate,
    SessionEvent,
    SessionEventCreate,
    SessionEventPublic,
    SessionEventsPublic,
    SessionPublic,
    SessionsPublic,
    SessionUpdate,
)
from app.models import (
    Session as SessionModel,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


# For guest users as well
@router.get("/", response_model=SessionsPublic)
def read_sessions(
    session: SessionDep, skip: int = 0, limit: int = Query(default=100, le=500)
):
    """
    Retrieve sessions.
    """
    count_statement = select(func.count()).select_from(SessionModel)
    count = session.exec(count_statement).one()
    sessions = crud.get_sessions(session=session, skip=skip, limit=limit)
    return SessionsPublic(data=sessions, count=count)


# For guest users as well
@router.get("/program/{program_id}", response_model=SessionsPublic)
def read_sessions_by_program(
    session: SessionDep,
    program_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Retrieve sessions for a specific program.
    """
    sessions = crud.get_sessions_by_program(
        session=session, program_id=program_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count())
        .select_from(SessionModel)
        .where(SessionModel.program_id == program_id)
    )
    count = session.exec(count_statement).one()
    return SessionsPublic(data=sessions, count=count)


# For guest users as well
@router.get("/{session_id}", response_model=SessionPublic)
def read_session(session: SessionDep, session_id: uuid.UUID):
    """
    Get session by ID.
    """
    db_session = crud.get_session(session=session, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.post(
    "/",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_session(*, session: SessionDep, session_in: SessionCreate):
    """
    Create new session.

    Only admins can create sessions.
    """
    # Verify program exists
    program = crud.get_program(session=session, program_id=session_in.program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    db_session = crud.create_session(session=session, session_in=session_in)
    return db_session


@router.patch(
    "/{session_id}",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_session(
    *,
    session: SessionDep,
    session_id: uuid.UUID,
    session_in: SessionUpdate,
):
    """
    Update a session.

    Only admins can update sessions.
    """
    db_session = crud.get_session(session=session, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session = crud.update_session(
        session=session, db_session=db_session, session_in=session_in
    )
    return db_session


@router.delete(
    "/{session_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_session(session: SessionDep, session_id: uuid.UUID):
    """
    Delete a session.

    Only admins can delete sessions.
    """
    success = crud.delete_session(session=session, session_id=session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    return Message(message="Session deleted successfully")


# Student enrollment endpoints
@router.post(
    "/{session_id}/students/{user_id}",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def add_student_to_session(
    session: SessionDep,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
):
    """
    Add a student to a session.

    Only admins can enroll students.
    """
    db_session = crud.add_student_to_session(
        session=session, session_id=session_id, user_id=user_id
    )
    if not db_session:
        raise HTTPException(status_code=404, detail="Session or User not found")

    return db_session


@router.delete(
    "/{session_id}/students/{user_id}",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def remove_student_from_session(
    session: SessionDep,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
):
    """
    Remove a student from a session.

    Only admins can unenroll students.
    """
    db_session = crud.remove_student_from_session(
        session=session, session_id=session_id, user_id=user_id
    )
    if not db_session:
        raise HTTPException(
            status_code=404, detail="Session, User not found or not enrolled"
        )

    return db_session


# Teacher assignment endpoints
@router.post(
    "/{session_id}/teachers/{user_id}",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def add_teacher_to_session(
    session: SessionDep,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
):
    """
    Add a teacher to a session.

    Only admins can assign teachers.
    """
    db_session = crud.add_teacher_to_session(
        session=session, session_id=session_id, user_id=user_id
    )
    if not db_session:
        raise HTTPException(status_code=404, detail="Session or User not found")

    return db_session


@router.delete(
    "/{session_id}/teachers/{user_id}",
    response_model=SessionPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def remove_teacher_from_session(
    session: SessionDep,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
):
    """
    Remove a teacher from a session.

    Only admins can remove teachers.
    """
    db_session = crud.remove_teacher_from_session(
        session=session, session_id=session_id, user_id=user_id
    )
    if not db_session:
        raise HTTPException(
            status_code=404, detail="Session, User not found or not assigned"
        )

    return db_session


# Session Events endpoints
@router.get("/{session_id}/events", response_model=SessionEventsPublic)
def read_session_events(
    session: SessionDep,
    session_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Get all events for a session.
    """
    events = crud.get_session_events_by_session(
        session=session, session_id=session_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count())
        .select_from(SessionEvent)
        .where(SessionEvent.session_id == session_id)
    )
    count = session.exec(count_statement).one()
    return SessionEventsPublic(data=events, count=count)


@router.get("/{session_id}/lessons", response_model=SessionEventsPublic)
def read_session_lessons(
    session: SessionDep,
    session_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Get all lessons for a session.
    """
    events = crud.get_session_events_by_session(
        session=session, session_id=session_id, skip=skip, limit=limit, is_break=False
    )
    count_statement = (
        select(func.count())
        .select_from(SessionEvent)
        .where(SessionEvent.session_id == session_id)
        .where(not SessionEvent.is_break)
    )
    count = session.exec(count_statement).one()
    return SessionEventsPublic(data=events, count=count)


@router.get("/{session_id}/breaks", response_model=SessionEventsPublic)
def read_session_breaks(
    session: SessionDep,
    session_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
):
    """
    Get all breaks for a session.
    """
    events = crud.get_session_events_by_session(
        session=session, session_id=session_id, skip=skip, limit=limit, is_break=True
    )
    count_statement = (
        select(func.count())
        .select_from(SessionEvent)
        .where(SessionEvent.session_id == session_id)
        .where(SessionEvent.is_break)
    )
    count = session.exec(count_statement).one()
    return SessionEventsPublic(data=events, count=count)


@router.post(
    "/{session_id}/events",
    response_model=SessionEventPublic,
    dependencies=[Depends(get_current_teacher_or_admin)],
)
def create_session_event(
    *,
    session: SessionDep,
    session_id: uuid.UUID,
    event_in: SessionEventCreate,
):
    """
    Create a new session event.

    Only admins and teachers can create session events.
    """
    # Verify session exists
    db_session = crud.get_session(session=session, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify event belongs to this session
    if event_in.session_id != session_id:
        raise HTTPException(status_code=400, detail="Event session_id mismatch")

    event = crud.create_session_event(session=session, event_in=event_in)
    return event
