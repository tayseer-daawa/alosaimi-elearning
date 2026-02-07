from sqlmodel import Session

from app import crud
from app.models import BookCreate, BookUpdate
from tests.utils.book import create_random_book
from tests.utils.utils import random_lower_string


def test_create_book(db: Session) -> None:
    title = random_lower_string()
    book_in = BookCreate(
        title=title,
        pdf="https://example.com/book.pdf",
        audio="https://example.com/book.mp3",
    )
    book = crud.create_book(session=db, book_in=book_in)
    assert book.title == title
    assert book.pdf == "https://example.com/book.pdf"
    assert book.id is not None


def test_get_book(db: Session) -> None:
    book = create_random_book(db)
    stored_book = crud.get_book(session=db, book_id=book.id)
    assert stored_book
    assert stored_book.id == book.id
    assert stored_book.title == book.title


def test_get_books(db: Session) -> None:
    # Create multiple books
    create_random_book(db)
    create_random_book(db)

    books = crud.get_books(session=db, skip=0, limit=10)
    assert len(books) >= 2


def test_update_book(db: Session) -> None:
    book = create_random_book(db)
    new_title = random_lower_string()
    book_in_update = BookUpdate(title=new_title)

    updated_book = crud.update_book(session=db, db_book=book, book_in=book_in_update)
    assert updated_book.title == new_title
    assert updated_book.id == book.id


def test_delete_book(db: Session) -> None:
    book = create_random_book(db)
    result = crud.delete_book(session=db, book_id=book.id)
    assert result is True

    deleted_book = crud.get_book(session=db, book_id=book.id)
    assert deleted_book is None
