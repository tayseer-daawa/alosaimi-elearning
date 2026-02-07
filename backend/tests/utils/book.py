from sqlmodel import Session

from app import crud
from app.models import Book, BookCreate
from tests.utils.utils import random_lower_string


def create_random_book(db: Session) -> Book:
    """Create a random book for testing"""
    title = f"Book {random_lower_string()}"
    pdf = f"https://example.com/{random_lower_string()}.pdf"
    audio = f"https://example.com/{random_lower_string()}.mp3"
    book_in = BookCreate(title=title, pdf=pdf, audio=audio)
    return crud.create_book(session=db, book_in=book_in)
