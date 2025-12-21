import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.phase import Phase


class UserSessionStudent(SQLModel, table=True):
    """Association table for students in sessions"""

    __tablename__ = "user_session_student"

    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    session_id: uuid.UUID = Field(
        foreign_key="session.id", primary_key=True, ondelete="CASCADE"
    )


class UserSessionTeacher(SQLModel, table=True):
    """Association table for teachers in sessions"""

    __tablename__ = "user_session_teacher"

    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    session_id: uuid.UUID = Field(
        foreign_key="session.id", primary_key=True, ondelete="CASCADE"
    )


class PhaseBook(SQLModel, table=True):
    """Association table for books in phases"""

    __tablename__ = "phase_book"
    __table_args__ = (
        UniqueConstraint("phase_id", "order", name="uq_phase_book_phase_order"),
    )

    phase_id: uuid.UUID = Field(
        foreign_key="phase.id", primary_key=True, ondelete="CASCADE"
    )
    book_id: uuid.UUID = Field(
        foreign_key="book.id", primary_key=True, ondelete="CASCADE"
    )
    order: int = Field(index=True, ge=0)

    # Relationships
    phase: "Phase" = Relationship(
        back_populates="phase_books",
        sa_relationship_kwargs={"overlaps": "books,phases"},
    )
    book: "Book" = Relationship(
        sa_relationship_kwargs={"overlaps": "books,phases"},
    )
