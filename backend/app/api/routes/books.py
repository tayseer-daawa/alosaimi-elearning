import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep, get_current_admin_or_superuser
from app.models import (
    Book,
    BookCreate,
    BookPublic,
    BooksPublic,
    BookUpdate,
    Message,
)

router = APIRouter(prefix="/books", tags=["books"])


# For guest users
@router.get("/", response_model=BooksPublic)
def read_books(
    session: SessionDep, skip: int = 0, limit: int = Query(default=100, le=500)
) -> BooksPublic:
    """
    Retrieve books.
    """
    count_statement = select(func.count()).select_from(Book)
    count = session.exec(count_statement).one()
    books = crud.get_books(session=session, skip=skip, limit=limit)
    return BooksPublic(data=books, count=count)


# For guest users as well
@router.get("/{book_id}", response_model=BookPublic)
def read_book(session: SessionDep, book_id: uuid.UUID) -> Book:
    """
    Get book by ID.
    """
    book = crud.get_book(session=session, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post(
    "/",
    response_model=BookPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def create_book(*, session: SessionDep, book_in: BookCreate) -> Book:
    """
    Create new book.

    Only admins can create books.
    """
    book = crud.create_book(session=session, book_in=book_in)
    return book


@router.patch(
    "/{book_id}",
    response_model=BookPublic,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def update_book(
    *,
    session: SessionDep,
    book_id: uuid.UUID,
    book_in: BookUpdate,
) -> Book:
    """
    Update a book.

    Only admins can update books.
    """
    book = crud.get_book(session=session, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book = crud.update_book(session=session, db_book=book, book_in=book_in)
    return book


@router.delete(
    "/{book_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin_or_superuser)],
)
def delete_book(session: SessionDep, book_id: uuid.UUID) -> Message:
    """
    Delete a book.

    Only admins can delete books.
    """
    success = crud.delete_book(session=session, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")

    return Message(message="Book deleted successfully")
