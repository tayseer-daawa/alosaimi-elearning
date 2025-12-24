from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, UserUpdate
from tests.utils.utils import random_email, random_gender_is_male, random_lower_string


def user_authentication_headers(
    *, client: TestClient, email: str, password: str
) -> dict[str, str]:
    data = {"username": email, "password": password}

    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=data)
    response = r.json()
    auth_token = response["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    return headers


def create_random_user(db: Session) -> User:
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(
        email=email,
        password=password,
        first_name=random_lower_string(),
        father_name="",
        family_name=random_lower_string(),
        is_male=random_gender_is_male(),
    )
    user = crud.create_user(session=db, user_create=user_in)
    return user


def create_user_with_details(
    db: Session,
    *,
    email: str | None = None,
    password: str | None = None,
    first_name: str | None = None,
    father_name: str | None = None,
    family_name: str | None = None,
    is_male: bool | None = None,
    **kwargs,
) -> User:
    """Helper to create a user with specified details and defaults for required fields"""
    user_in = UserCreate(
        email=email or random_email(),
        password=password or random_lower_string(),
        first_name=first_name or random_lower_string(),
        father_name=father_name or random_lower_string(),
        family_name=family_name or random_lower_string(),
        is_male=is_male if is_male is not None else random_gender_is_male(),
        **kwargs,
    )
    return crud.create_user(session=db, user_create=user_in)


def authentication_token_from_email(
    *, client: TestClient, email: str, db: Session
) -> dict[str, str]:
    """
    Return a valid token for the user with given email.

    If the user doesn't exist it is created first.
    """
    password = random_lower_string()
    user = crud.get_user_by_email(session=db, email=email)
    if not user:
        user_in_create = UserCreate(
            email=email,
            password=password,
            first_name="Test",
            father_name="",
            family_name="User",
            is_male=random_gender_is_male(),
        )
        user = crud.create_user(session=db, user_create=user_in_create)
    else:
        user_in_update = UserUpdate(password=password)
        if not user.id:
            raise Exception("User id not set")
        user = crud.update_user(session=db, db_user=user, user_in=user_in_update)

    return user_authentication_headers(client=client, email=email, password=password)
