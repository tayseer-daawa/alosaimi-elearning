import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.question import Question
    from app.models.session_event import SessionEvent


class LessonBase(SQLModel):
    book_part_pdf: str
    book_part_audio: str
    lesson_audio: str
    explanation_notes: str
    order: int = Field(index=True, ge=0)
    book_id: uuid.UUID = Field(foreign_key="book.id", ondelete="CASCADE")


class LessonCreate(LessonBase):
    pass


class LessonUpdate(SQLModel):
    book_part_pdf: str | None = None
    book_part_audio: str | None = None
    lesson_audio: str | None = None
    explanation_notes: str | None = None


class Lesson(LessonBase, table=True):
    __table_args__ = (
        UniqueConstraint("book_id", "order", name="uq_lesson_book_order"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    book: "Book" = Relationship(back_populates="lessons")
    questions: list["Question"] = Relationship(
        back_populates="lesson", cascade_delete=True
    )
    session_events: list["SessionEvent"] = Relationship(back_populates="lesson")


class LessonPublic(LessonBase):
    id: uuid.UUID


class LessonsPublic(SQLModel):
    data: list[LessonPublic]
    count: int
