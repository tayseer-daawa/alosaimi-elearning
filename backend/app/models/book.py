import uuid
from typing import TYPE_CHECKING

from sqlmodel import Column, Field, Relationship, SQLModel, String

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.lesson import Lesson
    from app.models.phase import Phase

from app.models.associations import PhaseBook


# A book doesn't necessarily have to belong to a phase, which is different from
# Phases (with Programs), and Lessons (with Books).
# This is because the elearning platform might have standalone books that are not part
# of any structured program.
class BookBase(SQLModel):
    title: str = Field(max_length=255)
    pdf: str | None = Field(default=None, sa_column=Column(String))
    audio: str | None = Field(default=None, sa_column=Column(String))


class BookCreate(BookBase):
    pass


class BookUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    pdf: str | None = None
    audio: str | None = None


class Book(BookBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    phases: list["Phase"] = Relationship(
        back_populates="books",
        link_model=PhaseBook,
    )
    lessons: list["Lesson"] = Relationship(back_populates="book", cascade_delete=True)
    exams: list["Exam"] = Relationship(back_populates="book", cascade_delete=True)


class BookPublic(BookBase):
    id: uuid.UUID


class BooksPublic(SQLModel):
    data: list[BookPublic]
    count: int
