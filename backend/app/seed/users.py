"""Seed demo users — skip if email already exists (never overwrite passwords)."""

from __future__ import annotations

import logging

from sqlmodel import Session

from app import crud
from app.models import User, UserCreate
from app.seed.data import DEMO_USERS, DemoUser

logger = logging.getLogger(__name__)


def seed_users(*, session: Session, verbose: bool = False) -> dict[str, User]:
    """Create demo users. Returns email → User for every DEMO_USERS entry."""
    by_email: dict[str, User] = {}
    for spec in DEMO_USERS:
        user = _ensure_user(session=session, spec=spec, verbose=verbose)
        by_email[spec["email"]] = user
    return by_email


def _ensure_user(*, session: Session, spec: DemoUser, verbose: bool) -> User:
    existing = crud.get_user_by_email(session=session, email=spec["email"])
    if existing:
        if verbose:
            logger.info("skip user %s (already exists)", spec["email"])
        return existing

    user_in = UserCreate(
        email=spec["email"],
        password=spec["password"],
        first_name=spec["first_name"],
        father_name=spec["father_name"],
        family_name=spec["family_name"],
        is_male=spec["is_male"],
        is_teacher=spec["is_teacher"],
        is_active=spec["is_active"],
        is_superuser=False,
        is_admin=False,
    )
    user = crud.create_user(session=session, user_create=user_in)
    if verbose:
        logger.info("created user %s", spec["email"])
    return user
