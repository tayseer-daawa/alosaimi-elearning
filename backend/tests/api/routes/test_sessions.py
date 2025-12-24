import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.crud import create_session_event
from app.models import SessionEventCreate
from tests.utils.program import create_random_program
from tests.utils.session import create_random_session
from tests.utils.user import create_random_user


def test_create_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {"start_date": str(date.today()), "program_id": str(program.id)}
    response = client.post(
        f"{settings.API_V1_STR}/sessions/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["start_date"] == data["start_date"]
    assert content["program_id"] == data["program_id"]
    assert "id" in content


def test_create_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {"start_date": str(date.today()), "program_id": str(program.id)}
    response = client.post(
        f"{settings.API_V1_STR}/sessions/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_session_program_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"start_date": str(date.today()), "program_id": str(uuid.uuid4())}
    response = client.post(
        f"{settings.API_V1_STR}/sessions/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Program not found"


def test_read_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    response = client.get(
        f"{settings.API_V1_STR}/sessions/{session.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(session.id)


def test_read_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/sessions/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_read_sessions(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_session(db)
    create_random_session(db)
    response = client.get(
        f"{settings.API_V1_STR}/sessions/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert "count" in content


def test_read_sessions_by_program(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    create_random_session(db)
    response = client.get(
        f"{settings.API_V1_STR}/sessions/program/{program.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_add_student_to_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(session.id)


def test_add_student_to_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_remove_student_from_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    # First add the student
    client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=superuser_token_headers,
    )
    # Then remove
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200


def test_add_teacher_to_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/teachers/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(session.id)


def test_remove_teacher_from_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    # First add the teacher
    client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/teachers/{user.id}",
        headers=superuser_token_headers,
    )
    # Then remove
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}/teachers/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200


def test_delete_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Session deleted successfully"


def test_delete_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_remove_student_from_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_add_teacher_to_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/teachers/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_remove_teacher_from_session_not_admin(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}/teachers/{user.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_create_session_event_as_teacher(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should be able to create session events."""

    session = create_random_session(db)
    data = {
        "event_date": str(date.today()),
        "num_days": 1,
        "is_break": False,
        "session_id": str(session.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/events",
        headers=teacher_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["is_break"] is False
    assert "id" in content


def test_create_session_event_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    """Normal users should NOT be able to create session events."""

    session = create_random_session(db)
    data = {
        "event_date": str(date.today()),
        "num_days": 1,
        "is_break": False,
        "session_id": str(session.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/events",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_session_as_teacher_not_allowed(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should NOT be able to create sessions (admin only)."""

    program = create_random_program(db)
    data = {"start_date": str(date.today()), "program_id": str(program.id)}
    response = client.post(
        f"{settings.API_V1_STR}/sessions/",
        headers=teacher_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_session_as_teacher_not_allowed(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should NOT be able to delete sessions (admin only)."""
    session = create_random_session(db)
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session.id}",
        headers=teacher_token_headers,
    )
    assert response.status_code == 403


def test_add_student_to_session_as_teacher_not_allowed(
    client: TestClient, teacher_token_headers: dict[str, str], db: Session
) -> None:
    """Teachers should NOT be able to add students to sessions (admin only)."""
    session = create_random_session(db)
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session.id}/students/{user.id}",
        headers=teacher_token_headers,
    )
    assert response.status_code == 403


def test_update_session(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test updating a session."""

    session_obj = create_random_session(db)
    new_date = date.today() + timedelta(days=7)
    data = {"start_date": str(new_date)}
    response = client.patch(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["start_date"] == str(new_date)


def test_update_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent session."""

    new_date = date.today() + timedelta(days=7)
    data = {"start_date": str(new_date)}
    response = client.patch(
        f"{settings.API_V1_STR}/sessions/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"


def test_delete_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test deleting a non-existent session."""
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"


def test_add_student_to_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding student to non-existent session or with non-existent user."""
    user = create_random_user(db)
    # Non-existent session
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{uuid.uuid4()}/students/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session or User not found"


def test_remove_student_from_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test removing a student that isn't enrolled."""
    session_obj = create_random_session(db)
    user = create_random_user(db)
    # User is not enrolled, so remove should fail
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/students/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert "not found or not enrolled" in response.json()["detail"]


def test_add_teacher_to_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding teacher to non-existent session."""
    user = create_random_user(db)
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{uuid.uuid4()}/teachers/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session or User not found"


def test_remove_teacher_from_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test removing a teacher that isn't assigned."""
    session_obj = create_random_session(db)
    user = create_random_user(db)
    # User is not assigned as teacher
    response = client.delete(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/teachers/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert "not found or not assigned" in response.json()["detail"]


def test_read_session_events(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading session events."""

    session_obj = create_random_session(db)

    # Create some events
    for i in range(2):
        event_in = SessionEventCreate(
            event_date=date.today(),
            num_days=1,
            session_id=session_obj.id,
            is_break=(i == 1),
        )
        create_session_event(session=db, event_in=event_in)

    response = client.get(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/events",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content
    assert len(content["data"]) >= 2


def test_read_session_lessons(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading session lessons (non-break events)."""

    session_obj = create_random_session(db)

    # Create a lesson event (is_break=False)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    create_session_event(session=db, event_in=event_in)

    response = client.get(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/lessons",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_read_session_breaks(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading session breaks (is_break=True events)."""

    session_obj = create_random_session(db)

    # Create a break event
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=3,
        session_id=session_obj.id,
        is_break=True,
    )
    create_session_event(session=db, event_in=event_in)

    response = client.get(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/breaks",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_create_session_event_session_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test creating event for non-existent session."""
    fake_session_id = uuid.uuid4()
    data = {
        "event_date": str(date.today()),
        "num_days": 1,
        "is_break": False,
        "session_id": str(fake_session_id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{fake_session_id}/events",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"


def test_create_session_event_session_id_mismatch(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test creating event with mismatched session_id in body."""
    session_obj = create_random_session(db)
    different_session_id = uuid.uuid4()
    data = {
        "event_date": str(date.today()),
        "num_days": 1,
        "is_break": False,
        "session_id": str(different_session_id),  # Different from URL
    }
    response = client.post(
        f"{settings.API_V1_STR}/sessions/{session_obj.id}/events",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Event session_id mismatch"
