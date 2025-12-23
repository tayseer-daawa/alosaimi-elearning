import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.lesson import Lesson
    from app.models.session import ProgramSession


class SessionEventBase(SQLModel):
    event_date: date
    num_days: int = Field(ge=1, default=1)
    session_id: uuid.UUID = Field(foreign_key="session.id", ondelete="CASCADE")
    is_break: bool = Field(default=False, index=True)

    # SET NULL on delete to preserve session events (lessons) if a lesson (or program) is removed
    lesson_id: uuid.UUID | None = Field(
        default=None, foreign_key="lesson.id", ondelete="SET NULL"
    )

    @property
    def is_lesson(self) -> bool:
        return not self.is_break


class SessionEventCreate(SessionEventBase):
    pass


class SessionEventUpdate(SQLModel):
    event_date: date | None = None
    num_days: int | None = Field(default=None, ge=1)
    lesson_id: uuid.UUID | None = None


class SessionEvent(SessionEventBase, table=True):
    __tablename__ = "session_event"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    session: "ProgramSession" = Relationship(back_populates="session_events")
    lesson: Optional["Lesson"] = Relationship(back_populates="session_events")


class SessionEventPublic(SessionEventBase):
    id: uuid.UUID


class SessionEventsPublic(SQLModel):
    data: list[SessionEventPublic]
    count: int
