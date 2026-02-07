import uuid
from datetime import date
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.exam import ExamAttempt
    from app.models.session import ProgramSession

from app.models.associations import UserSessionStudent, UserSessionTeacher

PASSWORD_MIN_LEN = 8
PASSWORD_MAX_LEN = 128
NAME_MAX_LEN = 30
EMAIL_MAX_LEN = 255


class UserBase(SQLModel):
    # Registration number should be different than the DB ID.
    # We can adopt a format that gives more info about the user, but it sounds better to hide.
    reg_num: uuid.UUID = Field(default_factory=uuid.uuid4, unique=True, index=True)
    email: EmailStr = Field(unique=True, index=True, max_length=EMAIL_MAX_LEN)
    first_name: str = Field(max_length=NAME_MAX_LEN)
    father_name: str = Field(max_length=NAME_MAX_LEN)
    family_name: str = Field(max_length=NAME_MAX_LEN)
    is_active: bool = True
    is_admin: bool = False
    is_teacher: bool = False
    is_superuser: bool = False
    is_male: bool

    @property
    def is_female(self) -> bool:
        return not self.is_male


class UserCreate(UserBase):
    password: str = Field(min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN)
    reg_date: date | None = None


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=EMAIL_MAX_LEN)
    password: str = Field(min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN)
    first_name: str = Field(max_length=NAME_MAX_LEN)
    father_name: str = Field(max_length=NAME_MAX_LEN)
    family_name: str = Field(max_length=NAME_MAX_LEN)
    is_male: bool


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=EMAIL_MAX_LEN)
    password: str | None = Field(
        default=None, min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN
    )
    first_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    father_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    family_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    is_male: bool | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
    is_teacher: bool | None = None


class UserUpdateMe(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=EMAIL_MAX_LEN)
    first_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    father_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    family_name: str | None = Field(default=None, max_length=NAME_MAX_LEN)
    is_male: bool | None = None


class UpdatePassword(SQLModel):
    current_password: str = Field(
        min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN
    )
    new_password: str = Field(min_length=PASSWORD_MIN_LEN, max_length=PASSWORD_MAX_LEN)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    reg_date: date = Field(default_factory=date.today)

    # Relationships
    student_sessions: list["ProgramSession"] = Relationship(
        back_populates="students",
        link_model=UserSessionStudent,
        sa_relationship_kwargs={"overlaps": "teacher_sessions"},
    )
    teacher_sessions: list["ProgramSession"] = Relationship(
        back_populates="teachers",
        link_model=UserSessionTeacher,
        sa_relationship_kwargs={"overlaps": "student_sessions"},
    )
    exam_attempts: list["ExamAttempt"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={
            "foreign_keys": "ExamAttempt.student_id",
            "overlaps": "examined_attempts",
        },
    )
    examined_attempts: list["ExamAttempt"] = Relationship(
        back_populates="examiner",
        sa_relationship_kwargs={
            "foreign_keys": "ExamAttempt.examiner_id",
            "overlaps": "exam_attempts",
        },
    )


class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
