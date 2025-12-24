import uuid

from sqlmodel import Session, col, select

from app.models import SessionEvent, SessionEventCreate, SessionEventUpdate


def create_session_event(
    *, session: Session, event_in: SessionEventCreate
) -> SessionEvent:
    """Create a new session event"""
    db_obj = SessionEvent.model_validate(event_in)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_session_event(*, session: Session, event_id: uuid.UUID) -> SessionEvent | None:
    """Get a session event by ID"""
    return session.get(SessionEvent, event_id)


def get_session_events_by_session(
    *,
    session: Session,
    session_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    is_break: bool | None = None,
) -> list[SessionEvent]:
    """Get session events for a specific session

    You can filter by event type using the is_break parameter.
    """
    statement = select(SessionEvent).where(SessionEvent.session_id == session_id)
    if is_break is not None:
        statement = statement.where(SessionEvent.is_break == is_break)
    statement = (
        statement.order_by(col(SessionEvent.event_date)).offset(skip).limit(limit)
    )
    return list(session.exec(statement).all())


def update_session_event(
    *, session: Session, db_event: SessionEvent, event_in: SessionEventUpdate
) -> SessionEvent:
    """Update a session event"""
    event_data = event_in.model_dump(exclude_unset=True)
    db_event.sqlmodel_update(event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def delete_session_event(*, session: Session, event_id: uuid.UUID) -> bool:
    """Delete a session event"""
    db_obj = session.get(SessionEvent, event_id)
    if db_obj:
        session.delete(db_obj)
        session.commit()
        return True
    return False
