import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.book import create_random_book


def test_create_book(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "title": "Tajweed Book",
        "pdf": "https://example.com/tajweed.pdf",
        "audio": "https://example.com/tajweed.mp3",
    }
    response = client.post(
        f"{settings.API_V1_STR}/books/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["pdf"] == data["pdf"]
    assert content["audio"] == data["audio"]
    assert "id" in content


def test_create_book_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {"title": "Test Book", "pdf": None, "audio": None}
    response = client.post(
        f"{settings.API_V1_STR}/books/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_read_book(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    response = client.get(
        f"{settings.API_V1_STR}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == book.title
    assert content["id"] == str(book.id)


def test_read_book_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/books/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Book not found"


def test_read_books(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_book(db)
    create_random_book(db)
    response = client.get(
        f"{settings.API_V1_STR}/books/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert "count" in content


def test_update_book(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    data = {"title": "Updated Book Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/books/{book.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["id"] == str(book.id)


def test_delete_book(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    response = client.delete(
        f"{settings.API_V1_STR}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Book deleted successfully"


def test_delete_book_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/books/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_book_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    data = {"title": "Updated Book Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/books/{book.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_book_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    response = client.delete(
        f"{settings.API_V1_STR}/books/{book.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_update_book_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent book."""
    data = {"title": "Updated Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/books/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Book not found"
