"""Stable fixtures for the local development seed.

Identity is email (users) or exact Arabic title (programs/books).
Do not rename these without updating clean.py (and legacy title lists).

Curriculum mirrors Sheikh Saleh al-Osaimi's public programs
(مكتبة الشيخ / Wikipedia program list). See
`.claude/skills/muhimmat-al-ilm/SKILL.md`.
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

# Cohort with session + exam demo (مهمات العلم only — keeps seed light)
PRIMARY_PROGRAM_TITLE = "مهمات العلم"

PLACEHOLDER_PDF = "https://example.com/seed/book.pdf"
PLACEHOLDER_AUDIO = "https://example.com/seed/audio.mp3"
PLACEHOLDER_LESSON_PDF = "https://example.com/seed/lesson.pdf"
PLACEHOLDER_LESSON_AUDIO = "https://example.com/seed/lesson.mp3"

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
WEEKEND_INTENSIVE = ["Friday", "Saturday", "Sunday"]
SEASONAL_DAYS = ["Monday", "Tuesday", "Wednesday"]


@dataclass(frozen=True)
class SeedBookSpec:
    title: str
    lesson_count: int
    questions_per_lesson: int


@dataclass(frozen=True)
class SeedProgramSpec:
    title: str
    days_of_study: list[str]
    # phase order → books (same Book title may appear in multiple programs)
    phases: dict[int, list[SeedBookSpec]]
    with_session: bool = False


def _matn(title: str, lessons: int = 1, questions: int = 1) -> SeedBookSpec:
    return SeedBookSpec(
        title=title,
        lesson_count=lessons,
        questions_per_lesson=questions,
    )


# --- Program graphs (titles from official library / Wikipedia) ---------------

MUHIMMAT = SeedProgramSpec(
    title="مهمات العلم",
    days_of_study=WEEKDAYS,
    with_session=True,
    phases={
        0: [
            _matn("تعظيم العلم", lessons=2),
            _matn("ثلاثة الأصول وأدلتها", lessons=2),
            _matn("القواعد الأربع"),
            _matn("الأربعون النووية", lessons=2),
            _matn("المقدمة الفقهية الصغرى", lessons=2),
            _matn("تفسير الفاتحة وقصار المفصل", lessons=2),
        ],
        1: [
            _matn("كتاب التوحيد", lessons=3),
            _matn("فضل الإسلام"),
            _matn("كشف الشبهات"),
            _matn("العقيدة الواسطية", lessons=2),
        ],
        2: [
            _matn("منظومة القواعد الفقهية"),
            _matn("مقدمة في أصول التفسير"),
            _matn("المقدمة الآجرومية", lessons=2),
            _matn("نخبة الفكر", lessons=2),
            _matn("الورقات", lessons=2),
        ],
    },
)

# Weekly Riyadh year program — levels from مكتبة الشيخ (أصول العلم)
USUL_AL_ILM = SeedProgramSpec(
    title="أصول العلم",
    days_of_study=WEEKDAYS,
    phases={
        0: [  # المستوى الأول
            _matn("خلاصة تعظيم العلم"),
            _matn("ثلاثة الأصول وأدلتها"),
            _matn("فضل الإسلام"),
            _matn("المفتاح في الفقه"),
            _matn("العقيدة الواسطية"),
            _matn("الأربعون النووية"),
            _matn("تفسير الفاتحة وقصار المفصل"),
            _matn("معاني الفاتحة وقصار المفصل"),
            _matn("القواعد الأربع"),
            _matn("كتاب التوحيد"),
            _matn("المقدمة الفقهية الصغرى"),
            _matn("كشف الشبهات"),
        ],
        1: [  # المستوى الثاني (subset for demo size)
            _matn("بهجة الطلب في آداب الطلب"),
            _matn("الآداب العشرة"),
            _matn("العروة الوثقى"),
            _matn("الورقات"),
            _matn("منحة الفعال في نظم ورقات أبي المعالي"),
            _matn("منظومة القواعد الفقهية"),
            _matn("المقدمة الآجرومية"),
            _matn("نظم الآجرومية"),
            _matn("نخبة الفكر"),
            _matn("الرتبة نظم النخبة"),
            _matn("مقدمة في أصول التفسير"),
            _matn("خلاصة مقدمة أصول التفسير"),
        ],
        2: [  # المستوى الثالث — seasonal fiqh books used in the program
            _matn("كتاب الصيام من منهج السالكين"),
            _matn("كتاب الحج من منهج السالكين"),
        ],
        3: [  # المستوى الرابع
            _matn("عمدة الأحكام"),
        ],
    },
)

# Telegram follow-up — صلة المهمات companions (official list)
TAMKEEN = SeedProgramSpec(
    title="تمكين مهمات العلم",
    days_of_study=WEEKDAYS,
    phases={
        0: [
            _matn("خلاصة تعظيم العلم"),
            _matn("معاني الفاتحة وقصار المفصل"),
            _matn("الزيادة الرجبية"),
        ],
        1: [
            _matn("نظم الآجرومية"),
            _matn("الرتبة نظم النخبة"),
            _matn("منحة الفعال في نظم ورقات أبي المعالي"),
            _matn("خلاصة مقدمة أصول التفسير"),
        ],
        2: [
            _matn("الآداب العشرة"),
            _matn("الخلاصة الحسناء في أذكار الصباح والمساء"),
            _matn("الباقيات الصالحات من الأذكار بعد الصلوات"),
        ],
    },
)

# Regional touring program — foundational matn (Wikipedia: أساس العلم)
ASAS = SeedProgramSpec(
    title="أساس العلم",
    days_of_study=WEEKEND_INTENSIVE,
    phases={
        0: [
            _matn("تعظيم العلم"),
            _matn("ثلاثة الأصول وأدلتها"),
            _matn("القواعد الأربع"),
            _matn("الأربعون النووية"),
        ],
        1: [
            _matn("كتاب التوحيد"),
            _matn("العقيدة الواسطية"),
            _matn("المقدمة الفقهية الصغرى"),
            _matn("المقدمة الآجرومية"),
        ],
    },
)

# Abroad / GCC intensive — 12 matn across arts (Wikipedia: جمل العلم)
JUMAL = SeedProgramSpec(
    title="جمل العلم",
    days_of_study=WEEKEND_INTENSIVE,
    phases={
        0: [
            _matn("تعظيم العلم"),
            _matn("ثلاثة الأصول وأدلتها"),
            _matn("كتاب التوحيد"),
            _matn("العقيدة الواسطية"),
            _matn("الأربعون النووية"),
            _matn("تفسير الفاتحة وقصار المفصل"),
        ],
        1: [
            _matn("مقدمة في أصول التفسير"),
            _matn("نخبة الفكر"),
            _matn("المقدمة الفقهية الصغرى"),
            _matn("منظومة القواعد الفقهية"),
            _matn("الورقات"),
            _matn("المقدمة الآجرومية"),
        ],
    },
)

# Seasonal programs (Wikipedia list + his published shuruh titles)
AHKAM_SIYAM = SeedProgramSpec(
    title="أحكام الصيام",
    days_of_study=SEASONAL_DAYS,
    phases={
        0: [
            _matn("كتاب الصيام من منهج السالكين", lessons=2),
        ],
    },
)

AHKAM_HAJJ = SeedProgramSpec(
    title="أحكام الحج",
    days_of_study=SEASONAL_DAYS,
    phases={
        0: [
            _matn("كتاب الحج من منهج السالكين", lessons=2),
            _matn("التحقيق والإيضاح لكثير من مسائل الحج والعمرة والزيارة"),
            _matn("رسالة مختصرة في الحج والعمرة"),
        ],
    },
)

SEED_PROGRAMS: list[SeedProgramSpec] = [
    MUHIMMAT,
    USUL_AL_ILM,
    TAMKEEN,
    ASAS,
    JUMAL,
    AHKAM_SIYAM,
    AHKAM_HAJJ,
]

# Backward-compatible aliases used by older helpers / docs
PROGRAM_TITLE = PRIMARY_PROGRAM_TITLE
PROGRAM_DAYS = WEEKDAYS
PHASE_BOOKS = MUHIMMAT.phases
ORPHAN_BOOK_TITLE = "البيّنة في اقتباس العلم والحذق فيه"  # authored risalah, unphased

LEGACY_PROGRAM_TITLES = ["برنامج القراءة والتجويد"]
LEGACY_ORPHAN_BOOK_TITLES = ["كتاب مستقل (بدون مرحلة)"]
LEGACY_PHASE_BOOK_TITLES = [
    "كتاب رقم 1: مدخل إلى علم التجويد",
    "كتاب رقم 2: أحكام النون الساكنة والتنوين",
    "كتاب رقم 3: المدود",
]


def _all_book_titles_from_programs() -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for program in SEED_PROGRAMS:
        for specs in program.phases.values():
            for spec in specs:
                if spec.title not in seen:
                    seen.add(spec.title)
                    ordered.append(spec.title)
    return ordered


ALL_SEED_BOOK_TITLES: list[str] = [
    *_all_book_titles_from_programs(),
    ORPHAN_BOOK_TITLE,
    *LEGACY_PHASE_BOOK_TITLES,
    *LEGACY_ORPHAN_BOOK_TITLES,
]

ALL_SEED_PROGRAM_TITLES: list[str] = [
    *[p.title for p in SEED_PROGRAMS],
    *LEGACY_PROGRAM_TITLES,
]

DEMO_USER_EMAILS: list[str] = [u["email"] for u in DEMO_USERS]
