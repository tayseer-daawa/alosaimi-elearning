import uuid
from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import Session as SessionModel
from app.models import TokenPayload, User
from app.models.exam import Exam, ExamAttempt

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_admin_or_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_admin and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_teacher_or_admin(current_user: CurrentUser) -> User:
    if (
        not current_user.is_teacher
        and not current_user.is_admin
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_session_for_current_user(
    session: SessionDep, session_id: uuid.UUID, current_user: CurrentUser
) -> uuid.UUID:
    if current_user.is_admin or current_user.is_superuser:
        return session_id
    current_session = session.get(SessionModel, session_id)
    if not current_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if (
        current_session not in current_user.student_sessions
        and current_session not in current_user.teacher_sessions
    ):
        raise HTTPException(
            status_code=403, detail="You are not enrolled/teaching this session"
        )
    return session_id


SessionIDCurrentUser = Annotated[uuid.UUID, Depends(get_session_for_current_user)]


def get_exam_for_current_user(
    session: SessionDep, exam_id: uuid.UUID, current_user: CurrentUser
) -> uuid.UUID:
    if current_user.is_admin or current_user.is_superuser:
        return exam_id
    current_exam = session.get(Exam, exam_id)
    if not current_exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if (
        current_exam.session not in current_user.student_sessions
        and current_exam.session not in current_user.teacher_sessions
    ):
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled/teaching the session for this exam",
        )
    return exam_id


ExamIDCurrentUser = Annotated[uuid.UUID, Depends(get_exam_for_current_user)]


def get_exam_for_current_teacher(
    session: SessionDep, exam_id: uuid.UUID, current_user: CurrentUser
) -> uuid.UUID:
    if current_user.is_admin or current_user.is_superuser:
        return exam_id
    current_exam = session.get(Exam, exam_id)
    if not current_exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_exam.session not in current_user.teacher_sessions:
        raise HTTPException(
            status_code=403,
            detail="You are not teaching the session for this exam",
        )
    return exam_id


ExamIDCurrentTeacher = Annotated[uuid.UUID, Depends(get_exam_for_current_teacher)]


def get_attempt_for_current_examiner(
    session: SessionDep, attempt_id: uuid.UUID, current_user: CurrentUser
) -> uuid.UUID:
    if current_user.is_admin or current_user.is_superuser:
        return attempt_id
    current_attempt = session.get(ExamAttempt, attempt_id)
    if not current_attempt:
        raise HTTPException(status_code=404, detail="Exam attempt not found")

    if current_attempt.examiner != current_user:
        raise HTTPException(
            status_code=403,
            detail="You are not the examiner of this exam attempt",
        )
    return attempt_id


ExamAttemptIDCurrentExaminer = Annotated[
    uuid.UUID, Depends(get_attempt_for_current_examiner)
]
