import uuid

from sqlmodel import Session, select

from app.models import Session as SessionModel
from app.models import SessionCreate, SessionUpdate, User


def create_session(*, session: Session, session_in: SessionCreate) -> SessionModel:
    """Create a new session"""
    db_obj = SessionModel.model_validate(session_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_session(*, session: Session, session_id: uuid.UUID) -> SessionModel | None:
    """Get a session by ID"""
    return session.get(SessionModel, session_id)


def get_sessions(
    *, session: Session, skip: int = 0, limit: int = 100
) -> list[SessionModel]:
    """Get list of sessions"""
    statement = select(SessionModel).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_sessions_by_program(
    *, session: Session, program_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[SessionModel]:
    """Get sessions for a specific program"""
    statement = (
        select(SessionModel)
        .where(SessionModel.program_id == program_id)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_session(
    *, session: Session, db_session: SessionModel, session_in: SessionUpdate
) -> SessionModel:
    """Update a session"""
    session_data = session_in.model_dump(exclude_unset=True)
    db_session.sqlmodel_update(session_data)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


def delete_session(*, session: Session, session_id: uuid.UUID) -> bool:
    """Delete a session"""
    db_obj = session.get(SessionModel, session_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False


def add_student_to_session(
    *, session: Session, session_id: uuid.UUID, user_id: uuid.UUID
) -> SessionModel | None:
    """Add a student to a session"""
    db_session = session.get(SessionModel, session_id)
    db_user = session.get(User, user_id)
    if db_session and db_user:
        if db_user not in db_session.students:
            db_session.students.append(db_user)
            session.add(db_session)
            session.commit()
            session.refresh(db_session)
        return db_session
    return None


def remove_student_from_session(
    *, session: Session, session_id: uuid.UUID, user_id: uuid.UUID
) -> SessionModel | None:
    """Remove a student from a session"""
    db_session = session.get(SessionModel, session_id)
    db_user = session.get(User, user_id)
    if db_session and db_user and db_user in db_session.students:
        db_session.students.remove(db_user)
        session.add(db_session)
        session.commit()
        session.refresh(db_session)
        return db_session
    return None


def add_teacher_to_session(
    *, session: Session, session_id: uuid.UUID, user_id: uuid.UUID
) -> SessionModel | None:
    """Add a teacher to a session"""
    db_session = session.get(SessionModel, session_id)
    db_user = session.get(User, user_id)
    if db_session and db_user:
        if db_user not in db_session.teachers:
            db_session.teachers.append(db_user)
            session.add(db_session)
            session.commit()
            session.refresh(db_session)
        return db_session
    return None


def remove_teacher_from_session(
    *, session: Session, session_id: uuid.UUID, user_id: uuid.UUID
) -> SessionModel | None:
    """Remove a teacher from a session"""
    db_session = session.get(SessionModel, session_id)
    db_user = session.get(User, user_id)
    if db_session and db_user and db_user in db_session.teachers:
        db_session.teachers.remove(db_user)
        session.add(db_session)
        session.commit()
        session.refresh(db_session)
        return db_session
    return None
