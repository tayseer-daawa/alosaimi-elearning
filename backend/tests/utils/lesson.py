import random

from sqlmodel import Session

from app import crud
from app.models import Lesson, LessonCreate
from tests.utils.book import create_random_book
from tests.utils.utils import random_lower_string


def create_random_lesson(db: Session) -> Lesson:
    """Create a random lesson with a random book"""
    book = create_random_book(db)
    order = random.randint(0, 100)
    lesson_in = LessonCreate(
        book_part_pdf=f"https://example.com/{random_lower_string()}.pdf",
        book_part_audio=f"https://example.com/{random_lower_string()}.mp3",
        lesson_audio=f"https://example.com/{random_lower_string()}.mp3",
        explanation_notes=random_lower_string(),
        book_id=book.id,
        order=order,
    )
    return crud.create_lesson(session=db, lesson_in=lesson_in)
