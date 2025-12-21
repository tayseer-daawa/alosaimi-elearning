from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import User
from tests.utils.user import (
    authentication_token_from_email,
    create_user_with_details,
    user_authentication_headers,
)
from tests.utils.utils import get_superuser_token_headers, random_lower_string


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        init_db(session)
        yield session
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )


@pytest.fixture(scope="module")
def teacher_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    """Create a teacher user and return their authentication headers."""
    email = f"teacher_{random_lower_string()}@example.com"
    password = random_lower_string()
    user = create_user_with_details(db, email=email, password=password, is_teacher=True)
    user.is_teacher = True

    return user_authentication_headers(client=client, email=email, password=password)
