import uuid
from datetime import date

from sqlmodel import Session

from app import crud
from app.models import SessionEventCreate, SessionEventUpdate
from tests.utils.session import create_random_session


def test_create_session_event(db: Session) -> None:
    """Test creating a session event"""
    session_obj = create_random_session(db)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    event = crud.create_session_event(session=db, event_in=event_in)

    assert event.id is not None
    assert event.event_date == date.today()
    assert event.num_days == 1
    assert event.is_break is False
    assert event.session_id == session_obj.id


def test_create_session_event_break(db: Session) -> None:
    """Test creating a break session event"""
    session_obj = create_random_session(db)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=7,  # One week break
        session_id=session_obj.id,
        is_break=True,
    )
    event = crud.create_session_event(session=db, event_in=event_in)

    assert event.id is not None
    assert event.is_break is True
    assert event.num_days == 7


def test_get_session_event(db: Session) -> None:
    """Test getting a session event by ID"""
    session_obj = create_random_session(db)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    event = crud.create_session_event(session=db, event_in=event_in)

    stored_event = crud.get_session_event(session=db, event_id=event.id)
    assert stored_event is not None
    assert stored_event.id == event.id


def test_get_session_event_not_found(db: Session) -> None:
    """Test getting a non-existent session event"""

    result = crud.get_session_event(session=db, event_id=uuid.uuid4())
    assert result is None


def test_get_session_events_by_session(db: Session) -> None:
    """Test getting all events for a session"""
    session_obj = create_random_session(db)

    # Create multiple events
    for i in range(3):
        event_in = SessionEventCreate(
            event_date=date.today(),
            num_days=1,
            session_id=session_obj.id,
            is_break=i == 2,  # Third one is a break
        )
        crud.create_session_event(session=db, event_in=event_in)

    events = crud.get_session_events_by_session(
        session=db, session_id=session_obj.id, skip=0, limit=10
    )
    assert len(events) >= 3


def test_get_session_events_filter_by_is_break(db: Session) -> None:
    """Test filtering session events by is_break"""
    session_obj = create_random_session(db)

    # Create 2 lessons and 1 break
    for _ in range(2):
        event_in = SessionEventCreate(
            event_date=date.today(),
            num_days=1,
            session_id=session_obj.id,
            is_break=False,
        )
        crud.create_session_event(session=db, event_in=event_in)

    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=3,
        session_id=session_obj.id,
        is_break=True,
    )
    crud.create_session_event(session=db, event_in=event_in)

    # Filter for breaks only
    breaks = crud.get_session_events_by_session(
        session=db, session_id=session_obj.id, skip=0, limit=10, is_break=True
    )
    assert len(breaks) >= 1
    for event in breaks:
        assert event.is_break is True

    # Filter for lessons only
    lessons = crud.get_session_events_by_session(
        session=db, session_id=session_obj.id, skip=0, limit=10, is_break=False
    )
    assert len(lessons) >= 2
    for event in lessons:
        assert event.is_break is False


def test_update_session_event(db: Session) -> None:
    """Test updating a session event"""
    session_obj = create_random_session(db)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    event = crud.create_session_event(session=db, event_in=event_in)

    # Update the event
    update_data = SessionEventUpdate(num_days=3)
    updated_event = crud.update_session_event(
        session=db, db_event=event, event_in=update_data
    )

    assert updated_event.id == event.id
    assert updated_event.num_days == 3


def test_delete_session_event(db: Session) -> None:
    """Test deleting a session event"""
    session_obj = create_random_session(db)
    event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    event = crud.create_session_event(session=db, event_in=event_in)

    # Delete the event
    result = crud.delete_session_event(session=db, event_id=event.id)
    assert result is True

    # Verify it's deleted
    deleted_event = crud.get_session_event(session=db, event_id=event.id)
    assert deleted_event is None


def test_delete_session_event_not_found(db: Session) -> None:
    """Test deleting a non-existent session event"""
    import uuid

    result = crud.delete_session_event(session=db, event_id=uuid.uuid4())
    assert result is False


def test_session_event_is_lesson_property(db: Session) -> None:
    """Test that is_lesson property returns the opposite of is_break."""
    session_obj = create_random_session(db)

    # Create a lesson event (is_break=False)
    lesson_event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=1,
        session_id=session_obj.id,
        is_break=False,
    )
    lesson_event = crud.create_session_event(session=db, event_in=lesson_event_in)
    assert lesson_event.is_break is False
    assert lesson_event.is_lesson is True

    # Create a break event (is_break=True)
    break_event_in = SessionEventCreate(
        event_date=date.today(),
        num_days=3,
        session_id=session_obj.id,
        is_break=True,
    )
    break_event = crud.create_session_event(session=db, event_in=break_event_in)
    assert break_event.is_break is True
    assert break_event.is_lesson is False
