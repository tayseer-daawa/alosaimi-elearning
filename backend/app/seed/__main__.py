"""Entry point: ``python -m app.seed``."""

from __future__ import annotations

import logging
import sys

from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine
from app.models import User
from app.seed.clean import clean_seed_data
from app.seed.config import parse_seed_config
from app.seed.content import seed_content
from app.seed.data import DEMO_USERS
from app.seed.safety import assert_local_environment
from app.seed.users import seed_users


def main(argv: list[str] | None = None) -> int:
    config = parse_seed_config(argv)
    logging.basicConfig(
        level=logging.INFO if config.verbose else logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )
    logger = logging.getLogger("app.seed")

    assert_local_environment()

    with Session(engine) as session:
        if config.clean:
            logger.info("Cleaning seed-owned rows…")
            clean_seed_data(session=session, verbose=config.verbose)

        users_by_email: dict[str, User] = {}
        if not config.content_only:
            logger.info("Seeding demo users…")
            users_by_email = seed_users(session=session, verbose=config.verbose)

        if not config.users_only:
            logger.info("Seeding learning content…")
            if not users_by_email and config.content_only:
                # Load existing demo users for enrollments
                from app import crud
                from app.seed.data import DEMO_USER_EMAILS

                users_by_email = {
                    email: user
                    for email in DEMO_USER_EMAILS
                    if (user := crud.get_user_by_email(session=session, email=email))
                }
            seed_content(
                session=session,
                users_by_email=users_by_email,
                verbose=config.verbose,
            )

    _print_summary()
    return 0


def _print_summary() -> None:
    lines = [
        "",
        "Dev seed ready (local only).",
        f"  ENVIRONMENT={settings.ENVIRONMENT}  DB host={settings.POSTGRES_SERVER}",
        "",
        "Demo credentials (student UI http://localhost:5174/login):",
        f"  {'Email':<32} {'Password':<14} Role",
        f"  {'-' * 32} {'-' * 14} ----",
    ]
    for u in DEMO_USERS:
        if u["is_teacher"]:
            role = "teacher"
        elif not u["is_active"]:
            role = "inactive student"
        else:
            role = "student"
        lines.append(f"  {u['email']:<32} {u['password']:<14} {role}")
    lines.extend(
        [
            "",
            f"Superuser (from .env): {settings.FIRST_SUPERUSER} "
            "(password = FIRST_SUPERUSER_PASSWORD)",
            "",
        ]
    )
    # Force INFO so the summary always shows even without --verbose
    logging.getLogger("app.seed").setLevel(logging.INFO)
    logging.getLogger("app.seed").info("\n".join(lines))


if __name__ == "__main__":
    sys.exit(main())
