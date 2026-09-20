"""Stable fixtures for the local development seed.

Identity is email (users) or exact Arabic title (programs/books).
Do not rename these without updating clean.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TypedDict


class DemoUser(TypedDict):
    email: str
    password: str
    first_name: str
    father_name: str
    family_name: str
    is_male: bool
    is_teacher: bool
    is_active: bool


DEMO_USERS: list[DemoUser] = [
    {
        "email": "teacher@example.com",
        "password": "Teacher123!",
        "first_name": "أحمد",
        "father_name": "محمد",
        "family_name": "العلي",
        "is_male": True,
        "is_teacher": True,
        "is_active": True,
    },
    {
        "email": "student@example.com",
        "password": "Student123!",
        "first_name": "فاطمة",
        "father_name": "عبدالله",
        "family_name": "السعيد",
        "is_male": False,
        "is_teacher": False,
        "is_active": True,
    },
    {
        "email": "sara.student@example.com",
        "password": "Student123!",
        "first_name": "سارة",
        "father_name": "علي",
        "family_name": "النجدي",
        "is_male": False,
        "is_teacher": False,
        "is_active": True,
    },
    {
        "email": "khalid.student@example.com",
        "password": "Student123!",
        "first_name": "خالد",
        "father_name": "سعيد",
        "family_name": "الحربي",
        "is_male": True,
        "is_teacher": False,
        "is_active": True,
    },
    {
        "email": "inactive.student@example.com",
        "password": "Student123!",
        "first_name": "نورة",
        "father_name": "فهد",
        "family_name": "القحطاني",
        "is_male": False,
        "is_teacher": False,
        "is_active": False,
    },
]

ACTIVE_STUDENT_EMAILS = [
    "student@example.com",
    "sara.student@example.com",
    "khalid.student@example.com",
]

TEACHER_EMAIL = "teacher@example.com"
PRIMARY_STUDENT_EMAIL = "student@example.com"

PROGRAM_TITLE = "برنامج القراءة والتجويد"
ORPHAN_BOOK_TITLE = "كتاب مستقل (بدون مرحلة)"

PROGRAM_DAYS = ["Sunday", "Monday", "Wednesday", "Thursday"]

PLACEHOLDER_PDF = "https://example.com/seed/book.pdf"
PLACEHOLDER_AUDIO = "https://example.com/seed/audio.mp3"
PLACEHOLDER_LESSON_PDF = "https://example.com/seed/lesson.pdf"
PLACEHOLDER_LESSON_AUDIO = "https://example.com/seed/lesson.mp3"


@dataclass(frozen=True)
class SeedBookSpec:
    title: str
    lesson_count: int
    questions_per_lesson: int


# Phase order → books in that phase
PHASE_BOOKS: dict[int, list[SeedBookSpec]] = {
    0: [
        SeedBookSpec(
            title="كتاب رقم 1: مدخل إلى علم التجويد",
            lesson_count=3,
            questions_per_lesson=2,
        ),
        SeedBookSpec(
            title="كتاب رقم 2: أحكام النون الساكنة والتنوين",
            lesson_count=2,
            questions_per_lesson=1,
        ),
    ],
    1: [
        SeedBookSpec(
            title="كتاب رقم 3: المدود",
            lesson_count=2,
            questions_per_lesson=1,
        ),
    ],
}

ALL_SEED_BOOK_TITLES: list[str] = [
    *[spec.title for books in PHASE_BOOKS.values() for spec in books],
    ORPHAN_BOOK_TITLE,
]

DEMO_USER_EMAILS: list[str] = [u["email"] for u in DEMO_USERS]
