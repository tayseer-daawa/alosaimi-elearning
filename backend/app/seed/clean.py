"""Delete only seed-owned rows (demo emails + known program/book titles)."""

from __future__ import annotations

import logging

from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import Book, Program
from app.seed.content import get_seed_books, get_seed_programs
from app.seed.data import DEMO_USER_EMAILS

logger = logging.getLogger(__name__)


def clean_seed_data(*, session: Session, verbose: bool = False) -> None:
    """Remove demo users and the seed program graph. Never deletes FIRST_SUPERUSER."""
    for program in get_seed_programs(session=session):
        _clean_program_graph(session=session, program=program, verbose=verbose)

    for book in get_seed_books(session=session):
        if verbose:
            logger.info("delete orphan/seed book %r", book.title)
        crud.delete_book(session=session, book_id=book.id)

    protected = {settings.FIRST_SUPERUSER.lower()}
    for email in DEMO_USER_EMAILS:
        if email.lower() in protected:
            continue
        user = crud.get_user_by_email(session=session, email=email)
        if not user:
            continue
        if verbose:
            logger.info("delete user %s", email)
        session.delete(user)
        session.commit()


def _clean_program_graph(
    *, session: Session, program: Program, verbose: bool
) -> None:
    """Delete attempts → exams → sessions (cascade events/enrollments) → program.

    Books linked only via this program are deleted after program removal if they
    still exist (orphan cleanup also runs separately).
    """
    sessions = crud.get_sessions_by_program(session=session, program_id=program.id)
    for prog_session in sessions:
        exams = crud.get_exams_by_session(session=session, session_id=prog_session.id)
        for exam in exams:
            attempts = crud.get_exam_attempts_by_exam(session=session, exam_id=exam.id)
            for attempt in attempts:
                if verbose:
                    logger.info("delete exam attempt %s", attempt.id)
                crud.delete_exam_attempt(session=session, attempt_id=attempt.id)
            if verbose:
                logger.info("delete exam %s", exam.id)
            crud.delete_exam(session=session, exam_id=exam.id)

        if verbose:
            logger.info("delete session %s", prog_session.id)
        crud.delete_session(session=session, session_id=prog_session.id)

    # Collect book ids before program cascade removes PhaseBook links
    book_ids = [b.id for b in get_seed_books(session=session)]

    if verbose:
        logger.info("delete program %r", program.title)
    crud.delete_program(session=session, program_id=program.id)

    for book_id in book_ids:
        book = session.get(Book, book_id)
        if book:
            if verbose:
                logger.info("delete book %r", book.title)
            crud.delete_book(session=session, book_id=book_id)
