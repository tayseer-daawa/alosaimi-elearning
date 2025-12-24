"""Tests for api/deps.py to cover edge cases"""

import uuid
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core import security
from app.core.config import settings
from app.crud import add_student_to_session
from app.models import ExamAttemptCreate, UserCreate
from tests.utils.exam import create_random_exam
from tests.utils.user import (
    authentication_token_from_email,
    create_random_user,
)
from tests.utils.utils import random_email, random_lower_string


def test_get_current_user_invalid_token(client: TestClient) -> None:
    """Test that invalid token returns 403."""
    headers = {"Authorization": "Bearer invalidtoken123"}
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=headers,
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Could not validate credentials"


def test_get_current_user_malformed_token(client: TestClient) -> None:
    """Test that malformed token returns 403."""
    # A token with invalid format
    headers = {"Authorization": "Bearer not.a.validjwt"}
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=headers,
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Could not validate credentials"


def test_get_current_user_user_not_found(client: TestClient) -> None:
    """Test that token for deleted user returns 404."""

    # Create a token for a non-existent user ID
    fake_user_id = uuid.uuid4()
    token = security.create_access_token(
        fake_user_id, expires_delta=timedelta(minutes=30)
    )
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"


def test_get_current_user_inactive_user(client: TestClient, db: Session) -> None:
    """Test that inactive user returns 400."""

    # Create an inactive user
    email = random_email()
    user_create = UserCreate(
        email=email,
        first_name="Inactive",
        father_name="",
        family_name="User",
        password=random_lower_string(),
        is_active=False,
        is_superuser=False,
        is_male=True,
    )
    user = crud.create_user(session=db, user_create=user_create)

    # Create a valid token for this user
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=30))
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=headers,
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Inactive user"


def test_get_session_for_current_user_session_not_found(
    client: TestClient, db: Session
) -> None:
    """Test accessing non-existent session returns 404."""
    user = create_random_user(db)
    token_headers = authentication_token_from_email(
        client=client, email=user.email, db=db
    )

    # Try to access exams for a non-existent session
    fake_session_id = uuid.uuid4()
    r = client.get(
        f"{settings.API_V1_STR}/exams/session/{fake_session_id}",
        headers=token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Session not found"


def test_get_exam_for_current_user_exam_not_found(
    client: TestClient, db: Session
) -> None:
    """Test accessing non-existent exam returns 404."""
    user = create_random_user(db)
    token_headers = authentication_token_from_email(
        client=client, email=user.email, db=db
    )

    # Try to access a non-existent exam
    fake_exam_id = uuid.uuid4()
    r = client.get(
        f"{settings.API_V1_STR}/exams/{fake_exam_id}",
        headers=token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Exam not found"


def test_get_exam_for_current_teacher_exam_not_found(
    client: TestClient, db: Session
) -> None:
    """Test creating attempt for non-existent exam returns 404."""
    user = create_random_user(db)
    token_headers = authentication_token_from_email(
        client=client, email=user.email, db=db
    )

    # Try to create an attempt for a non-existent exam
    fake_exam_id = uuid.uuid4()
    data = {
        "observation": "Test",
        "passed": True,
        "exam_id": str(fake_exam_id),
        "student_id": str(uuid.uuid4()),
        "examiner_id": str(uuid.uuid4()),
    }
    r = client.post(
        f"{settings.API_V1_STR}/exams/{fake_exam_id}/attempts",
        headers=token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Exam not found"


def test_get_attempt_for_current_examiner_attempt_not_found(
    client: TestClient, db: Session
) -> None:
    """Test updating non-existent attempt returns 404."""
    user = create_random_user(db)
    token_headers = authentication_token_from_email(
        client=client, email=user.email, db=db
    )

    # Try to update a non-existent attempt
    fake_attempt_id = uuid.uuid4()
    data = {"observation": "Updated"}
    r = client.patch(
        f"{settings.API_V1_STR}/exams/attempts/{fake_attempt_id}",
        headers=token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Exam attempt not found"


def test_get_attempt_for_current_examiner_not_examiner(
    client: TestClient, db: Session
) -> None:
    """Test updating attempt by non-examiner returns 403."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)
    other_user = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    # Create an attempt with a specific examiner
    attempt_in = ExamAttemptCreate(
        observation="Test",
        passed=False,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = crud.create_exam_attempt(session=db, attempt_in=attempt_in)

    # Try to update the attempt as a different user (not the examiner, not admin)
    other_user_token = authentication_token_from_email(
        client=client, email=other_user.email, db=db
    )
    data = {"observation": "Hacked!"}
    r = client.patch(
        f"{settings.API_V1_STR}/exams/attempts/{attempt.id}",
        headers=other_user_token,
        json=data,
    )
    assert r.status_code == 403
    assert "not the examiner" in r.json()["detail"]
