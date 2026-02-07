import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import PhaseCreate
from tests.utils.book import create_random_book
from tests.utils.program import create_random_program


def test_create_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {
        "order": 1,
        "program_id": str(program.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/phases/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["order"] == 1
    assert content["program_id"] == str(program.id)
    assert "id" in content


def test_create_phase_duplicate_order(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test that creating a phase with duplicate order for the same program fails."""
    program = create_random_program(db)

    # Create first phase with order 1
    phase_in = PhaseCreate(order=1, program_id=program.id)
    crud.create_phase(session=db, phase_in=phase_in)

    # Try to create another phase with the same order for the same program
    data = {
        "order": 1,
        "program_id": str(program.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/phases/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert "Phase with order 1 already exists for this program" in content["detail"]


def test_read_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    response = client.get(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(phase.id)


def test_read_phases(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    for i in range(2):
        phase_in = PhaseCreate(order=i + 1, program_id=program.id)
        crud.create_phase(session=db, phase_in=phase_in)

    response = client.get(
        f"{settings.API_V1_STR}/phases/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_read_phases_by_program(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    for i in range(3):
        phase_in = PhaseCreate(order=i + 1, program_id=program.id)
        crud.create_phase(session=db, phase_in=phase_in)

    response = client.get(
        f"{settings.API_V1_STR}/phases/program/{program.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) == 3
    # Verify ordering
    assert content["data"][0]["order"] == 1
    assert content["data"][1]["order"] == 2
    assert content["data"][2]["order"] == 3


def test_update_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    data = {"order": 2}
    response = client.patch(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["order"] == 2


def test_delete_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    response = client.delete(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Verify deletion
    response = client.get(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_add_book_to_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book = create_random_book(db)

    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Book added to phase successfully"


def test_remove_book_from_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book = create_random_book(db)
    crud.add_book_to_phase(session=db, phase_id=phase.id, book_id=book.id)

    response = client.delete(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Book removed from phase successfully"


def test_add_book_to_phase_not_found(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    # Non-existent book
    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/00000000-0000-0000-0000-000000000000",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_create_phase_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    data = {
        "order": 1,
        "program_id": str(program.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/phases/",
        headers=normal_user_token_headers,
        json=data,
    )
    # Normal users should not be able to create phases
    assert response.status_code == 403


def test_read_phase_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/phases/00000000-0000-0000-0000-000000000000",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_phase_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    data = {"order": 2}
    response = client.patch(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_delete_phase_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    response = client.delete(
        f"{settings.API_V1_STR}/phases/{phase.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_add_book_to_phase_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)
    book = create_random_book(db)

    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_remove_book_from_phase_as_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)
    book = create_random_book(db)
    crud.add_book_to_phase(session=db, phase_id=phase.id, book_id=book.id)

    response = client.delete(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_create_phase_program_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test creating a phase with non-existent program."""
    data = {
        "order": 1,
        "program_id": str(uuid.uuid4()),  # Non-existent program
    }
    response = client.post(
        f"{settings.API_V1_STR}/phases/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Program not found"


def test_update_phase_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent phase."""
    data = {"order": 2}
    response = client.patch(
        f"{settings.API_V1_STR}/phases/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Phase not found"


def test_delete_phase_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test deleting a non-existent phase."""
    response = client.delete(
        f"{settings.API_V1_STR}/phases/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Phase not found"


def test_add_book_to_nonexistent_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding a book to non-existent phase."""
    book = create_random_book(db)
    response = client.post(
        f"{settings.API_V1_STR}/phases/{uuid.uuid4()}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Phase not found"


def test_add_book_with_same_order_to_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding two books with the same order to a phase."""
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book1 = create_random_book(db)
    book2 = create_random_book(db)

    # Add first book with order 1
    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book1.id}?order=1",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Try to add second book with the same order
    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book2.id}?order=1",
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    assert "A book with this order already exists" in response.json()["detail"]


def test_add_same_book_twice_to_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test adding the same book twice to a phase."""
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    book = create_random_book(db)

    # Add book first time
    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Try to add same book again
    response = client.post(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{book.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    assert "book already in phase" in response.json()["detail"]


def test_remove_nonexistent_book_from_phase(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test removing a book that isn't in the phase."""
    program = create_random_program(db)
    phase_in = PhaseCreate(order=1, program_id=program.id)
    phase = crud.create_phase(session=db, phase_in=phase_in)

    # Try to remove a book that was never added
    response = client.delete(
        f"{settings.API_V1_STR}/phases/{phase.id}/books/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Book not found in phase"
