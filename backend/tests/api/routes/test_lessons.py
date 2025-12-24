import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import LessonCreate
from tests.utils.book import create_random_book
from tests.utils.lesson import create_random_lesson


def test_create_lesson(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    data = {
        "book_part_pdf": "https://example.com/part.pdf",
        "book_part_audio": "https://example.com/part.mp3",
        "lesson_audio": "https://example.com/lesson.mp3",
        "explanation_notes": "Sample lesson notes",
        "book_id": str(book.id),
        "order": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/lessons/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["book_part_pdf"] == data["book_part_pdf"]
    assert content["book_id"] == str(book.id)
    assert "id" in content


def test_create_lesson_duplicate_order(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test that creating a lesson with duplicate order for the same book fails."""
    book = create_random_book(db)

    # Create first lesson with order 1
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=1,
    )
    crud.create_lesson(session=db, lesson_in=lesson_in)

    # Try to create another lesson with the same order for the same book
    data = {
        "book_part_pdf": "https://example.com/part2.pdf",
        "book_part_audio": "https://example.com/part2.mp3",
        "lesson_audio": "https://example.com/lesson2.mp3",
        "explanation_notes": "Other notes",
        "book_id": str(book.id),
        "order": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/lessons/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "already exists" in content["detail"]


def test_read_lesson(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    response = client.get(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(lesson.id)


def test_read_lessons_by_book(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    for i in range(2):
        lesson_in = LessonCreate(
            book_part_pdf="https://example.com/part.pdf",
            book_part_audio="https://example.com/part.mp3",
            lesson_audio="https://example.com/lesson.mp3",
            explanation_notes="Notes",
            book_id=book.id,
            order=i,
        )
        crud.create_lesson(session=db, lesson_in=lesson_in)

    response = client.get(
        f"{settings.API_V1_STR}/lessons/book/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 2


def test_update_lesson(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    data = {
        "book_part_pdf": "https://example.com/updated.pdf",
        "explanation_notes": "Updated notes",
    }
    response = client.patch(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["book_part_pdf"] == "https://example.com/updated.pdf"
    assert content["explanation_notes"] == "Updated notes"


def test_delete_lesson(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    response = client.delete(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Verify deletion
    response = client.get(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_create_lesson_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    data = {
        "book_part_pdf": "https://example.com/part.pdf",
        "book_part_audio": "https://example.com/part.mp3",
        "lesson_audio": "https://example.com/lesson.mp3",
        "explanation_notes": "Notes",
        "book_id": str(book.id),
        "order": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/lessons/",
        headers=normal_user_token_headers,
        json=data,
    )
    # Normal users should not be able to create lessons
    assert response.status_code == 403


def test_read_lesson_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/lessons/00000000-0000-0000-0000-000000000000",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_lesson_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)
    data = {"explanation_notes": "Updated notes"}
    response = client.patch(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_lesson_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)
    response = client.delete(
        f"{settings.API_V1_STR}/lessons/{lesson.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_create_lesson_book_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test creating a lesson with non-existent book."""
    data = {
        "book_part_pdf": "https://example.com/part.pdf",
        "book_part_audio": "https://example.com/part.mp3",
        "lesson_audio": "https://example.com/lesson.mp3",
        "explanation_notes": "Sample lesson notes",
        "book_id": str(uuid.uuid4()),  # Non-existent book
        "order": 1,
    }
    response = client.post(
        f"{settings.API_V1_STR}/lessons/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Book not found"


def test_update_lesson_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent lesson."""
    data = {"explanation_notes": "Updated notes"}
    response = client.patch(
        f"{settings.API_V1_STR}/lessons/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Lesson not found"


def test_delete_lesson_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test deleting a non-existent lesson."""
    response = client.delete(
        f"{settings.API_V1_STR}/lessons/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Lesson not found"
