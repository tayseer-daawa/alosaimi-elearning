import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.lesson import Lesson
    from app.models.phase import Phase
    from app.models.session import ProgramSession


def days_list_to_bitmask(days: list[str]) -> int:
    """
    Convert a set of week days into a bitmask.

    Args:
        days (list[str]): week days
    Raises:
        ValueError: if any value isn't a valid day
    Returns:
        int: bitmask representing the set of days
    """
    day_map = {
        "sunday": 0,
        "monday": 1,
        "tuesday": 2,
        "wednesday": 3,
        "thursday": 4,
        "friday": 5,
        "saturday": 6,
    }
    bitmask = 0
    for day in set(days):
        idx = day_map.get(day.lower(), None)
        if idx is not None:
            bitmask |= 1 << idx
        else:
            raise ValueError(f"invalid day: {day}")
    return bitmask


def bitmask_to_days_list(bitmask: int) -> list[str]:
    """
    Convert a bitmask representing week days into a set.

    Args:
        bitmask (int): a bitmask representing the set of days
    Raises:
        ValueError: if the bitmask isn't in the expected range
    Returns:
        list[str]: week days
    """
    if 0 > bitmask >= (2**7 - 1):
        raise ValueError("bitmask must be in range [0, 127]")
    days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]
    return [days[i] for i in range(7) if (bitmask & (1 << i))]


class ProgramBase(SQLModel):
    title: str = Field(max_length=255)
    days_of_study: list[str]


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    days_of_study: list[str] | None = Field(default=None)


class Program(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    # bitmask: 0-bit being Sunday, and 6-bit being Saturday
    days_of_study: int = Field(ge=0, lt=2**7)

    # Relationships
    phases: list["Phase"] = Relationship(back_populates="program", cascade_delete=True)
    sessions: list["ProgramSession"] = Relationship(
        back_populates="program", cascade_delete=True
    )

    @property
    def days_of_study_list(self) -> list[str]:
        return bitmask_to_days_list(self.days_of_study)

    @days_of_study_list.setter
    def days_of_study_list(self, value: list[str]) -> None:
        self.days_of_study = days_list_to_bitmask(value)

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
        """Convert days_of_study to weekday integers (0=Sunday, 6=Saturday)"""
        days = set()
        for day in range(7):
            if 2**day & self.days_of_study:
                days.add(day)
        if not self.days_of_study:
            return set()
        return days


class ProgramPublic(ProgramBase):
    id: uuid.UUID

    @staticmethod
    def from_program(program: Program) -> "ProgramPublic":
        return ProgramPublic(
            id=program.id,
            title=program.title,
            days_of_study=program.days_of_study_list,
        )


class ProgramsPublic(SQLModel):
    data: list[ProgramPublic]
    count: int

    @staticmethod
    def from_programs(programs: list[Program], count: int) -> "ProgramsPublic":
        public_programs = [ProgramPublic.from_program(program) for program in programs]
        return ProgramsPublic(data=public_programs, count=count)
