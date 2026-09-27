from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import jwt
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.crud import create_user
from app.models import User, UserCreate
from app.utils import generate_password_reset_token, password_fingerprint
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


def test_recovery_password_link_targets_requested_frontend(
    client: TestClient, db: Session
) -> None:
    email = random_email()
    password = random_lower_string()
    create_user(
        session=db,
        user_create=UserCreate(
            email=email,
            first_name="Test",
            father_name="",
            family_name="User",
            password=password,
            is_active=True,
            is_superuser=False,
            is_male=True,
        ),
    )

    with (
        patch("app.api.routes.login.send_email") as mock_send,
        patch(
            "app.core.config.settings.FRONTEND_STUDENT_HOST",
            "http://student.test",
        ),
        patch(
            "app.core.config.settings.FRONTEND_ADMIN_HOST",
            "http://admin.test",
        ),
    ):
        r = client.post(f"{settings.API_V1_STR}/password-recovery/{email}")
        assert r.status_code == 200
        student_html = mock_send.call_args.kwargs["html_content"]
        assert "http://student.test/reset-password?token=" in student_html

        r = client.post(
            f"{settings.API_V1_STR}/password-recovery/{email}",
            params={"app": "admin"},
        )
        assert r.status_code == 200
        admin_html = mock_send.call_args.kwargs["html_content"]
        assert "http://admin.test/reset-password?token=" in admin_html


def test_recovery_password_user_not_exits(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    email = "jVgQr@example.com"
    with patch("app.api.routes.login.send_email") as send_email:
        r = client.post(
            f"{settings.API_V1_STR}/password-recovery/{email}",
            headers=normal_user_token_headers,
        )
    assert r.status_code == 200
    assert r.json() == {
        "message": "If a user with this email exists, a recovery email will be sent"
    }
    send_email.assert_not_called()


def test_recovery_password_sends_email_to_active_user(
    client: TestClient, db: Session
) -> None:
    email = random_email()
    user_create = UserCreate(
        email=email,
        first_name="Active",
        father_name="",
        family_name="User",
        password=random_lower_string(),
        is_active=True,
        is_superuser=False,
        is_male=True,
    )
    create_user(session=db, user_create=user_create)

    with patch("app.api.routes.login.send_email") as send_email:
        r = client.post(f"{settings.API_V1_STR}/password-recovery/{email}")
    assert r.status_code == 200
    send_email.assert_called_once()
    assert send_email.call_args.kwargs["email_to"] == email


def test_recovery_password_inactive_user_sends_no_email(
    client: TestClient, db: Session
) -> None:
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
    create_user(session=db, user_create=user_create)

    with patch("app.api.routes.login.send_email") as send_email:
        r = client.post(f"{settings.API_V1_STR}/password-recovery/{email}")
    assert r.status_code == 200
    assert r.json() == {
        "message": "If a user with this email exists, a recovery email will be sent"
    }
    send_email.assert_not_called()


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
    token = generate_password_reset_token(
        email=email, hashed_password=user.hashed_password
    )
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
    token = generate_password_reset_token(email=email, hashed_password="unused")

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
    user = create_user(session=db, user_create=user_create)

    token = generate_password_reset_token(
        email=email, hashed_password=user.hashed_password
    )
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


def _create_active_user(db: Session) -> tuple[User, str]:
    password = random_lower_string()
    user = create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            first_name="Test",
            father_name="",
            family_name="User",
            password=password,
            is_active=True,
            is_superuser=False,
            is_male=True,
        ),
    )
    return user, password


def test_reset_password_token_cannot_be_reused(client: TestClient, db: Session) -> None:
    user, _ = _create_active_user(db)
    token = generate_password_reset_token(
        email=user.email, hashed_password=user.hashed_password
    )
    first_password = random_lower_string()

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": first_password, "token": token},
    )
    assert r.status_code == 200

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": token},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"
    db.refresh(user)
    assert verify_password(first_password, user.hashed_password)


def test_reset_password_invalidates_other_outstanding_tokens(
    client: TestClient, db: Session
) -> None:
    user, _ = _create_active_user(db)
    first_token = generate_password_reset_token(
        email=user.email, hashed_password=user.hashed_password
    )
    second_token = generate_password_reset_token(
        email=user.email, hashed_password=user.hashed_password
    )

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": first_token},
    )
    assert r.status_code == 200

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": second_token},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"


def test_reset_password_token_invalid_after_password_change(
    client: TestClient, db: Session
) -> None:
    user, password = _create_active_user(db)
    token = generate_password_reset_token(
        email=user.email, hashed_password=user.hashed_password
    )
    headers = user_authentication_headers(
        client=client, email=user.email, password=password
    )
    r = client.patch(
        f"{settings.API_V1_STR}/users/me/password",
        headers=headers,
        json={"current_password": password, "new_password": random_lower_string()},
    )
    assert r.status_code == 200

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": token},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"


def test_reset_password_rejects_access_token(client: TestClient, db: Session) -> None:
    user, _ = _create_active_user(db)
    access_token = create_access_token(user.id, expires_delta=timedelta(minutes=5))

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": access_token},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"


def test_reset_password_rejects_token_without_reset_purpose(
    client: TestClient, db: Session
) -> None:
    """A correctly signed token with a valid email and fingerprint, but no purpose."""
    user, _ = _create_active_user(db)
    token = jwt.encode(
        {
            "exp": datetime.now(UTC) + timedelta(minutes=5),
            "sub": user.email,
            "fp": password_fingerprint(user.hashed_password),
        },
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )

    r = client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": random_lower_string(), "token": token},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"


def test_reset_password_rejects_concurrent_password_change(
    client: TestClient, db: Session
) -> None:
    """The password changes between the token check and the write."""
    user, _ = _create_active_user(db)
    token = generate_password_reset_token(
        email=user.email, hashed_password=user.hashed_password
    )
    # What the request reads: the user as it was when the token was issued.
    stale_user = SimpleNamespace(
        id=user.id, hashed_password=user.hashed_password, is_active=True
    )
    # Meanwhile, a concurrent request changes the password.
    concurrent_password = random_lower_string()
    user.hashed_password = get_password_hash(concurrent_password)
    db.add(user)
    db.commit()

    with patch("app.api.routes.login.crud.get_user_by_email", return_value=stale_user):
        r = client.post(
            f"{settings.API_V1_STR}/reset-password/",
            json={"new_password": random_lower_string(), "token": token},
        )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid token"
    db.refresh(user)
    assert verify_password(concurrent_password, user.hashed_password)
