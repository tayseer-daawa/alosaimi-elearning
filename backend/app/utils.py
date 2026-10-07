import hashlib
import hmac
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Literal

import jwt
from emails.message import Message
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings
from app.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PASSWORD_RESET_TOKEN_PURPOSE = "password-reset"

FrontendApp = Literal["admin", "student"]


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    assert settings.EMAILS_FROM_EMAIL is not None
    message = Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(
    email_to: str,
    email: str,
    token: str,
    *,
    frontend_host: str,
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{frontend_host}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def get_frontend_host_for_app(app: FrontendApp) -> str:
    """Base URL of the given frontend app, without a trailing slash."""
    host = (
        settings.FRONTEND_ADMIN_HOST
        if app == "admin"
        else settings.FRONTEND_STUDENT_HOST
    )
    return host.rstrip("/")


def get_frontend_host_for_user(user: User) -> str:
    """
    Base URL of the app the user signs in to:
    The admin app for staff, the student app for everyone else.
    """
    is_staff = user.is_superuser or user.is_admin or user.is_teacher
    return get_frontend_host_for_app("admin" if is_staff else "student")


def generate_new_account_email(
    email_to: str, username: str, token: str, frontend_host: str
) -> EmailData:
    """
    The email carries a single-use link to set the password, never the password itself.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": f"{frontend_host}/reset-password?token={token}",
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def password_fingerprint(hashed_password: str) -> str:
    """
    Fingerprint of a password hash, embedded in reset tokens so that a token stops
    working once the password changes. HMAC-keyed: the raw hash must never appear in a
    token, because anyone holding the link can read its payload.
    """
    return hmac.new(
        settings.SECRET_KEY.encode(), hashed_password.encode(), hashlib.sha256
    ).hexdigest()


def generate_password_reset_token(email: str, hashed_password: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {
            "exp": exp,
            "nbf": now,
            "sub": email,
            "purpose": PASSWORD_RESET_TOKEN_PURPOSE,
            "fp": password_fingerprint(hashed_password),
        },
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> tuple[str, str] | None:
    """Return (email, password fingerprint) for a valid reset token, else None."""
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
    except InvalidTokenError:
        return None
    email = decoded_token.get("sub")
    fingerprint = decoded_token.get("fp")
    if (
        decoded_token.get("purpose") != PASSWORD_RESET_TOKEN_PURPOSE
        or not isinstance(email, str)
        or not isinstance(fingerprint, str)
    ):
        return None
    return email, fingerprint
