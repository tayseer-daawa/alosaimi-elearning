import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.program import Program
    from app.models.session_event import SessionEvent
    from app.models.user import User

from app.models.associations import UserSessionStudent, UserSessionTeacher


class SessionBase(SQLModel):
    start_date: date
    program_id: uuid.UUID = Field(foreign_key="program.id", ondelete="CASCADE")


class SessionCreate(SessionBase):
    pass


class SessionUpdate(SQLModel):
    start_date: date | None = None


class Session(SessionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    program: "Program" = Relationship(back_populates="sessions")
    students: list["User"] = Relationship(
        back_populates="student_sessions",
        link_model=UserSessionStudent,
        sa_relationship_kwargs={"overlaps": "teachers"},
    )
    teachers: list["User"] = Relationship(
        back_populates="teacher_sessions",
        link_model=UserSessionTeacher,
        sa_relationship_kwargs={"overlaps": "students"},
    )
    session_events: list["SessionEvent"] = Relationship(
        back_populates="session", cascade_delete=True
    )
    exams: list["Exam"] = Relationship(back_populates="session", cascade_delete=True)

    def get_breaks(self) -> list["SessionEvent"]:
        """Get all breaks for this session ordered by their start date"""
        return sorted(
            [event for event in self.session_events if event.is_break],
            key=lambda e: e.event_date,
        )

    def get_lessons(self) -> list["SessionEvent"]:
        """Get all lesson events for this session ordered by their event date"""
        return sorted(
            [event for event in self.session_events if not event.is_break],
            key=lambda e: e.event_date,
        )

    def end_date(self) -> date:
        """Calculate the end date based on number of lessons, study days per week, and breaks"""
        return date.today()  # Placeholder implementation

    def add_break(self, break_start_date: date, num_days: int) -> None:
        """Add break days to the session by creating SessionEvent entries without lessons.

        This will also reschedule existing lesson events that fall on or after the break.
        """
        pass

    def reschedule(self, new_start_date: date | None = None) -> None:
        """Reschedule the session by planning SessionEvents based on the program's lessons.

        Warning: This will remove all existing lesson SessionEvents and recreate them.
        If the program definition changed, the session will reflect those changes.

        This creates or updates SessionEvents for each lesson in the program,
        respecting the days_of_study and existing breaks.
        """
        pass


class SessionPublic(SessionBase):
    id: uuid.UUID


class SessionsPublic(SQLModel):
    data: list[SessionPublic]
    count: int
