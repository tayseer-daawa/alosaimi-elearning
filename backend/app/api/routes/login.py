import hmac
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import col, update

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Message, NewPassword, Token, User, UserPublic
from app.utils import (
    FrontendApp,
    generate_password_reset_token,
    generate_reset_password_email,
    get_frontend_host_for_app,
    password_fingerprint,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> User:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(
    email: str,
    session: SessionDep,
    app: FrontendApp = Query(
        default="student",
        description="Which frontend the reset link should open (admin or student).",
    ),
) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)
    # Inactive users cannot reset their password, so don't send them a link.
    if user and user.is_active:
        password_reset_token = generate_password_reset_token(
            email=email, hashed_password=user.hashed_password
        )
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=email,
            token=password_reset_token,
            frontend_host=get_frontend_host_for_app(app),
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return Message(
        message="If a user with this email exists, a recovery email will be sent"
    )


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    token_data = verify_password_reset_token(token=body.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid token")
    email, fingerprint = token_data
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    # The token is only valid for the password it was issued against, so any
    # password change (including a previous reset) invalidates it.
    if not hmac.compare_digest(fingerprint, password_fingerprint(user.hashed_password)):
        raise HTTPException(status_code=400, detail="Invalid token")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    # Update only if the password is still the one we checked. If a concurrent
    # reset with the same token got there first, no row matches.
    result = session.exec(
        update(User)
        .where(
            col(User.id) == user.id,
            col(User.hashed_password) == user.hashed_password,
        )
        .values(hashed_password=get_password_hash(password=body.new_password))
    )
    session.commit()
    if result.rowcount != 1:
        raise HTTPException(status_code=400, detail="Invalid token")
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(
    email: str,
    session: SessionDep,
    app: FrontendApp = Query(
        default="student",
        description="Which frontend the reset link should open (admin or student).",
    ),
) -> HTMLResponse:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(
        email=email, hashed_password=user.hashed_password
    )
    email_data = generate_reset_password_email(
        email_to=user.email,
        email=email,
        token=password_reset_token,
        frontend_host=get_frontend_host_for_app(app),
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject": email_data.subject}
    )
