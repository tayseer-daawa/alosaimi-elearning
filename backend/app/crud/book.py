import uuid

from sqlmodel import Session, select

from app.crud.utils import validate_update_model
from app.models import Book, BookCreate, BookUpdate


def create_book(*, session: Session, book_in: BookCreate) -> Book:
    """Create a new book"""
    db_obj = Book.model_validate(book_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_book(*, session: Session, book_id: uuid.UUID) -> Book | None:
    """Get a book by ID"""
    return session.get(Book, book_id)


def get_books(*, session: Session, skip: int = 0, limit: int = 100) -> list[Book]:
    """Get list of books"""
    statement = select(Book).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_book(*, session: Session, db_book: Book, book_in: BookUpdate) -> Book:
    """Update a book"""
    book_data = book_in.model_dump(exclude_unset=True)
    validate_update_model(Book, db_book, book_data)
    db_book.sqlmodel_update(book_data)
    session.add(db_book)
    session.commit()
    session.refresh(db_book)
    return db_book


def delete_book(*, session: Session, book_id: uuid.UUID) -> bool:
    """Delete a book"""
    db_obj = session.get(Book, book_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
