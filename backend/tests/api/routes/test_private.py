from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import User


def test_create_user(client: TestClient, db: Session) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/private/users/",
        json={
            "email": "pollo@listo.com",
            "password": "password123",
            "first_name": "Pollo",
            "father_name": "L",
            "family_name": "Listo",
            "is_male": True,
        },
    )

    assert r.status_code == 200

    data = r.json()

    user = db.exec(select(User).where(User.id == data["id"])).first()

    assert user
    assert user.email == "pollo@listo.com"
    assert user.first_name == "Pollo"
    assert user.father_name == "L"
    assert user.family_name == "Listo"
    assert user.is_male is True
