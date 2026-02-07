import uuid

from sqlmodel import Session, col, select

from app.crud.utils import validate_update_model
from app.models import (
    Book,
    Lesson,
    Phase,
    PhaseBook,
    Program,
    ProgramCreate,
    ProgramUpdate,
)
from app.models.program import days_list_to_bitmask


def create_program(*, session: Session, program_in: ProgramCreate) -> Program:
    """Create a new program"""
    data = program_in.model_dump()
    data["days_of_study"] = days_list_to_bitmask(data["days_of_study"])
    db_obj = Program.model_validate(data)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_program(*, session: Session, program_id: uuid.UUID) -> Program | None:
    """Get a program by ID"""
    return session.get(Program, program_id)


def get_programs(*, session: Session, skip: int = 0, limit: int = 100) -> list[Program]:
    """Get list of programs"""
    statement = select(Program).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_program(
    *, session: Session, db_program: Program, program_in: ProgramUpdate
) -> Program:
    """Update a program"""
    program_data = program_in.model_dump(exclude_unset=True)
    # convert from str representation to bitmask
    if "days_of_study" in program_data and program_data["days_of_study"] is not None:
        program_data["days_of_study"] = days_list_to_bitmask(
            program_data["days_of_study"]
        )
    validate_update_model(Program, db_program, program_data)
    db_program.sqlmodel_update(program_data)
    session.add(db_program)
    session.commit()
    session.refresh(db_program)
    return db_program


def delete_program(*, session: Session, program_id: uuid.UUID) -> bool:
    """Delete a program"""
    db_obj = session.get(Program, program_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False


def get_all_lessons(*, session: Session, program_id: uuid.UUID) -> list[Lesson]:
    statement = (
        select(Lesson)
        .join(Book)
        .join(PhaseBook)
        .join(Phase)
        .where(Phase.program_id == program_id)
        .order_by(col(Phase.order), col(PhaseBook.order), col(Lesson.order))
    )
    return list(session.exec(statement).all())
