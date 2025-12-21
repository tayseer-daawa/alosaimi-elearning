from sqlmodel import Session

from app import crud
from app.models import Program, ProgramCreate
from tests.utils.utils import random_lower_string


def create_random_program(db: Session) -> Program:
    """Create a random program for testing"""
    title = f"Program {random_lower_string()}"
    days_of_study = ["Sunday", "Monday", "Wednesday", "Thursday"]
    program_in = ProgramCreate(title=title, days_of_study=days_of_study)
    return crud.create_program(session=db, program_in=program_in)
