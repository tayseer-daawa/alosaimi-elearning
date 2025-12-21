from sqlmodel import Session

from app import crud
from app.models import ProgramCreate, ProgramUpdate
from tests.utils.utils import random_lower_string


def test_create_program(db: Session) -> None:
    title = f"Program {random_lower_string()}"
    days_of_study = ["Sunday", "Monday", "Wednesday"]
    program_in = ProgramCreate(title=title, days_of_study=days_of_study)
    program = crud.create_program(session=db, program_in=program_in)
    assert program.title == title
    assert program.days_of_study == days_of_study
    assert program.id is not None


def test_get_program(db: Session) -> None:
    title = f"Program {random_lower_string()}"
    days_of_study = ["Sunday", "Monday"]
    program_in = ProgramCreate(title=title, days_of_study=days_of_study)
    program = crud.create_program(session=db, program_in=program_in)

    stored_program = crud.get_program(session=db, program_id=program.id)
    assert stored_program
    assert stored_program.id == program.id
    assert stored_program.title == title


def test_update_program(db: Session) -> None:
    title = f"Program {random_lower_string()}"
    days_of_study = ["Sunday", "Monday"]
    program_in = ProgramCreate(title=title, days_of_study=days_of_study)
    program = crud.create_program(session=db, program_in=program_in)

    new_title = f"Updated {random_lower_string()}"
    program_update = ProgramUpdate(title=new_title)
    updated_program = crud.update_program(
        session=db, db_program=program, program_in=program_update
    )
    assert updated_program.id == program.id
    assert updated_program.title == new_title


def test_delete_program(db: Session) -> None:
    title = f"Program {random_lower_string()}"
    days_of_study = ["Sunday"]
    program_in = ProgramCreate(title=title, days_of_study=days_of_study)
    program = crud.create_program(session=db, program_in=program_in)

    result = crud.delete_program(session=db, program_id=program.id)
    assert result is True

    deleted_program = crud.get_program(session=db, program_id=program.id)
    assert deleted_program is None


def test_get_programs(db: Session) -> None:
    # Create multiple programs
    for i in range(3):
        title = f"Program {i} {random_lower_string()}"
        program_in = ProgramCreate(title=title, days_of_study=["Sunday"])
        crud.create_program(session=db, program_in=program_in)

    programs = crud.get_programs(session=db, skip=0, limit=10)
    assert len(programs) >= 3
