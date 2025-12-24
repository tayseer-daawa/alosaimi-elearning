import uuid
from typing import TYPE_CHECKING

from pydantic import model_validator
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.lesson import Lesson


# Answers are public for now. We can make them private if we start storing students' answers.
# Basically giving back answers only when a student has made an attempt.
class QuestionBase(SQLModel):
    question: str
    options: list[str] = Field(sa_column=Column(JSON))
    correct_options: list[int] = Field(sa_column=Column(JSON))
    explanation: str | None = None
    lesson_id: uuid.UUID = Field(foreign_key="lesson.id", ondelete="CASCADE")

    @model_validator(mode="after")
    def validate_correct_options(self) -> "QuestionBase":
        max_idx = len(self.options)
        for option in self.correct_options:
            if option < 0 or option >= max_idx:
                raise ValueError(
                    f"correct_option index {option} is out of range for options of length {max_idx}"
                )
        return self


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(SQLModel):
    question: str | None = None
    options: list[str] | None = Field(default=None, sa_column=Column(JSON))
    correct_options: list[int] | None = Field(default=None, sa_column=Column(JSON))
    explanation: str | None = None


class Question(QuestionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    lesson: "Lesson" = Relationship(back_populates="questions")

    def is_single_answer(self) -> bool:
        """Check if this question has a single correct answer"""
        return len(self.correct_options) == 1


class QuestionPublic(QuestionBase):
    id: uuid.UUID


class QuestionsPublic(SQLModel):
    data: list[QuestionPublic]
    count: int
