import uuid

from sqlmodel import Session, col, func, select

from app.crud.utils import validate_update_model
from app.models import Phase, PhaseBook, PhaseCreate, PhaseUpdate


def create_phase(*, session: Session, phase_in: PhaseCreate) -> Phase:
    """Create a new phase"""
    db_obj = Phase.model_validate(phase_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_phase(*, session: Session, phase_id: uuid.UUID) -> Phase | None:
    """Get a phase by ID"""
    return session.get(Phase, phase_id)


def get_phases_by_program(
    *, session: Session, program_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Phase]:
    """Get phases for a specific program"""
    statement = (
        select(Phase)
        .where(Phase.program_id == program_id)
        .order_by(col(Phase.order))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_phase(*, session: Session, db_phase: Phase, phase_in: PhaseUpdate) -> Phase:
    """Update a phase"""
    phase_data = phase_in.model_dump(exclude_unset=True)
    validate_update_model(Phase, db_phase, phase_data)
    db_phase.sqlmodel_update(phase_data)
    session.add(db_phase)
    session.commit()
    session.refresh(db_phase)
    return db_phase


def delete_phase(*, session: Session, phase_id: uuid.UUID) -> bool:
    """Delete a phase"""
    db_obj = session.get(Phase, phase_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False


def add_book_to_phase(
    *,
    session: Session,
    phase_id: uuid.UUID,
    book_id: uuid.UUID,
    order: int | None = None,
) -> bool:
    """Add a book to a phase"""
    # If order not provided, calculate it based on existing books in the phase
    if order is None:
        order = (
            session.exec(
                select(func.coalesce(func.max(PhaseBook.order), -1)).where(
                    PhaseBook.phase_id == phase_id
                )
            ).one()
            + 1
        )

    # Add the relationship
    phase_book = PhaseBook(phase_id=phase_id, book_id=book_id, order=order)
    session.add(phase_book)
    session.commit()
    return True


def remove_book_from_phase(
    *, session: Session, phase_id: uuid.UUID, book_id: uuid.UUID
) -> bool:
    """Remove a book from a phase"""
    # Find the relationship
    phase_book = session.exec(
        select(PhaseBook).where(
            PhaseBook.phase_id == phase_id, PhaseBook.book_id == book_id
        )
    ).first()

    if phase_book:
        session.delete(phase_book)
        session.commit()
        return True
    return False
