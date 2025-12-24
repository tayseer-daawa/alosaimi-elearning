from sqlmodel import Session

from app import crud
from app.models import BookCreate, LessonCreate, PhaseCreate, ProgramCreate
from tests.utils.utils import random_lower_string


def test_get_study_weekdays_full_week(db: Session) -> None:
    """Test get_study_weekdays with full week"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ],
    )
    program = crud.create_program(session=db, program_in=program_in)

    weekdays = program.get_study_weekdays()
    assert weekdays == {0, 1, 2, 3, 4, 5, 6}


def test_get_study_weekdays_partial(db: Session) -> None:
    """Test get_study_weekdays with partial week"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["Monday", "Wednesday", "Friday"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    weekdays = program.get_study_weekdays()
    assert weekdays == {0, 2, 4}  # Monday=0, Wednesday=2, Friday=4


def test_get_study_weekdays_case_insensitive(db: Session) -> None:
    """Test get_study_weekdays is case insensitive"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["MONDAY", "wednesday", "FrIdAy"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    weekdays = program.get_study_weekdays()
    assert weekdays == {0, 2, 4}


def test_get_study_weekdays_empty(db: Session) -> None:
    """Test get_study_weekdays with empty days"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=[],
    )
    program = crud.create_program(session=db, program_in=program_in)

    weekdays = program.get_study_weekdays()
    assert weekdays == set()


def test_get_study_weekdays_invalid_day(db: Session) -> None:
    """Test get_study_weekdays with invalid day names (should be ignored)"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["Monday", "InvalidDay", "Friday"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    weekdays = program.get_study_weekdays()
    assert weekdays == {0, 4}  # Only valid days


def test_get_all_lessons_empty(db: Session) -> None:
    """Test get_all_lessons with no phases"""
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["Monday"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    lessons = program.get_all_lessons()
    assert lessons == []


def test_get_all_lessons_with_phases(db: Session) -> None:
    """Test get_all_lessons returns lessons from phases in order"""
    # Create program
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["Monday"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    # Create book with lessons
    book_in = BookCreate(
        title=f"Book {random_lower_string()}",
        pdf="test.pdf",
        audio="test.mp3",
    )
    book = crud.create_book(session=db, book_in=book_in)

    # Create lessons for the book
    for i in range(3):
        lesson_in = LessonCreate(
            book_part_pdf=f"part_{i}.pdf",
            book_part_audio=f"part_{i}.mp3",
            lesson_audio=f"lesson_{i}.mp3",
            explanation_notes=f"notes_{i}",
            book_id=book.id,
            order=i,
        )
        crud.create_lesson(session=db, lesson_in=lesson_in)

    # Create phase and link book to phase
    phase_in = PhaseCreate(order=0, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)
    crud.add_book_to_phase(session=db, phase_id=phase.id, book_id=book.id, order=0)

    # Refresh program to load relationships
    db.refresh(program)

    lessons = program.get_all_lessons()
    assert len(lessons) == 3
    # Verify lessons are sorted by order
    for i, lesson in enumerate(lessons):
        assert lesson.order == i


def test_get_all_lessons_multiple_phases(db: Session) -> None:
    """Test get_all_lessons returns lessons from multiple phases in correct order"""
    # Create program
    program_in = ProgramCreate(
        title=f"Program {random_lower_string()}",
        days_of_study=["Monday"],
    )
    program = crud.create_program(session=db, program_in=program_in)

    # Create two books with lessons
    book1_in = BookCreate(title=f"Book1 {random_lower_string()}", pdf="b1.pdf")
    book1 = crud.create_book(session=db, book_in=book1_in)

    book2_in = BookCreate(title=f"Book2 {random_lower_string()}", pdf="b2.pdf")
    book2 = crud.create_book(session=db, book_in=book2_in)

    # Create lessons for book1
    for i in range(2):
        lesson_in = LessonCreate(
            book_part_pdf=f"b1_part_{i}.pdf",
            book_part_audio=f"b1_part_{i}.mp3",
            lesson_audio=f"b1_lesson_{i}.mp3",
            explanation_notes=f"b1_notes_{i}",
            book_id=book1.id,
            order=i,
        )
        crud.create_lesson(session=db, lesson_in=lesson_in)

    # Create lessons for book2
    for i in range(2):
        lesson_in = LessonCreate(
            book_part_pdf=f"b2_part_{i}.pdf",
            book_part_audio=f"b2_part_{i}.mp3",
            lesson_audio=f"b2_lesson_{i}.mp3",
            explanation_notes=f"b2_notes_{i}",
            book_id=book2.id,
            order=i,
        )
        crud.create_lesson(session=db, lesson_in=lesson_in)

    # Create two phases
    phase1_in = PhaseCreate(order=0, program_id=program.id)
    phase1 = crud.create_phase(session=db, phase_in=phase1_in)
    crud.add_book_to_phase(session=db, phase_id=phase1.id, book_id=book1.id, order=0)

    phase2_in = PhaseCreate(order=1, program_id=program.id)
    phase2 = crud.create_phase(session=db, phase_in=phase2_in)
    crud.add_book_to_phase(session=db, phase_id=phase2.id, book_id=book2.id, order=0)

    # Refresh program to load relationships
    db.refresh(program)

    lessons = program.get_all_lessons()
    assert len(lessons) == 4
    # First two lessons should be from book1 (phase 0)
    assert lessons[0].book_id == book1.id
    assert lessons[1].book_id == book1.id
    # Last two lessons should be from book2 (phase 1)
    assert lessons[2].book_id == book2.id
    assert lessons[3].book_id == book2.id
