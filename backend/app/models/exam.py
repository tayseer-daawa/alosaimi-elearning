import uuid
from datetime import date
from typing import TYPE_CHECKING

from pydantic import model_validator
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.session import ProgramSession
    from app.models.user import User


class ExamBase(SQLModel):
    start_date: date
    deadline: date
    max_attempts: int = Field(ge=1, default=1)
    book_id: uuid.UUID = Field(foreign_key="book.id", ondelete="CASCADE")
    session_id: uuid.UUID = Field(foreign_key="session.id", ondelete="CASCADE")

    @model_validator(mode="after")
    def validate_dates(self) -> "ExamBase":
        if self.start_date > self.deadline:
            raise ValueError("start_date cannot be after deadline")
        return self


class ExamCreate(ExamBase):
    pass


class ExamUpdate(SQLModel):
    start_date: date | None = None
    deadline: date | None = None
    max_attempts: int | None = Field(default=None, ge=1)


class Exam(ExamBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    book: "Book" = Relationship(back_populates="exams")
    session: "ProgramSession" = Relationship(back_populates="exams")
    attempts: list["ExamAttempt"] = Relationship(
        back_populates="exam", cascade_delete=True
    )


class ExamPublic(ExamBase):
    id: uuid.UUID


class ExamsPublic(SQLModel):
    data: list[ExamPublic]
    count: int


# ==================== ExamAttempt Models ====================


class ExamAttemptBase(SQLModel):
    observation: str
    passed: bool
    attempt_date: date = Field(default_factory=date.today)
    exam_id: uuid.UUID = Field(foreign_key="exam.id", ondelete="CASCADE")
    student_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    examiner_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")


class ExamAttemptCreate(SQLModel):
    observation: str
    passed: bool
    exam_id: uuid.UUID
    student_id: uuid.UUID
    examiner_id: uuid.UUID


class ExamAttemptUpdate(SQLModel):
    observation: str | None = None
    passed: bool | None = None


class ExamAttempt(ExamAttemptBase, table=True):
    __tablename__ = "exam_attempt"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    exam: "Exam" = Relationship(back_populates="attempts")
    student: "User" = Relationship(
        back_populates="exam_attempts",
        sa_relationship_kwargs={
            "foreign_keys": "[ExamAttempt.student_id]",
            "overlaps": "examiner",
        },
    )
    examiner: "User" = Relationship(
        back_populates="examined_attempts",
        sa_relationship_kwargs={
            "foreign_keys": "[ExamAttempt.examiner_id]",
            "overlaps": "student",
        },
    )


class ExamAttemptPublic(ExamAttemptBase):
    id: uuid.UUID


class ExamAttemptsPublic(SQLModel):
    data: list[ExamAttemptPublic]
    count: int
