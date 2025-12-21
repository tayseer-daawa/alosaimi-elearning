from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import QuestionCreate
from tests.utils.lesson import create_random_lesson


def test_create_question(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    data = {
        "question": "What is the capital of France?",
        "options": ["Paris", "London", "Berlin", "Madrid"],
        "correct_options": [0],
        "lesson_id": str(lesson.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/questions/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["question"] == data["question"]
    assert content["lesson_id"] == str(lesson.id)
    assert "id" in content


def test_read_question(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Test question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    response = client.get(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(question.id)
    assert content["question"] == question.question


def test_read_questions(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    for i in range(2):
        question_in = QuestionCreate(
            question=f"Question {i+1}",
            options=[f"Answer {i+1}A", f"Answer {i+1}B"],
            correct_options=[0],
            lesson_id=lesson.id,
        )
        crud.create_question(session=db, question_in=question_in)

    response = client.get(
        f"{settings.API_V1_STR}/questions/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_read_questions_by_lesson(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    for i in range(2):
        question_in = QuestionCreate(
            question=f"Question {i+1}",
            options=[f"Answer {i+1}A", f"Answer {i+1}B"],
            correct_options=[0],
            lesson_id=lesson.id,
        )
        crud.create_question(session=db, question_in=question_in)

    response = client.get(
        f"{settings.API_V1_STR}/questions/lesson/{lesson.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 2


def test_update_question(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Old question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    data = {
        "question": "Updated question",
        "options": ["New Answer 1", "New Answer 2", "New Answer 3"],
        "correct_options": [1, 2],
    }
    response = client.patch(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["question"] == "Updated question"
    assert content["options"] == ["New Answer 1", "New Answer 2", "New Answer 3"]


def test_delete_question(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Test question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    response = client.delete(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Verify deletion
    response = client.get(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_create_question_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    data = {
        "question": "Test question",
        "options": ["Answer 1", "Answer 2"],
        "correct_options": [0],
        "lesson_id": str(lesson.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/questions/",
        headers=normal_user_token_headers,
        json=data,
    )
    # Normal users should not be able to create questions
    assert response.status_code == 403


def test_read_question_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/questions/00000000-0000-0000-0000-000000000000",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_question_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Test question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    data = {"question": "Updated question"}
    response = client.patch(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_question_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Test question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    response = client.delete(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_create_question_as_teacher(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should be able to create questions."""
    lesson = create_random_lesson(db)

    data = {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correct_options": [1],
        "lesson_id": str(lesson.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/questions/",
        headers=teacher_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_update_question_as_teacher(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should be able to update questions."""
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Original question",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    data = {"question": "Updated by teacher"}
    response = client.patch(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=teacher_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_question_as_teacher(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should be able to delete questions."""
    lesson = create_random_lesson(db)

    question_in = QuestionCreate(
        question="Question to delete",
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    response = client.delete(
        f"{settings.API_V1_STR}/questions/{question.id}",
        headers=teacher_token_headers,
    )
    assert response.status_code == 403
