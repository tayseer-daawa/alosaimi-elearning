import pytest
from sqlmodel import Session

from app import crud
from app.models import LessonCreate, QuestionCreate, QuestionUpdate
from tests.utils.book import create_random_book
from tests.utils.utils import random_lower_string


def test_create_question(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_text = random_lower_string()
    question_in = QuestionCreate(
        question=question_text,
        options=["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
        correct_options=[0, 2],  # First and third options are correct
        explanation="This is the explanation",
        lesson_id=lesson.id,
    )
    created_question = crud.create_question(session=db, question_in=question_in)
    assert created_question.question == question_text
    assert created_question.lesson_id == lesson.id
    assert created_question.options == ["Answer 1", "Answer 2", "Answer 3", "Answer 4"]
    assert created_question.correct_options == [0, 2]
    assert created_question.id is not None


@pytest.mark.parametrize("invalid_idx", [-1, 5])
def test_create_invalid_question(db: Session, invalid_idx: int) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_text = random_lower_string()
    with pytest.raises(ValueError, match=".*out of range for options.*"):
        QuestionCreate(
            question=question_text,
            options=["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
            correct_options=[invalid_idx],  # Invalid correct option index
            explanation="This is the explanation",
            lesson_id=lesson.id,
        )


def test_get_question(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_in = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    stored_question = crud.get_question(session=db, question_id=question.id)
    assert stored_question
    assert stored_question.id == question.id
    assert stored_question.lesson_id == lesson.id


def test_get_questions_by_lesson(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    # Create multiple questions for the same lesson
    for i in range(3):
        question_in = QuestionCreate(
            question=f"Question {i+1}",
            options=[f"Answer {i+1}A", f"Answer {i+1}B"],
            correct_options=[0],
            lesson_id=lesson.id,
        )
        crud.create_question(session=db, question_in=question_in)

    questions = crud.get_questions_by_lesson(
        session=db, lesson_id=lesson.id, skip=0, limit=10
    )
    assert len(questions) == 3


def test_update_question(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_in = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    new_question_text = random_lower_string()
    question_in_update = QuestionUpdate(
        question=new_question_text,
        options=["New Answer 1", "New Answer 2", "New Answer 3"],
        correct_options=[1, 2],
    )

    updated_question = crud.update_question(
        session=db, db_question=question, question_in=question_in_update
    )
    assert updated_question.question == new_question_text
    assert updated_question.options == ["New Answer 1", "New Answer 2", "New Answer 3"]
    assert updated_question.correct_options == [1, 2]
    assert updated_question.id == question.id


def test_update_question_inconsistent_data(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_in = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    # Try to update with an invalid correct_options index
    question_in_update = QuestionUpdate(
        options=["New Answer 1", "New Answer 2", "New Answer 3"],
        correct_options=[5],  # Invalid index
    )
    with pytest.raises(
        ValueError,
        match="correct_option index 5 is out of range for options of length 3",
    ):
        # This should raise due to model validator
        crud.update_question(
            session=db, db_question=question, question_in=question_in_update
        )

    # Try to update with an invalid correct_options index
    question_in_update = QuestionUpdate(
        correct_options=[5],  # Invalid index
    )
    with pytest.raises(
        ValueError,
        match="correct_option index 5 is out of range for options of length 2",
    ):
        # This should raise due to model validator
        crud.update_question(
            session=db, db_question=question, question_in=question_in_update
        )


def test_question_is_single_answer(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    # Single correct answer question
    question_in = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2", "Answer 3"],
        correct_options=[0],  # Only one correct answer
        lesson_id=lesson.id,
    )
    single_answer_question = crud.create_question(session=db, question_in=question_in)
    assert single_answer_question.is_single_answer() is True

    # Multiple correct answers question
    question_in_multi = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2", "Answer 3"],
        correct_options=[0, 2],  # Two correct answers
        lesson_id=lesson.id,
    )
    multi_answer_question = crud.create_question(
        session=db, question_in=question_in_multi
    )
    assert multi_answer_question.is_single_answer() is False


def test_delete_question(db: Session) -> None:
    book = create_random_book(db)
    lesson_in = LessonCreate(
        book_part_pdf="https://example.com/part.pdf",
        book_part_audio="https://example.com/part.mp3",
        lesson_audio="https://example.com/lesson.mp3",
        explanation_notes="Notes",
        book_id=book.id,
        order=0,
    )
    lesson = crud.create_lesson(session=db, lesson_in=lesson_in)

    question_in = QuestionCreate(
        question=random_lower_string(),
        options=["Answer 1", "Answer 2"],
        correct_options=[0],
        lesson_id=lesson.id,
    )
    question = crud.create_question(session=db, question_in=question_in)

    result = crud.delete_question(session=db, question_id=question.id)
    assert result is True

    deleted_question = crud.get_question(session=db, question_id=question.id)
    assert deleted_question is None
