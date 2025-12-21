import uuid
from datetime import date

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
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
    from datetime import date

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
    from datetime import date

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
    from tests.utils.program import create_random_program

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
