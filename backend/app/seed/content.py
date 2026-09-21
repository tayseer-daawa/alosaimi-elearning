"""Seed the learning graph: program → phases → books → lessons → session → exam."""

from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlmodel import Session, col, select

from app import crud
from app.models import (
    Book,
    BookCreate,
    BookUpdate,
    Exam,
    ExamAttemptCreate,
    ExamCreate,
    Lesson,
    LessonCreate,
    LessonUpdate,
    Phase,
    PhaseCreate,
    Program,
    ProgramCreate,
    ProgramSession,
    ProgramSessionCreate,
    QuestionCreate,
    SessionEventCreate,
    User,
)
from app.seed.data import (
    ACTIVE_STUDENT_EMAILS,
    ALL_SEED_BOOK_TITLES,
    ALL_SEED_PROGRAM_TITLES,
    ORPHAN_BOOK_TITLE,
    PRIMARY_PROGRAM_TITLE,
    PRIMARY_STUDENT_EMAIL,
    PROGRAM_TITLE,
    SEED_PROGRAMS,
    STALE_MEDIA_MARKERS,
    TEACHER_EMAIL,
    SeedBookSpec,
    SeedProgramSpec,
)
from app.seed.media import lesson_audio_for, media_for

logger = logging.getLogger(__name__)


def _is_stale_media(url: str | None) -> bool:
    if not url:
        return True
    return any(marker in url for marker in STALE_MEDIA_MARKERS)


def _lesson_notes(*, book_title: str, order: int, source_note: str | None) -> str:
    lines = [f"الدرس {order + 1} من متن «{book_title}»."]
    if source_note:
        lines.append(source_note)
    else:
        lines.append("لا يتوفر تسجيل مرتبط بهذا الدرس في البذرة بعد.")
    return "\n".join(lines)


def seed_content(
    *,
    session: Session,
    users_by_email: dict[str, User],
    verbose: bool = False,
) -> None:
    primary: Program | None = None
    primary_first_book: Book | None = None

    for spec in SEED_PROGRAMS:
        program = _ensure_program(session=session, spec=spec, verbose=verbose)
        books_by_title = _ensure_phase_books(
            session=session, program=program, phases=spec.phases, verbose=verbose
        )
        if spec.with_session and spec.title == PRIMARY_PROGRAM_TITLE:
            primary = program
            first_phase = spec.phases[min(spec.phases)]
            primary_first_book = books_by_title[first_phase[0].title]

    _ensure_orphan_book(session=session, verbose=verbose)

    if primary is None or primary_first_book is None:
        logger.warning(
            "skip session/exam — primary program %r missing", PRIMARY_PROGRAM_TITLE
        )
        return

    first_lessons = crud.get_lessons_by_book(
        session=session, book_id=primary_first_book.id
    )
    prog_session = _ensure_session(
        session=session,
        program=primary,
        users_by_email=users_by_email,
        verbose=verbose,
    )
    _ensure_session_events(
        session=session,
        prog_session=prog_session,
        lessons=first_lessons[:3],
        verbose=verbose,
    )
    exam = _ensure_exam(
        session=session,
        book=primary_first_book,
        prog_session=prog_session,
        verbose=verbose,
    )
    _ensure_exam_attempt(
        session=session,
        exam=exam,
        users_by_email=users_by_email,
        verbose=verbose,
    )


def _ensure_program(
    *, session: Session, spec: SeedProgramSpec, verbose: bool
) -> Program:
    existing = session.exec(select(Program).where(Program.title == spec.title)).first()
    if existing:
        if verbose:
            logger.info("skip program %r", spec.title)
        return existing
    program = crud.create_program(
        session=session,
        program_in=ProgramCreate(title=spec.title, days_of_study=spec.days_of_study),
    )
    if verbose:
        logger.info("created program %r", spec.title)
    return program


def _ensure_phase(
    *, session: Session, program: Program, order: int, verbose: bool
) -> Phase:
    phases = crud.get_phases_by_program(session=session, program_id=program.id)
    for phase in phases:
        if phase.order == order:
            if verbose:
                logger.info("skip phase order=%s", order)
            return phase
    phase = crud.create_phase(
        session=session,
        phase_in=PhaseCreate(order=order, program_id=program.id),
    )
    if verbose:
        logger.info("created phase order=%s", order)
    return phase


def _ensure_book(*, session: Session, title: str, verbose: bool) -> Book:
    media = media_for(title)
    want_pdf = media.pdf if media else None
    want_audio = media.audio if media else None

    existing = session.exec(select(Book).where(Book.title == title)).first()
    if existing:
        needs_refresh = (
            _is_stale_media(existing.pdf)
            or _is_stale_media(existing.audio)
            or (want_pdf is not None and existing.pdf != want_pdf)
            or (want_audio is not None and existing.audio != want_audio)
        )
        if needs_refresh:
            existing = crud.update_book(
                session=session,
                db_book=existing,
                book_in=BookUpdate(pdf=want_pdf, audio=want_audio),
            )
            if verbose:
                logger.info("refreshed media for book %r", title)
        elif verbose:
            logger.info("skip book %r", title)
        return existing
    book = crud.create_book(
        session=session,
        book_in=BookCreate(
            title=title,
            pdf=want_pdf,
            audio=want_audio,
        ),
    )
    if verbose:
        logger.info("created book %r", title)
    return book


def _ensure_phase_books(
    *,
    session: Session,
    program: Program,
    phases: dict[int, list[SeedBookSpec]],
    verbose: bool,
) -> dict[str, Book]:
    books_by_title: dict[str, Book] = {}
    for phase_order, specs in phases.items():
        phase = _ensure_phase(
            session=session, program=program, order=phase_order, verbose=verbose
        )
        for book_order, spec in enumerate(specs):
            book = _ensure_book(session=session, title=spec.title, verbose=verbose)
            books_by_title[spec.title] = book
            _ensure_book_on_phase(
                session=session,
                phase=phase,
                book=book,
                order=book_order,
                verbose=verbose,
            )
            _ensure_lessons_and_questions(
                session=session, book=book, spec=spec, verbose=verbose
            )
    return books_by_title


def _ensure_book_on_phase(
    *,
    session: Session,
    phase: Phase,
    book: Book,
    order: int,
    verbose: bool,
) -> None:
    # Refresh relationships
    session.refresh(phase)
    if any(b.id == book.id for b in phase.books):
        if verbose:
            logger.info("skip phase-book link %s → %r", phase.order, book.title)
        return
    crud.add_book_to_phase(
        session=session, phase_id=phase.id, book_id=book.id, order=order
    )
    if verbose:
        logger.info("linked book %r to phase order=%s", book.title, phase.order)


def _ensure_lessons_and_questions(
    *,
    session: Session,
    book: Book,
    spec: SeedBookSpec,
    verbose: bool,
) -> list[Lesson]:
    existing = crud.get_lessons_by_book(session=session, book_id=book.id)
    by_order = {lesson.order: lesson for lesson in existing}
    media = media_for(book.title)
    source_note = media.source_note if media else None
    lessons: list[Lesson] = []
    for order in range(spec.lesson_count):
        notes = _lesson_notes(
            book_title=book.title, order=order, source_note=source_note
        )
        lesson_audio = lesson_audio_for(media, order) if media else ""
        lesson_pdf = (media.lesson_pdf or media.pdf or "") if media else ""
        if order in by_order:
            lesson = by_order[order]
            needs_refresh = (
                _is_stale_media(lesson.book_part_pdf)
                or _is_stale_media(lesson.book_part_audio)
                or _is_stale_media(lesson.lesson_audio)
                or "بذرة تطويرية" in (lesson.explanation_notes or "")
                or "soundhelix" in (lesson.lesson_audio or "")
                or (
                    media is not None
                    and (
                        lesson.lesson_audio != lesson_audio
                        or lesson.book_part_audio != lesson_audio
                        or (lesson_pdf and lesson.book_part_pdf != lesson_pdf)
                    )
                )
            )
            if needs_refresh:
                lesson = crud.update_lesson(
                    session=session,
                    db_lesson=lesson,
                    lesson_in=LessonUpdate(
                        book_part_pdf=lesson_pdf,
                        book_part_audio=lesson_audio,
                        lesson_audio=lesson_audio,
                        explanation_notes=notes,
                    ),
                )
                if verbose:
                    logger.info("refreshed lesson order=%s on %r", order, book.title)
            elif verbose:
                logger.info("skip lesson order=%s on %r", order, book.title)
        else:
            lesson = crud.create_lesson(
                session=session,
                lesson_in=LessonCreate(
                    book_part_pdf=lesson_pdf,
                    book_part_audio=lesson_audio,
                    lesson_audio=lesson_audio,
                    explanation_notes=notes,
                    order=order,
                    book_id=book.id,
                ),
            )
            if verbose:
                logger.info("created lesson order=%s on %r", order, book.title)
        lessons.append(lesson)
        _ensure_questions(
            session=session,
            lesson=lesson,
            count=spec.questions_per_lesson,
            verbose=verbose,
        )
    return lessons


def _ensure_questions(
    *,
    session: Session,
    lesson: Lesson,
    count: int,
    verbose: bool,
) -> None:
    existing = crud.get_questions_by_lesson(session=session, lesson_id=lesson.id)
    if len(existing) >= count:
        if verbose:
            logger.info(
                "skip questions for lesson %s (have %s)", lesson.id, len(existing)
            )
        return
    for i in range(len(existing), count):
        crud.create_question(
            session=session,
            question_in=QuestionCreate(
                question=f"سؤال تجريبي {i + 1} للدرس {lesson.order + 1}",
                options=["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
                correct_options=[0],
                explanation="إجابة نموذجية للبذرة التطويرية",
                lesson_id=lesson.id,
            ),
        )
        if verbose:
            logger.info("created question %s for lesson order=%s", i + 1, lesson.order)


def _ensure_orphan_book(*, session: Session, verbose: bool) -> Book:
    return _ensure_book(session=session, title=ORPHAN_BOOK_TITLE, verbose=verbose)


def _ensure_session(
    *,
    session: Session,
    program: Program,
    users_by_email: dict[str, User],
    verbose: bool,
) -> ProgramSession:
    existing_list = crud.get_sessions_by_program(session=session, program_id=program.id)
    if existing_list:
        prog_session = existing_list[0]
        if verbose:
            logger.info("skip session for program %r", program.title)
    else:
        start = date.today() - timedelta(days=7)
        prog_session = crud.create_session(
            session=session,
            session_in=ProgramSessionCreate(
                start_date=start,
                program_id=program.id,
            ),
        )
        if verbose:
            logger.info("created session start=%s", start)

    teacher = users_by_email.get(TEACHER_EMAIL) or crud.get_user_by_email(
        session=session, email=TEACHER_EMAIL
    )
    if teacher:
        crud.add_teacher_to_session(
            session=session, session_id=prog_session.id, user_id=teacher.id
        )

    for email in ACTIVE_STUDENT_EMAILS:
        student = users_by_email.get(email) or crud.get_user_by_email(
            session=session, email=email
        )
        if student:
            crud.add_student_to_session(
                session=session, session_id=prog_session.id, user_id=student.id
            )

    session.refresh(prog_session)
    return prog_session


def _ensure_session_events(
    *,
    session: Session,
    prog_session: ProgramSession,
    lessons: list[Lesson],
    verbose: bool,
) -> None:
    existing = crud.get_session_events_by_session(
        session=session, session_id=prog_session.id
    )
    if existing:
        if verbose:
            logger.info("skip session events (already %s)", len(existing))
        return

    base = prog_session.start_date
    for i, lesson in enumerate(lessons):
        crud.create_session_event(
            session=session,
            event_in=SessionEventCreate(
                event_date=base + timedelta(days=i),
                num_days=1,
                session_id=prog_session.id,
                is_break=False,
                lesson_id=lesson.id,
            ),
        )
    crud.create_session_event(
        session=session,
        event_in=SessionEventCreate(
            event_date=base + timedelta(days=len(lessons)),
            num_days=1,
            session_id=prog_session.id,
            is_break=True,
            lesson_id=None,
        ),
    )
    if verbose:
        logger.info("created %s lesson events + 1 break", len(lessons))


def _ensure_exam(
    *,
    session: Session,
    book: Book,
    prog_session: ProgramSession,
    verbose: bool,
) -> Exam:
    existing = crud.get_exams_by_session(session=session, session_id=prog_session.id)
    for exam in existing:
        if exam.book_id == book.id:
            if verbose:
                logger.info("skip exam for book %r", book.title)
            return exam

    today = date.today()
    exam = crud.create_exam(
        session=session,
        exam_in=ExamCreate(
            start_date=today - timedelta(days=1),
            deadline=today + timedelta(days=14),
            max_attempts=3,
            book_id=book.id,
            session_id=prog_session.id,
        ),
    )
    if verbose:
        logger.info("created exam for book %r", book.title)
    return exam


def _ensure_exam_attempt(
    *,
    session: Session,
    exam: Exam,
    users_by_email: dict[str, User],
    verbose: bool,
) -> None:
    student = users_by_email.get(PRIMARY_STUDENT_EMAIL) or crud.get_user_by_email(
        session=session, email=PRIMARY_STUDENT_EMAIL
    )
    teacher = users_by_email.get(TEACHER_EMAIL) or crud.get_user_by_email(
        session=session, email=TEACHER_EMAIL
    )
    if not student or not teacher:
        logger.warning("skip exam attempt — missing student or teacher")
        return

    existing = crud.get_student_attempts_for_exam(
        session=session, exam_id=exam.id, student_id=student.id
    )
    if existing:
        if verbose:
            logger.info("skip exam attempt for %s", PRIMARY_STUDENT_EMAIL)
        return

    crud.create_exam_attempt(
        session=session,
        attempt_in=ExamAttemptCreate(
            observation="محاولة بذرة تطويرية — لم تكتمل بعد",
            passed=False,
            exam_id=exam.id,
            student_id=student.id,
            examiner_id=teacher.id,
        ),
    )
    if verbose:
        logger.info("created exam attempt for %s", PRIMARY_STUDENT_EMAIL)


def get_seed_programs(*, session: Session) -> list[Program]:
    """Current + legacy seed program titles (for --clean)."""
    return list(
        session.exec(
            select(Program).where(col(Program.title).in_(ALL_SEED_PROGRAM_TITLES))
        ).all()
    )


def get_seed_program(*, session: Session) -> Program | None:
    """Prefer the current title; fall back to any legacy seed program."""
    current = session.exec(
        select(Program).where(Program.title == PROGRAM_TITLE)
    ).first()
    if current:
        return current
    programs = get_seed_programs(session=session)
    return programs[0] if programs else None


def get_seed_books(*, session: Session) -> list[Book]:
    return list(
        session.exec(
            select(Book).where(col(Book.title).in_(ALL_SEED_BOOK_TITLES))
        ).all()
    )
