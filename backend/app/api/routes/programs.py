import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep, get_current_admin_or_superuser
from app.models import (
    Message,
    Program,
    ProgramCreate,
    ProgramPublic,
    ProgramsPublic,
    ProgramUpdate,
)

router = APIRouter(prefix="/programs", tags=["programs"])


# For guest users as well
@router.get("/", response_model=ProgramsPublic)
def read_programs(
    session: SessionDep, skip: int = 0, limit: int = Query(default=100, le=500)
) -> ProgramsPublic:
    """
    Retrieve programs.
    """
    count_statement = select(func.count()).select_from(Program)
    count = session.exec(count_statement).one()
    programs = crud.get_programs(session=session, skip=skip, limit=limit)
    return ProgramsPublic.from_programs(programs, count)


# For guest users as well
@router.get("/{program_id}", response_model=ProgramPublic)
def read_program(session: SessionDep, program_id: uuid.UUID) -> ProgramPublic:
    """
    Get program by ID.
    """
    program = crud.get_program(session=session, program_id=program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return ProgramPublic.from_program(program)


@router.post(
    "/",
    response_model=ProgramPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_program(*, session: SessionDep, program_in: ProgramCreate) -> ProgramPublic:
    """
    Create new program.

    Only admins can create programs.
    """
    program = crud.create_program(session=session, program_in=program_in)
    return ProgramPublic.from_program(program)


@router.patch(
    "/{program_id}",
    response_model=ProgramPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_program(
    *,
    session: SessionDep,
    program_id: uuid.UUID,
    program_in: ProgramUpdate,
) -> ProgramPublic:
    """
    Update a program.

    Only admins can update programs.
    """
    program = crud.get_program(session=session, program_id=program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    program = crud.update_program(
        session=session, db_program=program, program_in=program_in
    )
    return ProgramPublic.from_program(program)


@router.delete(
    "/{program_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_program(session: SessionDep, program_id: uuid.UUID) -> Message:
    """
    Delete a program.

    Only admins can delete programs.
    """
    success = crud.delete_program(session=session, program_id=program_id)
    if not success:
        raise HTTPException(status_code=404, detail="Program not found")

    return Message(message="Program deleted successfully")
