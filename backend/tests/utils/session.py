from datetime import date

from sqlmodel import Session

from app import crud
from app.models import Session as SessionModel
from app.models import SessionCreate
from tests.utils.program import create_random_program


def create_random_session(db: Session) -> SessionModel:
    """Create a random session for testing"""
    program = create_random_program(db)
    start_date = date.today()
    session_in = SessionCreate(start_date=start_date, program_id=program.id)
    return crud.create_session(session=db, session_in=session_in)
