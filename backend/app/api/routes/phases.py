import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep, get_current_admin_or_superuser
from app.models import (
    Message,
    Phase,
    PhaseCreate,
    PhasePublic,
    PhasesPublic,
    PhaseUpdate,
)

router = APIRouter(prefix="/phases", tags=["phases"])


@router.get("/", response_model=PhasesPublic)
def read_phases(
    session: SessionDep, skip: int = 0, limit: int = Query(default=100, le=500)
) -> PhasesPublic:
    """
    Retrieve all phases.
    """
    count_statement = select(func.count()).select_from(Phase)
    count = session.exec(count_statement).one()

    statement = select(Phase).offset(skip).limit(limit)
    phases = session.exec(statement).all()

    return PhasesPublic(data=phases, count=count)


@router.get("/program/{program_id}", response_model=PhasesPublic)
def read_phases_by_program(
    session: SessionDep,
    program_id: uuid.UUID,
    skip: int = 0,
    limit: int = Query(default=100, le=500),
) -> PhasesPublic:
    """
    Retrieve phases for a specific program (ordered by phase order).
    """
    phases = crud.get_phases_by_program(
        session=session, program_id=program_id, skip=skip, limit=limit
    )
    count_statement = (
        select(func.count()).select_from(Phase).where(Phase.program_id == program_id)
    )
    count = session.exec(count_statement).one()
    return PhasesPublic(data=phases, count=count)


@router.get("/{phase_id}", response_model=PhasePublic)
def read_phase(session: SessionDep, phase_id: uuid.UUID) -> Phase:
    """
    Get phase by ID.
    """
    phase = crud.get_phase(session=session, phase_id=phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return phase


@router.post(
    "/",
    response_model=PhasePublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_phase(*, session: SessionDep, phase_in: PhaseCreate) -> Phase:
    """
    Create new phase.

    Only admins can create phases.
    """
    # Verify program exists
    program = crud.get_program(session=session, program_id=phase_in.program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    try:
        phase = crud.create_phase(session=session, phase_in=phase_in)
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail=f"Phase with order {phase_in.order} already exists for this program",
        )
    return phase


@router.patch(
    "/{phase_id}",
    response_model=PhasePublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_phase(
    *,
    session: SessionDep,
    phase_id: uuid.UUID,
    phase_in: PhaseUpdate,
) -> Phase:
    """
    Update a phase.

    Only admins can update phases.
    """
    phase = crud.get_phase(session=session, phase_id=phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    phase = crud.update_phase(session=session, db_phase=phase, phase_in=phase_in)
    return phase


@router.delete(
    "/{phase_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_phase(session: SessionDep, phase_id: uuid.UUID) -> Message:
    """
    Delete a phase.

    Only admins can delete phases.
    """
    success = crud.delete_phase(session=session, phase_id=phase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Phase not found")

    return Message(message="Phase deleted successfully")


@router.post(
    "/{phase_id}/books/{book_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def add_book_to_phase(
    session: SessionDep,
    phase_id: uuid.UUID,
    book_id: uuid.UUID,
    order: int | None = None,
) -> Message:
    """
    Add a book to a phase.

    Only admins can manage phase books.
    """
    # Verify phase and book exist
    phase = crud.get_phase(session=session, phase_id=phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    book = crud.get_book(session=session, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        success = crud.add_book_to_phase(
            session=session,
            phase_id=phase_id,
            book_id=book_id,
            order=order,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail=f"A book with order {order} already exists in the phase",
        )
    if not success:
        raise HTTPException(status_code=400, detail="Book already in phase")

    return Message(message="Book added to phase successfully")


@router.delete(
    "/{phase_id}/books/{book_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def remove_book_from_phase(
    session: SessionDep,
    phase_id: uuid.UUID,
    book_id: uuid.UUID,
) -> Message:
    """
    Remove a book from a phase.

    Only admins can manage phase books.
    """
    success = crud.remove_book_from_phase(
        session=session, phase_id=phase_id, book_id=book_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Book not found in phase")

    return Message(message="Book removed from phase successfully")
