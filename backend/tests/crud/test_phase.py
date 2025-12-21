from sqlmodel import Session

from app import crud
from app.models import PhaseCreate, PhaseUpdate
from tests.utils.book import create_random_book
from tests.utils.program import create_random_program


def test_create_phase(db: Session) -> None:
    program = create_random_program(db)

    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)
    assert phase.order == 1
    assert phase.program_id == program.id
    assert phase.id is not None


def test_get_phase(db: Session) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    stored_phase = crud.get_phase(session=db, phase_id=phase.id)
    assert stored_phase
    assert stored_phase.id == phase.id
    assert stored_phase.program_id == program.id


def test_get_phases_by_program(db: Session) -> None:
    program = create_random_program(db)

    # Create multiple phases for the same program
    for i in range(3):
        phase_in = PhaseCreate(order=i + 1, program_id=program.id)
        crud.create_phase(session=db, phase_in=phase_in)

    phases = crud.get_phases_by_program(
        session=db, program_id=program.id, skip=0, limit=10
    )
    assert len(phases) == 3
    # Verify they are ordered correctly
    assert phases[0].order == 1
    assert phases[1].order == 2
    assert phases[2].order == 3


def test_update_phase(db: Session) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    phase_in_update = PhaseUpdate(order=2)

    updated_phase = crud.update_phase(
        session=db, db_phase=phase, phase_in=phase_in_update
    )
    assert updated_phase.order == 2


def test_add_book_to_phase(db: Session) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book = create_random_book(db)

    result = crud.add_book_to_phase(session=db, phase_id=phase.id, book_id=book.id)
    assert result is True

    # Verify the book is associated with the phase
    db.refresh(phase)
    assert book in phase.books


def test_remove_book_from_phase(db: Session) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book = create_random_book(db)
    crud.add_book_to_phase(session=db, phase_id=phase.id, book_id=book.id)

    result = crud.remove_book_from_phase(session=db, phase_id=phase.id, book_id=book.id)
    assert result is True

    # Verify the book is no longer associated
    db.refresh(phase)
    assert book not in phase.books


def test_delete_phase(db: Session) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    result = crud.delete_phase(session=db, phase_id=phase.id)
    assert result is True

    deleted_phase = crud.get_phase(session=db, phase_id=phase.id)
    assert deleted_phase is None
