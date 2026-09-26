"""Public media URLs for seed books/lessons.

Catalog (Tamkeen — browse / download packs):
  Telegram  https://t.me/tamkeen1
  Drive     https://drive.google.com/drive/folders/1tGKrHmSZFGDBBl2vJx1NqFHRhAuntuJc
  Facebook  https://www.facebook.com/tamkeen.mohemat
  YouTube   e.g. https://youtube.com/playlist?list=PLjmCBC6YwAF9NRdK-HXpc5t9R7KJVriE3

Playable URLs below use the IslamHouse CDN (direct PDF/MP3) so the student
<audio> / PDF links work in-browser. Drive folder links are not usable as
HTML5 media sources. Nothing is vendored into the repo.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Tamkeen catalog (human / research) — same graph as Drive folders 01–20
TAMKEEN_TELEGRAM = "https://t.me/tamkeen1"
TAMKEEN_DRIVE = (
    "https://drive.google.com/drive/folders/1tGKrHmSZFGDBBl2vJx1NqFHRhAuntuJc"
)
TAMKEEN_FACEBOOK = "https://www.facebook.com/tamkeen.mohemat"
# قراءة المقدمة الفقهية الصغرى (عبد العزيز الصيني)
TAMKEEN_YOUTUBE_FIQH_SUGHRA = (
    "https://youtube.com/playlist?list=PLjmCBC6YwAF9NRdK-HXpc5t9R7KJVriE3"
)

IH = "https://d1.islamhouse.com/data/ar"


@dataclass(frozen=True)
class SeedBookMedia:
    """Optional matn PDF + ordered majlis MP3s for a Book title."""

    pdf: str | None = None
    # Book-level audio link (UI «ملف صوتي») — usually majlis 1
    audio: str | None = None
    # Lesson.order → majlis MP3 (and reused for book_part_audio)
    lesson_audios: tuple[str, ...] = field(default_factory=tuple)
    # Optional PDF used as lesson book_part_pdf (sharh transcription, etc.)
    lesson_pdf: str | None = None
    source_note: str = (
        "شرح برنامج مهمات العلم 1440هـ — إسلام هاوس "
        f"(كتالوج التمكين: {TAMKEEN_TELEGRAM})"
    )


def _audios(*paths: str) -> tuple[str, ...]:
    return tuple(f"{IH}/{p}" for p in paths)


def _pdf(path: str) -> str:
    return f"{IH}/{path}"


# Matn title → public IslamHouse media (shared across programs via Book title)
SEED_BOOK_MEDIA: dict[str, SeedBookMedia] = {
    "تعظيم العلم": SeedBookMedia(
        pdf=_pdf("ih_books/single_02/ar-taezim-aleilm.pdf"),
        audio=_audios(
            "ih_sounds/parts/shar7-ta3zeem-3lm-osaime-1440/"
            "ar-01-shar7-ta3zeem-3lm-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-ta3zeem-3lm-osaime-1440/"
            "ar-01-shar7-ta3zeem-3lm-osaime-1440.mp3",
            "ih_sounds/parts/shar7-ta3zeem-3lm-osaime-1440/"
            "ar-02-shar7-ta3zeem-3lm-osaime-1440.mp3",
        ),
        lesson_pdf=_pdf("ih_books/single_02/ar-sharah-taezim-aleilm-1436.pdf"),
    ),
    "خلاصة تعظيم العلم": SeedBookMedia(
        pdf=_pdf("ih_books/single_02/ar-taezim-aleilm.pdf"),
        audio=_audios(
            "ih_sounds/parts/Khola9t_Ta391eem_3lm_Osaime_M_M_1432/"
            "ar_01_Khola9t_Ta391eem_3lm_Osaime_M_M_1432.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/Khola9t_Ta391eem_3lm_Osaime_M_M_1432/"
            "ar_01_Khola9t_Ta391eem_3lm_Osaime_M_M_1432.mp3",
            "ih_sounds/parts/Khola9t_Ta391eem_3lm_Osaime_M_M_1432/"
            "ar_02_Khola9t_Ta391eem_3lm_Osaime_M_M_1432.mp3",
        ),
        source_note="مجالس متفرقة 1432هـ — إسلام هاوس",
    ),
    "ثلاثة الأصول وأدلتها": SeedBookMedia(
        pdf=_pdf("ih_books/single_02/ar-sharah-thlatht-alusul-1436.pdf"),
        audio=_audios(
            "ih_sounds/parts/shar7-3-osol-osaime-1440/"
            "ar-01-shar7-3-osol-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-3-osol-osaime-1440/"
            "ar-01-shar7-3-osol-osaime-1440.mp3",
            "ih_sounds/parts/shar7-3-osol-osaime-1440/"
            "ar-02-shar7-3-osol-osaime-1440.mp3",
        ),
        lesson_pdf=_pdf("ih_books/single_02/ar-sharah-thlatht-alusul-1436.pdf"),
    ),
    "القواعد الأربع": SeedBookMedia(
        audio=_audios("ih_sounds/single_02/ar-shar7-qawa3d-4-osaime-1440.mp3")[0],
        lesson_audios=_audios("ih_sounds/single_02/ar-shar7-qawa3d-4-osaime-1440.mp3"),
    ),
    "الأربعون النووية": SeedBookMedia(
        audio=_audios(
            "ih_sounds/chain_01/shar7-40-nawaweya-osaime-1440/"
            "ar-01-shar7-40-nawaweya-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/chain_01/shar7-40-nawaweya-osaime-1440/"
            "ar-01-shar7-40-nawaweya-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-40-nawaweya-osaime-1440/"
            "ar-02-shar7-40-nawaweya-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-40-nawaweya-osaime-1440/"
            "ar-03-shar7-40-nawaweya-osaime-1440.mp3",
        ),
    ),
    "المقدمة الفقهية الصغرى": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/shar7-moqadema-feqheya-soghra-osaime-1440/"
            "ar-01-shar7-moqadema-feqheya-soghra-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-moqadema-feqheya-soghra-osaime-1440/"
            "ar-01-shar7-moqadema-feqheya-soghra-osaime-1440.mp3",
            "ih_sounds/parts/shar7-moqadema-feqheya-soghra-osaime-1440/"
            "ar-02-shar7-moqadema-feqheya-soghra-osaime-1440.mp3",
        ),
    ),
    "تفسير الفاتحة وقصار المفصل": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/tafceer-fateha-qesar-mofassal-osaime-1440/"
            "ar-01-tafceer-fateha-qesar-mofassal-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/tafceer-fateha-qesar-mofassal-osaime-1440/"
            "ar-01-tafceer-fateha-qesar-mofassal-osaime-1440.mp3",
            "ih_sounds/parts/tafceer-fateha-qesar-mofassal-osaime-1440/"
            "ar-02-tafceer-fateha-qesar-mofassal-osaime-1440.mp3",
        ),
    ),
    "كتاب التوحيد": SeedBookMedia(
        audio=_audios(
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-01-shar7-ketab-taw7eed-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-01-shar7-ketab-taw7eed-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-02-shar7-ketab-taw7eed-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-03-shar7-ketab-taw7eed-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-04-shar7-ketab-taw7eed-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-05-shar7-ketab-taw7eed-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-ketab-taw7eed-osaime-1440/"
            "ar-06-shar7-ketab-taw7eed-osaime-1440.mp3",
        ),
    ),
    "فضل الإسلام": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/shar7-fdl-islam-osaime-1440/"
            "ar-01-shar7-fdl-islam-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-fdl-islam-osaime-1440/"
            "ar-01-shar7-fdl-islam-osaime-1440.mp3",
            "ih_sounds/parts/shar7-fdl-islam-osaime-1440/"
            "ar-02-shar7-fdl-islam-osaime-1440.mp3",
        ),
    ),
    "كشف الشبهات": SeedBookMedia(
        audio=_audios("ih_sounds/single_02/ar-shar7-kashf-shobohat-osaime-1440.mp3")[0],
        lesson_audios=_audios(
            "ih_sounds/single_02/ar-shar7-kashf-shobohat-osaime-1440.mp3"
        ),
    ),
    "العقيدة الواسطية": SeedBookMedia(
        audio=_audios(
            "ih_sounds/chain_01/shar7-3aqeda-wase6eya-osaime-1440/"
            "ar-01-shar7-3aqeda-wase6eya-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/chain_01/shar7-3aqeda-wase6eya-osaime-1440/"
            "ar-01-shar7-3aqeda-wase6eya-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-3aqeda-wase6eya-osaime-1440/"
            "ar-02-shar7-3aqeda-wase6eya-osaime-1440.mp3",
            "ih_sounds/chain_01/shar7-3aqeda-wase6eya-osaime-1440/"
            "ar-03-shar7-3aqeda-wase6eya-osaime-1440.mp3",
        ),
    ),
    "منظومة القواعد الفقهية": SeedBookMedia(
        audio=_audios(
            "ih_sounds/single_02/ar-shar7-man61omt-qawa3d-feqheya-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/single_02/ar-shar7-man61omt-qawa3d-feqheya-osaime-1440.mp3"
        ),
    ),
    "مقدمة في أصول التفسير": SeedBookMedia(
        audio=_audios(
            "ih_sounds/single_02/ar-shar7-moqadema-osol-tafceer-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/single_02/ar-shar7-moqadema-osol-tafceer-osaime-1440.mp3"
        ),
    ),
    "المقدمة الآجرومية": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/shar7-moqadema-ajoromeya-osaime-1440/"
            "ar-01-shar7-moqadema-ajoromeya-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-moqadema-ajoromeya-osaime-1440/"
            "ar-01-shar7-moqadema-ajoromeya-osaime-1440.mp3",
            "ih_sounds/parts/shar7-moqadema-ajoromeya-osaime-1440/"
            "ar-02-shar7-moqadema-ajoromeya-osaime-1440.mp3",
        ),
    ),
    "نخبة الفكر": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/shar7-nokhbt-fekar-osaime-1440/"
            "ar-01-shar7-nokhbt-fekar-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-nokhbt-fekar-osaime-1440/"
            "ar-01-shar7-nokhbt-fekar-osaime-1440.mp3",
            "ih_sounds/parts/shar7-nokhbt-fekar-osaime-1440/"
            "ar-02-shar7-nokhbt-fekar-osaime-1440.mp3",
        ),
    ),
    "الورقات": SeedBookMedia(
        audio=_audios(
            "ih_sounds/parts/shar7-waraqat-osaime-1440/"
            "ar-01-shar7-waraqat-osaime-1440.mp3"
        )[0],
        lesson_audios=_audios(
            "ih_sounds/parts/shar7-waraqat-osaime-1440/"
            "ar-01-shar7-waraqat-osaime-1440.mp3",
            "ih_sounds/parts/shar7-waraqat-osaime-1440/"
            "ar-02-shar7-waraqat-osaime-1440.mp3",
        ),
    ),
}


def media_for(title: str) -> SeedBookMedia | None:
    return SEED_BOOK_MEDIA.get(title)


def lesson_audio_for(media: SeedBookMedia, order: int) -> str:
    if not media.lesson_audios:
        return media.audio or ""
    if order < len(media.lesson_audios):
        return media.lesson_audios[order]
    return media.lesson_audios[-1]
