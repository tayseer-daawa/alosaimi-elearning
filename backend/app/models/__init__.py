from sqlmodel import SQLModel

from app.models.associations import PhaseBook, UserSessionStudent, UserSessionTeacher
from app.models.book import (
    Book,
    BookBase,
    BookCreate,
    BookPublic,
    BooksPublic,
    BookUpdate,
)
from app.models.common import Message, NewPassword, Token, TokenPayload
from app.models.exam import (
    Exam,
    ExamAttempt,
    ExamAttemptBase,
    ExamAttemptCreate,
    ExamAttemptPublic,
    ExamAttemptsPublic,
    ExamAttemptUpdate,
    ExamBase,
    ExamCreate,
    ExamPublic,
    ExamsPublic,
    ExamUpdate,
)
from app.models.lesson import (
    Lesson,
    LessonBase,
    LessonCreate,
    LessonPublic,
    LessonsPublic,
    LessonUpdate,
)
from app.models.phase import (
    Phase,
    PhaseBase,
    PhaseCreate,
    PhasePublic,
    PhasesPublic,
    PhaseUpdate,
)
from app.models.program import (
    Program,
    ProgramBase,
    ProgramCreate,
    ProgramPublic,
    ProgramsPublic,
    ProgramUpdate,
)
from app.models.question import (
    Question,
    QuestionBase,
    QuestionCreate,
    QuestionPublic,
    QuestionsPublic,
    QuestionUpdate,
)
from app.models.session import (
    Session,
    SessionBase,
    SessionCreate,
    SessionPublic,
    SessionsPublic,
    SessionUpdate,
)
from app.models.session_event import (
    SessionEvent,
    SessionEventBase,
    SessionEventCreate,
    SessionEventPublic,
    SessionEventsPublic,
    SessionEventUpdate,
)
from app.models.user import (
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

__all__ = [
    # Associations
    "UserSessionStudent",
    "UserSessionTeacher",
    "PhaseBook",
    # User
    "UserBase",
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UpdatePassword",
    "User",
    "UserPublic",
    "UsersPublic",
    # Program
    "ProgramBase",
    "ProgramCreate",
    "ProgramUpdate",
    "Program",
    "ProgramPublic",
    "ProgramsPublic",
    # Phase
    "PhaseBase",
    "PhaseCreate",
    "PhaseUpdate",
    "Phase",
    "PhasePublic",
    "PhasesPublic",
    # Book
    "BookBase",
    "BookCreate",
    "BookUpdate",
    "Book",
    "BookPublic",
    "BooksPublic",
    # Lesson
    "LessonBase",
    "LessonCreate",
    "LessonUpdate",
    "Lesson",
    "LessonPublic",
    "LessonsPublic",
    # Question
    "QuestionBase",
    "QuestionCreate",
    "QuestionUpdate",
    "Question",
    "QuestionPublic",
    "QuestionsPublic",
    # Session
    "SessionBase",
    "SessionCreate",
    "SessionUpdate",
    "Session",
    "SessionPublic",
    "SessionsPublic",
    # SessionEvent
    "SessionEventBase",
    "SessionEventCreate",
    "SessionEventUpdate",
    "SessionEvent",
    "SessionEventPublic",
    "SessionEventsPublic",
    # Exam
    "ExamBase",
    "ExamCreate",
    "ExamUpdate",
    "Exam",
    "ExamPublic",
    "ExamsPublic",
    # ExamAttempt
    "ExamAttemptBase",
    "ExamAttemptCreate",
    "ExamAttemptUpdate",
    "ExamAttempt",
    "ExamAttemptPublic",
    "ExamAttemptsPublic",
    # Common
    "Message",
    "Token",
    "TokenPayload",
    "NewPassword",
    "SQLModel",
]
