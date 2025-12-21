from datetime import date, timedelta

from sqlmodel import Session

from app import crud
from app.models import SessionCreate, SessionUpdate
from tests.utils.program import create_random_program
from tests.utils.user import create_random_user


def test_create_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)
    assert session.start_date == start_date
    assert session.program_id == program.id
    assert session.id is not None


def test_get_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    stored_session = crud.get_session(session=db, session_id=session.id)
    assert stored_session
    assert stored_session.id == session.id


def test_update_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    new_date = date.today() + timedelta(days=7)
    session_update = SessionUpdate(start_date=new_date)
    updated_session = crud.update_session(
        session=db, db_session=session, session_in=session_update
    )
    assert updated_session.id == session.id
    assert updated_session.start_date == new_date


def test_add_student_to_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    user = create_random_user(db)
    updated_session = crud.add_student_to_session(
        session=db, session_id=session.id, user_id=user.id
    )
    assert updated_session is not None
    db.refresh(updated_session)
    assert len(updated_session.students) == 1


def test_remove_student_from_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    user = create_random_user(db)
    crud.add_student_to_session(session=db, session_id=session.id, user_id=user.id)

    updated_session = crud.remove_student_from_session(
        session=db, session_id=session.id, user_id=user.id
    )
    assert updated_session is not None
    db.refresh(updated_session)
    assert len(updated_session.students) == 0


def test_add_teacher_to_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    user = create_random_user(db)
    updated_session = crud.add_teacher_to_session(
        session=db, session_id=session.id, user_id=user.id
    )
    assert updated_session is not None
    db.refresh(updated_session)
    assert len(updated_session.teachers) == 1


def test_remove_teacher_from_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    user = create_random_user(db)
    crud.add_teacher_to_session(session=db, session_id=session.id, user_id=user.id)

    updated_session = crud.remove_teacher_from_session(
        session=db, session_id=session.id, user_id=user.id
    )
    assert updated_session is not None
    db.refresh(updated_session)
    assert len(updated_session.teachers) == 0


def test_delete_session(db: Session) -> None:
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    session = crud.create_session(session=db, session_in=session_in)

    result = crud.delete_session(session=db, session_id=session.id)
    assert result is True

    deleted_session = crud.get_session(session=db, session_id=session.id)
    assert deleted_session is None


def test_get_sessions_by_program(db: Session) -> None:
    program = create_random_program(db)

    # Create multiple sessions for the same program
    for i in range(2):
        start_date = date.today() + timedelta(days=i * 7)
        session_in = SessionCreate(start_date=start_date, program_id=program.id)
        crud.create_session(session=db, session_in=session_in)

    sessions = crud.get_sessions_by_program(
        session=db, program_id=program.id, skip=0, limit=10
    )
    assert len(sessions) >= 2
