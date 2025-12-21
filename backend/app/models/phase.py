import uuid
from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.program import Program

from app.models.associations import PhaseBook


class PhaseBase(SQLModel):
    order: int = Field(index=True, ge=0)
    program_id: uuid.UUID = Field(foreign_key="program.id", ondelete="CASCADE")


class PhaseCreate(PhaseBase):
    pass


class PhaseUpdate(SQLModel):
    order: int | None = Field(default=None, ge=0)


class Phase(PhaseBase, table=True):
    __table_args__ = (
        UniqueConstraint("program_id", "order", name="uq_phase_program_order"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    program: "Program" = Relationship(back_populates="phases")
    books: list["Book"] = Relationship(
        back_populates="phases",
        link_model=PhaseBook,
        sa_relationship_kwargs={"overlaps": "book,phase,phase_books"},
    )
    phase_books: list["PhaseBook"] = Relationship(
        back_populates="phase",
        sa_relationship_kwargs={"overlaps": "books,phases"},
    )


class PhasePublic(PhaseBase):
    id: uuid.UUID


class PhasesPublic(SQLModel):
    data: list[PhasePublic]
    count: int
