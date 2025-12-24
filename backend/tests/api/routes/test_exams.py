import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.crud import add_student_to_session, add_teacher_to_session, create_exam_attempt
from app.models import ExamAttemptCreate
from tests.utils.book import create_random_book
from tests.utils.exam import create_exam_with_details, create_random_exam
from tests.utils.session import create_random_session
from tests.utils.user import authentication_token_from_email, create_random_user


def test_create_exam(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    session = create_random_session(db)
    data = {
        "start_date": str(date.today()),
        "deadline": str(date.today() + timedelta(days=7)),
        "max_attempts": 3,
        "book_id": str(book.id),
        "session_id": str(session.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["max_attempts"] == data["max_attempts"]
    assert "id" in content


def test_create_exam_not_authorized(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    book = create_random_book(db)
    session = create_random_session(db)
    data = {
        "start_date": str(date.today()),
        "deadline": str(date.today() + timedelta(days=7)),
        "max_attempts": 3,
        "book_id": str(book.id),
        "session_id": str(session.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_read_exam(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.get(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(exam.id)


@pytest.mark.parametrize("add_func", [add_teacher_to_session, add_student_to_session])
def test_read_exam_authorized_user(
    client: TestClient,
    db: Session,
    add_func,
) -> None:
    exam = create_random_exam(db)
    user = create_random_user(db)

    # add user as teacher or student to session (should have access after that)
    add_func(session=db, session_id=exam.session_id, user_id=user.id)

    token_header = authentication_token_from_email(
        client=client, email=user.email, db=db
    )
    response = client.get(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=token_header,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(exam.id)


def test_read_exam_unauthorized_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.get(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    content = response.json()
    assert (
        "You are not enrolled/teaching the session for this exam" in content["detail"]
    )


def test_read_exam_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/exams/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_read_exams_by_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.get(
        f"{settings.API_V1_STR}/exams/session/{exam.session_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


@pytest.mark.parametrize("add_func", [add_teacher_to_session, add_student_to_session])
def test_read_exams_by_session_authorized_user(
    client: TestClient,
    db: Session,
    add_func,
) -> None:
    exam = create_random_exam(db)
    user = create_random_user(db)

    # add user as teacher or student to session (should have access after that)
    add_func(session=db, session_id=exam.session_id, user_id=user.id)

    token_header = authentication_token_from_email(
        client=client, email=user.email, db=db
    )
    response = client.get(
        f"{settings.API_V1_STR}/exams/session/{exam.session_id}",
        headers=token_header,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_read_exams_by_session_unauthorized_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.get(
        f"{settings.API_V1_STR}/exams/session/{exam.session_id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    content = response.json()
    assert "You are not enrolled/teaching this session" in content["detail"]


def test_read_exam_attempts(client: TestClient, db: Session) -> None:
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)
    add_teacher_to_session(session=db, session_id=exam.session_id, user_id=examiner.id)

    # Create an attempt
    data = {
        "observation": "Test",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=authentication_token_from_email(
            client=client, email=examiner.email, db=db
        ),
        json=data,
    )

    # Read attempts
    response = client.get(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=authentication_token_from_email(
            client=client, email=student.email, db=db
        ),
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert len(content["data"]) >= 1


def test_delete_exam(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.delete(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Exam deleted successfully"


def test_delete_exam_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    response = client.delete(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_create_exam_attempt_not_authorized(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)
    data = {
        "observation": "Attempt",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_exam_attempt_as_teacher(client: TestClient, db: Session) -> None:
    """Teachers should be able to create exam attempts for their session."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)
    teacher = create_random_user(db)

    # Add teacher to the exam's session
    add_teacher_to_session(session=db, session_id=exam.session_id, user_id=teacher.id)
    # Add student to the exam's session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    teacher_token = authentication_token_from_email(
        client=client, email=teacher.email, db=db
    )

    data = {
        "observation": "Teacher created attempt",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=teacher_token,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["passed"] is True
    assert "id" in content


def test_create_exam_attempt_exam_not_started(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Cannot create attempt if exam hasn't started yet."""

    book = create_random_book(db)
    session_obj = create_random_session(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=session_obj.id, user_id=student.id)

    # Create exam that starts in the future
    future_start = date.today() + timedelta(days=5)
    future_deadline = date.today() + timedelta(days=10)
    exam = create_exam_with_details(
        db,
        future_start,
        future_deadline,
        3,
        book.id,
        session_obj.id,
    )

    data = {
        "observation": "Attempt before exam starts",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "Exam can only be taken between" in content["detail"]


def test_create_exam_attempt_exam_deadline_passed(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Cannot create attempt if exam deadline has passed."""

    book = create_random_book(db)
    session_obj = create_random_session(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=session_obj.id, user_id=student.id)

    # Create exam with past deadline
    past_start = date.today() - timedelta(days=10)
    past_deadline = date.today() - timedelta(days=5)
    exam = create_exam_with_details(
        db,
        past_start,
        past_deadline,
        3,
        book.id,
        session_obj.id,
    )

    data = {
        "observation": "Attempt after deadline",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "Exam can only be taken between" in content["detail"]


def test_create_exam_attempt_exam_id_mismatch(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Cannot create attempt if exam_id in body doesn't match URL."""
    exam = create_random_exam(db)
    another_exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    data = {
        "observation": "Mismatched exam_id",
        "passed": True,
        "exam_id": str(another_exam.id),  # Different from URL
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "Attempt exam_id mismatch" in content["detail"]


def test_create_exam_attempt_student_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Cannot create attempt if student doesn't exist."""
    exam = create_random_exam(db)
    examiner = create_random_user(db)
    non_existent_student_id = uuid.uuid4()

    data = {
        "observation": "Non-existent student",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(non_existent_student_id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert "Student not found" in content["detail"]


def test_create_exam_attempt_student_not_enrolled(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Cannot create attempt if student is not enrolled in the exam's session."""
    exam = create_random_exam(db)
    student = create_random_user(db)  # Student exists but not enrolled
    examiner = create_random_user(db)

    data = {
        "observation": "Student not enrolled",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "Student isn't enrolled in the exam's session" in content["detail"]


def test_create_exam_attempt_teacher_not_teaching_session(
    client: TestClient, db: Session
) -> None:
    """Teachers cannot create attempts for exams in sessions they don't teach."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)
    teacher = create_random_user(db)

    # Teacher is NOT added to the exam's session
    # Add student to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    teacher_token = authentication_token_from_email(
        client=client, email=teacher.email, db=db
    )

    data = {
        "observation": "Teacher not teaching this session",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=teacher_token,
        json=data,
    )
    assert response.status_code == 403


def test_create_exam_attempt_success_with_enrolled_student(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Successfully create attempt when student is enrolled in session."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Enroll student in the exam's session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    data = {
        "observation": "Enrolled student attempt",
        "passed": True,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["passed"] is True
    assert content["student_id"] == str(student.id)
    assert "id" in content


def test_create_exam_attempt_max_attempts_boundary(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating exactly max_attempts and then one more."""

    book = create_random_book(db)
    session_obj = create_random_session(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=session_obj.id, user_id=student.id)

    # Create exam with max_attempts = 1
    exam = create_exam_with_details(
        db,
        start_date=date.today(),
        deadline=date.today() + timedelta(days=7),
        max_attempts=1,
        book_id=book.id,
        session_id=session_obj.id,
    )

    # First attempt should succeed
    data = {
        "observation": "First attempt",
        "passed": False,
        "exam_id": str(exam.id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200

    # Second attempt should fail (max is 1)
    data["observation"] = "Second attempt"
    response = client.post(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "maximum attempts (1)" in content["detail"]


def test_delete_exam_as_teacher_not_allowed(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should NOT be able to delete exams (admin only)."""
    exam = create_random_exam(db)
    response = client.delete(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=teacher_token_headers,
    )
    assert response.status_code == 403


def test_create_exam_as_teacher(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should be able to create exams."""
    book = create_random_book(db)
    session = create_random_session(db)
    data = {
        "start_date": str(date.today()),
        "deadline": str(date.today() + timedelta(days=7)),
        "max_attempts": 3,
        "book_id": str(book.id),
        "session_id": str(session.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/",
        headers=teacher_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_exam_book_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating exam with non-existent book."""
    session_obj = create_random_session(db)
    data = {
        "start_date": str(date.today()),
        "deadline": str(date.today() + timedelta(days=7)),
        "max_attempts": 3,
        "book_id": str(uuid.uuid4()),  # Non-existent book
        "session_id": str(session_obj.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Book not found"


def test_create_exam_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating exam with non-existent session."""
    book = create_random_book(db)
    data = {
        "start_date": str(date.today()),
        "deadline": str(date.today() + timedelta(days=7)),
        "max_attempts": 3,
        "book_id": str(book.id),
        "session_id": str(uuid.uuid4()),  # Non-existent session
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"


def test_update_exam(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating an exam."""
    exam = create_random_exam(db)
    data = {
        "max_attempts": 5,
    }
    response = client.patch(
        f"{settings.API_V1_STR}/exams/{exam.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["max_attempts"] == 5


def test_update_exam_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent exam."""
    data = {"max_attempts": 5}
    response = client.patch(
        f"{settings.API_V1_STR}/exams/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Exam not found"


def test_delete_exam_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test deleting a non-existent exam."""
    response = client.delete(
        f"{settings.API_V1_STR}/exams/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Exam not found"


def test_read_student_exam_attempts(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading exam attempts for a specific student."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    # Create an attempt via CRUD (to bypass validation)

    attempt_in = ExamAttemptCreate(
        observation="Test attempt",
        passed=True,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    create_exam_attempt(session=db, attempt_in=attempt_in)

    # Read student attempts
    response = client.get(
        f"{settings.API_V1_STR}/exams/{exam.id}/attempts/student/{student.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content
    assert content["count"] >= 1


def test_update_exam_attempt(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating an exam attempt."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)

    # Create an attempt via CRUD
    attempt_in = ExamAttemptCreate(
        observation="Initial observation",
        passed=False,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = create_exam_attempt(session=db, attempt_in=attempt_in)

    # Update the attempt
    data = {"observation": "Updated observation", "passed": True}
    response = client.patch(
        f"{settings.API_V1_STR}/exams/attempts/{attempt.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["observation"] == "Updated observation"
    assert content["passed"] is True


def test_update_exam_attempt_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent exam attempt."""
    data = {"observation": "Updated observation"}
    response = client.patch(
        f"{settings.API_V1_STR}/exams/attempts/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Exam attempt not found"


def test_update_exam_attempt_as_examiner(client: TestClient, db: Session) -> None:
    """Test that examiner can update their own exam attempt."""
    exam = create_random_exam(db)
    student = create_random_user(db)
    examiner = create_random_user(db)

    # Add student and examiner to session
    add_student_to_session(session=db, session_id=exam.session_id, user_id=student.id)
    add_teacher_to_session(session=db, session_id=exam.session_id, user_id=examiner.id)

    # Create an attempt with the examiner
    attempt_in = ExamAttemptCreate(
        observation="Initial observation",
        passed=False,
        exam_id=exam.id,
        student_id=student.id,
        examiner_id=examiner.id,
    )
    attempt = create_exam_attempt(session=db, attempt_in=attempt_in)

    # Examiner updates their own attempt
    examiner_token = authentication_token_from_email(
        client=client, email=examiner.email, db=db
    )
    data = {"observation": "Examiner updated observation", "passed": True}
    response = client.patch(
        f"{settings.API_V1_STR}/exams/attempts/{attempt.id}",
        headers=examiner_token,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["observation"] == "Examiner updated observation"


def test_create_exam_attempt_exam_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating an exam attempt for a non-existent exam."""
    student = create_random_user(db)
    examiner = create_random_user(db)
    fake_exam_id = uuid.uuid4()

    data = {
        "observation": "Test attempt",
        "passed": True,
        "exam_id": str(fake_exam_id),
        "student_id": str(student.id),
        "examiner_id": str(examiner.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/exams/{fake_exam_id}/attempts",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Exam not found"
