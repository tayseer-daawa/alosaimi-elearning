from sqlmodel import Session

from app import crud
from app.models import LessonCreate, LessonUpdate
from tests.utils.book import create_random_book


def test_create_lesson(db: Session) -> None:
    book = create_random_book(db)

    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Sample notes for the lesson",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)
    assert lesson.book_id == book.id
    assert lesson.explanation_notes == "Sample notes for the lesson"
    assert lesson.id is not None


def test_get_lesson(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Test notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    stored_lesson = crud.get_lesson(session=db, lesson_id=lesson.id)
    assert stored_lesson
    assert stored_lesson.id == lesson.id
    assert stored_lesson.book_id == book.id


def test_get_lessons_by_book(db: Session) -> None:
    book = create_random_book(db)

    # Create multiple lessons for the same book
    for i in range(3):
        lesson_in = LessonCreate(
            book_part_pdf=f"https://example.com/part{i+1}.pdf",
            book_part_audio=f"https://example.com/part{i+1}.mp3",
            lesson_audio=f"https://example.com/lesson{i+1}.mp3",
            explanation_notes=f"Notes {i+1}",
            book_id=book.id,
            order=i + 1,
        )
        crud.create_lesson(session=db, lesson_in=lesson_in)

    lessons = crud.get_lessons_by_book(session=db, book_id=book.id, skip=0, limit=10)
    assert len(lessons) == 3


def test_update_lesson(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Original notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    new_notes = "Updated notes"
    lesson_in_update = LessonUpdate(explanation_notes=new_notes)

    updated_lesson = crud.update_lesson(
        session=db, db_lesson=lesson, lesson_in=lesson_in_update
    )
    assert updated_lesson.explanation_notes == new_notes
    assert updated_lesson.id == lesson.id


def test_delete_lesson(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Test notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    result = crud.delete_lesson(session=db, lesson_id=lesson.id)
    assert result is True

    deleted_lesson = crud.get_lesson(session=db, lesson_id=lesson.id)
    assert deleted_lesson is None
