import uuid

from sqlmodel import Session, select

from app.models import Program, ProgramCreate, ProgramUpdate


def create_program(*, session: Session, program_in: ProgramCreate) -> Program:
    """Create a new program"""
    db_obj = Program.model_validate(program_in)
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
