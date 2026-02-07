from app.crud.book import (
    create_book,
    delete_book,
    get_book,
    get_books,
    update_book,
)
from app.crud.exam import (
    create_exam,
    delete_exam,
    get_exam,
    get_exams_by_book,
    get_exams_by_session,
    update_exam,
)
from app.crud.exam_attempt import (
    create_exam_attempt,
    delete_exam_attempt,
    get_exam_attempt,
    get_exam_attempts_by_exam,
    get_exam_attempts_by_student,
    get_student_attempts_for_exam,
    update_exam_attempt,
)
from app.crud.lesson import (
    create_lesson,
    delete_lesson,
    get_lesson,
    get_lessons_by_book,
    update_lesson,
)
from app.crud.phase import (
    add_book_to_phase,
    create_phase,
    delete_phase,
    get_phase,
    get_phases_by_program,
    remove_book_from_phase,
    update_phase,
)
from app.crud.program import (
    create_program,
    delete_program,
    get_all_lessons,
    get_program,
    get_programs,
    update_program,
)
from app.crud.question import (
    create_question,
    delete_question,
    get_question,
    get_questions_by_lesson,
    update_question,
)
from app.crud.session import (
    add_student_to_session,
    add_teacher_to_session,
    create_session,
    delete_session,
    get_session,
    get_sessions,
    get_sessions_by_program,
    remove_student_from_session,
    remove_teacher_from_session,
    update_session,
)
from app.crud.session_event import (
    create_session_event,
    delete_session_event,
    get_session_event,
    get_session_events_by_session,
    update_session_event,
)
from app.crud.user import (
    authenticate,
    create_user,
    get_user_by_email,
    update_user,
)

__all__ = [
    # User
    "create_user",
    "update_user",
    "get_user_by_email",
    "authenticate",
    # Program
    "create_program",
    "get_program",
    "get_programs",
    "update_program",
    "delete_program",
    "get_all_lessons",
    # Phase
    "create_phase",
    "get_phase",
    "get_phases_by_program",
    "update_phase",
    "delete_phase",
    "add_book_to_phase",
    "remove_book_from_phase",
    # Book
    "create_book",
    "get_book",
    "get_books",
    "update_book",
    "delete_book",
    # Lesson
    "create_lesson",
    "get_lesson",
    "get_lessons_by_book",
    "update_lesson",
    "delete_lesson",
    # Question
    "create_question",
    "get_question",
    "get_questions_by_lesson",
    "update_question",
    "delete_question",
    # Session
    "create_session",
    "get_session",
    "get_sessions",
    "get_sessions_by_program",
    "update_session",
    "delete_session",
    "add_student_to_session",
    "remove_student_from_session",
    "add_teacher_to_session",
    "remove_teacher_from_session",
    # SessionEvent
    "create_session_event",
    "get_session_event",
    "get_session_events_by_session",
    "update_session_event",
    "delete_session_event",
    # Exam
    "create_exam",
    "get_exam",
    "get_exams_by_session",
    "get_exams_by_book",
    "update_exam",
    "delete_exam",
    # ExamAttempt
    "create_exam_attempt",
    "get_exam_attempt",
    "get_exam_attempts_by_exam",
    "get_exam_attempts_by_student",
    "get_student_attempts_for_exam",
    "update_exam_attempt",
    "delete_exam_attempt",
]
