from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.core.security import verify_password
from app.crud import create_user
from app.models import UserCreate
from app.utils import generate_password_reset_token
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_email, random_lower_string


def test_get_access_token(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]


def test_get_access_token_incorrect_password(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": "incorrect",
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    assert r.status_code == 400


def test_use_access_token(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers=superuser_token_headers,
    )
    result = r.json()
    assert r.status_code == 200
    assert "email" in result


def test_recovery_password(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    with (
        patch("app.core.config.settings.SMTP_HOST", "smtp.example.com"),
        patch("app.core.config.settings.SMTP_USER", "admin@example.com"),
    ):
        email = "test@example.com"
        r = client.post(
            f"{settings.API_V1_STR}/password-recovery/{email}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 200
        assert r.json() == {
            "message": "If a user with this email exists, a recovery email will be sent"
        }


def test_recovery_password_user_not_exits(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    email = "jVgQr@example.com"
    r = client.post(
        f"{settings.API_V1_STR}/password-recovery/{email}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {
        "message": "If a user with this email exists, a recovery email will be sent"
    }


def test_reset_password(client: TestClient, db: Session) -> None:
    email = random_email()
    password = random_lower_string()
    new_password = random_lower_string()

    user_create = UserCreate(
        email=email,
        first_name="Test",
        father_name="",
        family_name="User",
        password=password,
        is_active=True,
        is_superuser=False,
        is_male=True,
    )
    user = create_user(session=db, user_create=user_create)
    token = generate_password_reset_token(email=email)
    headers = user_authentication_headers(client=client, email=email, password=password)
    data = {"new_password": new_password, "token": token}

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        headers=headers,
        json=data,
    )

    assert r.status_code == 200
    assert r.json() == {"message": "Password updated successfully"}

    db.refresh(user)
    assert verify_password(new_password, user.hashed_password)


def test_reset_password_invalid_token(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"new_password": "changethis", "token": "invalid"}
    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        headers=superuser_token_headers,
        json=data,
    )
    response = r.json()

    assert "detail" in response
    assert r.status_code == 400
    assert response["detail"] == "Invalid token"


def test_login_inactive_user(client: TestClient, db: Session) -> None:
    """Test login with inactive user."""
    email = random_email()
    password = random_lower_string()

    user_create = UserCreate(
        email=email,
        first_name="Inactive",
        father_name="",
        family_name="User",
        password=password,
        is_active=False,  # Inactive user
        is_superuser=False,
        is_male=True,
    )
    create_user(session=db, user_create=user_create)

    login_data = {
        "username": email,
        "password": password,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    assert r.status_code == 400
    assert r.json()["detail"] == "Inactive user"


def test_reset_password_user_not_found(client: TestClient) -> None:
    """Test reset password with valid token but user doesn't exist anymore."""
    email = random_email()
    # Generate token for a non-existent user
    token = generate_password_reset_token(email=email)

    data = {"new_password": random_lower_string(), "token": token}
    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json=data,
    )
    assert r.status_code == 404
    assert "does not exist" in r.json()["detail"]


def test_reset_password_inactive_user(client: TestClient, db: Session) -> None:
    """Test reset password with inactive user."""
    email = random_email()
    password = random_lower_string()

    user_create = UserCreate(
        email=email,
        first_name="Inactive",
        father_name="",
        family_name="User",
        password=password,
        is_active=False,  # Inactive user
        is_superuser=False,
        is_male=True,
    )
    create_user(session=db, user_create=user_create)

    token = generate_password_reset_token(email=email)
    data = {"new_password": random_lower_string(), "token": token}

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json=data,
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Inactive user"


def test_password_recovery_html_content(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test password recovery HTML content endpoint."""
    email = random_email()
    password = random_lower_string()

    user_create = UserCreate(
        email=email,
        first_name="Test",
        father_name="",
        family_name="User",
        password=password,
        is_active=True,
        is_superuser=False,
        is_male=True,
    )
    create_user(session=db, user_create=user_create)

    r = client.post(
        f"{settings.API_V1_STR}/password-recovery-html-content/{email}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    # Response is HTML content
    assert "text/html" in r.headers["content-type"]


def test_password_recovery_html_content_user_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test password recovery HTML content for non-existent user."""
    non_existent_email = random_email()

    r = client.post(
        f"{settings.API_V1_STR}/password-recovery-html-content/{non_existent_email}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert "does not exist" in r.json()["detail"]


def test_password_recovery_html_content_not_superuser(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Test password recovery HTML content endpoint requires superuser."""
    email = random_email()
    password = random_lower_string()

    user_create = UserCreate(
        email=email,
        first_name="Test",
        father_name="",
        family_name="User",
        password=password,
        is_active=True,
        is_superuser=False,
        is_male=True,
    )
    create_user(session=db, user_create=user_create)

    r = client.post(
        f"{settings.API_V1_STR}/password-recovery-html-content/{email}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 403
