import uuid
from typing import TYPE_CHECKING

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.lesson import Lesson
    from app.models.phase import Phase
    from app.models.session import Session


class ProgramBase(SQLModel):
    title: str = Field(max_length=255)
    days_of_study: list[str] = Field(sa_column=Column(JSON))


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    days_of_study: list[str] | None = Field(default=None, sa_column=Column(JSON))


class Program(ProgramBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    phases: list["Phase"] = Relationship(back_populates="program", cascade_delete=True)
    sessions: list["Session"] = Relationship(
        back_populates="program", cascade_delete=True
    )

    def get_all_lessons(self) -> list["Lesson"]:
        """Get all lessons from the program's phases and books in order"""
        if not self.phases:
            return []

        lessons = []
        # Sort phases by order
        sorted_phases = sorted(self.phases, key=lambda p: p.order)
        for phase in sorted_phases:
            # Sort books by order from the phase_books association
            sorted_phase_books = sorted(phase.phase_books, key=lambda pb: pb.order)
            for phase_book in sorted_phase_books:
                # Sort lessons by order
                sorted_lessons = sorted(
                    phase_book.book.lessons, key=lambda lsn: lsn.order
                )
                lessons.extend(sorted_lessons)
        return lessons

    def get_study_weekdays(self) -> set[int]:
        """Convert days_of_study strings to weekday integers (0=Monday, 6=Sunday)"""
        day_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        if not self.days_of_study:
            return set()
        return {
            day_map[day.lower()] for day in self.days_of_study if day.lower() in day_map
        }


class ProgramPublic(ProgramBase):
    id: uuid.UUID


class ProgramsPublic(SQLModel):
    data: list[ProgramPublic]
    count: int
