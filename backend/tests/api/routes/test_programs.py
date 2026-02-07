import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.program import create_random_program


def test_create_program(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    days = ["Sunday", "Monday", "Wednesday", "Thursday"]
    data = {
        "title": "Advanced Quran Studies",
        "days_of_study": days,
    }
    response = client.post(
        f"{settings.API_V1_STR}/programs/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["days_of_study"] == data["days_of_study"]
    assert "id" in content


def test_create_program_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    days = ["Sunday", "Monday"]
    data = {
        "title": "Test Program",
        "days_of_study": days,
    }
    response = client.post(
        f"{settings.API_V1_STR}/programs/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_read_program(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    response = client.get(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == program.title
    assert content["id"] == str(program.id)


def test_read_program_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Program not found"


def test_read_programs(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_program(db)
    create_random_program(db)
    response = client.get(
        f"{settings.API_V1_STR}/programs/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert "count" in content


def test_update_program(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {"title": "Updated Program Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["id"] == str(program.id)


def test_update_program_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"title": "Updated Program"}
    response = client.patch(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404


def test_delete_program(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    response = client.delete(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Program deleted successfully"


def test_delete_program_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_program_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {"title": "Updated Program Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_program_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    response = client.delete(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
