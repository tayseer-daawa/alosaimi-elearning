# Student learning experience — roadmap & best practices

Product and engineering guide for the **student course player** (شرح صوتي + PDF; ملاحظات built but off for v0) and related learning features in AlOsaimi E-Learning (برنامج مهمات العلم and sibling tracks).

Use this when prioritizing post-beta work. Domain vocabulary and the curriculum map live in [`backend/app/seed/README.md`](../backend/app/seed/README.md).

**API / auth / production readiness** (what is wired vs localStorage vs missing): [student-frontend-api-readiness.md](./student-frontend-api-readiness.md).

---

## Beta baseline (shipped)

What “good enough for beta” means today:

| Area | Behavior |
| --- | --- |
| Audio | Custom player with **visible ±10s seek** (desktop + mobile), keyboard shortcuts as bonus (arrows ±5, J/L ±10), resume, rate, mute, lesson list, safe-area / touch targets |
| PDF | In-page reader (`react-pdf` / pdf.js, lazy-loaded) on every device + «فتح PDF في تبويب جديد»; page navigation, zoom, fit modes; reopens on the last page read; empty, load-error and timeout states with retry |
| Layout | Desktop: book full width under a one-row toolbar, full screen available. Phone: the book fills the screen down to the audio player and the page itself does not scroll; «ملء الشاشة» opens a reading mode with a mini audio strip; pinch / double-tap zoom |
| Notes | Off for v0 (`VITE_NOTES_FEATURE_ENABLED` defaults to off); the notes code is kept for later |
| Focus | The book is ordinary page content (no iframe), so audio shortcuts keep working after clicking it |
| Loading | Layout-aware skeletons on browse + course screens |
| Audience | Non-technical Sharia learners — primary actions must be on-screen buttons, not shortcut-only |

The reader's controls are ours: Arabic, RTL, labelled buttons (icon + word on phones). Keep them few and labelled — gestures are extras, never the only way.

---

## Explicitly deferred (do not start in beta)

These are real product ideas. They are **out of scope** until the graph, sessions, and core player are stable in production.

### 1. Custom `pdf.js` / `react-pdf` UI — shipped

No longer deferred: Chrome on Android has no built-in PDF viewer, so the iframe showed only a placeholder card on phones. The reader now uses `react-pdf` (see the beta baseline). What remains deferred around it:

| Still deferred | Notes |
| --- | --- |
| Search inside the book | The catalog PDFs embed broken text (lām-alif and «الله» ligatures reversed, other words mangled), so common words such as «الصلاة» or «القرآن» match nothing. Needs searchable PDFs or text versions (EPUB / HTML) of the متون |
| Print / download controls | «فتح PDF في تبويب جديد» covers them through the browser |
| Copyright / hosting | Still must not vendor matn PDFs into git; the PDF host must allow CORS for pdf.js to fetch it |

### 2. Page ↔ audio sync

Map audio time ranges (or cue points) to PDF page numbers so the matn follows the شرح.

| Why defer | Notes |
| --- | --- |
| Needs structured metadata | Lesson (or book) fields: `cues: [{ t, page }]` — not in the API yet |
| Authoring cost | Someone must mark cues for ~15 متون × lessons |
| Wrong sync is worse than no sync | Especially for إقراء / تمكين where students may jump |

**Revisit when:** admin can attach page cues (or import from a simple JSON), and at least one flagship book is fully cued.

### 3. Highlighting / annotation on the PDF

In-document highlights, underlines, margin notes stored per user.

| Why defer | Notes |
| --- | --- |
| Needs a trustworthy text layer and an annotation model | The custom viewer exists, but the catalog PDFs' embedded text is broken (see #1) |
| Storage + sync model | Per user, per book/lesson, conflict resolution |
| Legal / UX | Students may confuse personal marks with الشيخ’s text |

**Revisit when:** notes sync exists and research shows students need *on-page* marks beyond the side-panel notes.

### 4. Offline PDF cache

Service worker / Cache API (or OPFS) so المتون open without network.

| Why defer | Notes |
| --- | --- |
| Large binaries, eviction, update policy | Versioned URLs vs stale matn |
| Auth / hotlink / CORS | Many catalog URLs are third-party CDNs |
| Scope creep into full PWA offline audio | Usually wanted together |

**Revisit when:** first-party media hosting (or stable CDN with long cache headers) and a clear “download for offline” user action — not silent caching of every PDF.

---

## Recommended next investments (after beta)

Ordered by leverage for this product (Arabic RTL student app, matn + شرح):

1. **Cloud-synced lesson notes** for logged-in students (keep local draft as offline fallback).
2. **Playback progress API** (resume across devices; mark درس مكتمل).
3. **Session / cohort UX** — calendar, which جلسة the student is in, teacher presence later.
4. **Exams & attempts** aligned with real أسبوعي / نصفي / نهائي flows.
5. **Memorization aids** — lightweight إقراء / تسميع checklists for تمكين and صلة المهمات (not a full spaced-repetition product on day one).
6. **Certificates / إتمام** only after progress and exams are trustworthy.
7. **Page cues + optional sync** (see deferred #2) once authoring exists.
8. **Searchable book text** (searchable PDFs or EPUB / HTML versions of the متون) — unlocks in-book search and reflowable reading on phones.

---

## Feature catalog (this kind of app)

A checklist of improvements that fit **مهمات العلم–style** platforms. Mark status as you ship. Not every item belongs in v1.

### Course player (audio + PDF + notes)

| Feature | Status | Notes |
| --- | --- | --- |
| Keyboard shortcuts + HUD | Done (beta) | Keep documented in-app |
| Resume position / rate locally | Done (beta) | Promote to API next |
| Lesson playlist drawer | Done (beta) | |
| Desktop PDF \| notes split | Built, off for v0 | Behind `VITE_NOTES_FEATURE_ENABLED`; notes column collapsible on desktop |
| Mobile book / notes tabs | Built, off for v0 | Behind `VITE_NOTES_FEATURE_ENABLED` |
| Collapse notes pane (desktop) | Built, off for v0 | Preference in `localStorage` |
| Timestamp chips in notes | Built, off for v0 | |
| In-page PDF reader (`react-pdf`) | Done (beta) | Page navigation, zoom 25–300%, fit page / width, full screen; phone: book fills the screen, reading mode, pinch / double-tap |
| Reopen book on last page read | Done (beta) | Per student, `localStorage` |
| PDF empty / load error / timeout / open tab | Done (beta) | |
| Synced notes (API) | Next | |
| Page ↔ audio cues | Deferred | Needs metadata |
| Search inside the book | Blocked | Catalog PDFs embed broken text — see deferred #1 |
| PDF highlights / ink | Deferred | |
| Offline PDF / audio cache | Deferred | |
| Picture-in-picture / mini player | Optional | Nice on mobile while scrolling notes |
| Sleep timer / end-of-lesson stop | Optional | |
| Transcript / تفريغ synced to audio | Optional | High cost; copyright; only if licensed |
| Variable quality / adaptive audio | Optional | If self-hosting |
| AB-loop for تسميع | Optional | Strong fit for memorization tracks |

### Browse & navigation

| Feature | Status | Notes |
| --- | --- | --- |
| Program → phase → book → lesson | Done | Real Arabic titles |
| Continue learning | Done (beta) | Last opened path in `localStorage`; API/enrollment later |
| Lesson list badges (مكتمل / جارٍ) | Done (beta) | Device-local from `lesson_completed` / `lesson_playback` |
| Phase book chip «متابعة» | Done (beta) | Corner pill + tinted chip for `continue_learning_path.bookId` |
| Program card progress bars | Deferred | No cheap aggregate without scanning all lessons |
| Search متون / lessons | Todo | Arabic-aware search |
| Favorites / pinned books | Todo | |
| Recently played | Todo | |
| Breadcrumbs + back to book | Done (beta) | |

### Learning graph & cohort

| Feature | Status | Notes |
| --- | --- | --- |
| Admin CRUD for graph | Partial | Keep guest-readable browse |
| ProgramSession enrollment | Todo | |
| SessionEvent calendar | Todo | |
| Teacher assignment | Todo | |
| Breaks vs lesson days | Todo | Model exists conceptually |

### Assessment

| Feature | Status | Notes |
| --- | --- | --- |
| Lesson questions | Model | Wire student UX carefully |
| Exam attempts + examiner | Model | |
| Timed exams | Todo | |
| Result review / wrong answers | Todo | |
| External exam deep links | Avoid as core | Catalog only (e.g. arab-exams) |

### Progress & motivation

| Feature | Status | Notes |
| --- | --- | --- |
| Per-lesson complete | Done (beta) | Local + badges on book lesson list |
| Per-book / phase progress % | Todo | Needs lesson-id aggregation or API |
| Streaks | Optional | Easy to get gimmicky — use lightly |
| Certificates | Later | After trustworthy completion rules |
| Notifications (lesson / exam) | Later | Email first; push optional |

### Accessibility & RTL

| Practice | Status |
| --- | --- |
| `dir="rtl"` per screen (not only `<html>`) | Done pattern |
| Logical CSS (`ps` / `pe` / `ms` / `me`) | Prefer always |
| Arabic copy only in student UI | Done pattern |
| Audio shortcuts keep working after clicking the book (no iframe) | Done (beta) |
| Reduced motion / large touch targets | Partial (player) |
| Screen-reader labels on player controls | Partial — audit before public launch |

### Platform & ops

| Feature | Notes |
| --- | --- |
| First-party or stable media CDN | Prefer over fragile hotlinks for production |
| Never commit copyrighted PDF/MP3 | Hard rule — link only |
| OpenAPI → generated clients | Keep CI verify |
| Playwright for course journeys | Extend with notes sync / progress when APIs land |
| Observability on media 4xx/5xx | Empty/timeout already UX; add metrics later |
| PDF hosts allow CORS (+ range requests) | pdf.js fetches the file itself; hosts that don't allow it fall back to «فتح في تبويب جديد» |
| nginx serves `.mjs` as JavaScript | Required for the pdf.js worker (`frontend/student/nginx.conf`) |

---

## Best practices

### Product

1. **Prefer real matn titles and program names** — never invent generic LMS English in the student UI.
2. **Ship the listening loop first** — open درس → سمع → اقرأ المتن → دوّن ملاحظة — before gamification.
3. **Local-first notes are fine for beta** (once re-enabled); cloud sync must not wipe local drafts without merge.
4. **Open-in-new-tab is a feature**, not a failure — especially when hosts block embedding.
5. **The PDF reader is for reading along with the شرح** — keep its controls few and labelled; it is not a full PDF editor.

### UX (student, Arabic RTL)

1. One primary task per surface; the player bar stays predictable.
2. Reader controls: labelled buttons first; pinch, double-tap and Ctrl+wheel are extras.
3. When notes are re-enabled: keep «ملاحظاتي» above the fold; long teacher notes collapse.
4. Mobile: one panel at a time, and never a scroll inside a scroll — the book fills the screen above the player and only the book scrolls.
5. Audio shortcuts must keep working after interacting with the book.

### Engineering

1. **Student app** = feature-sliced, thin routes, Chakra v3, Biome — `frontend/student/src/features/example/` is the reference layering.
2. **Route → crud → model** on the backend; no business rules in CRUD exceptions.
3. Media URLs are data, not repo artifacts; seed may link, never vendor.
4. Prove API behavior with pytest; prove player journeys with Playwright — Swagger is exploration only.
5. Loading UI should mirror layout (skeletons), not a lone «جاري التحميل».
6. Avoid `overflow` on ancestors of `position: sticky` panes (notes column).

### Content & legal

1. Do not scrape or commit copyrighted شرح PDF/audio.
2. Prefer catalog sources (تمكين Drive, مكتبة الشيخ, licensed CDN) as **links**.
3. Page cues and transcripts need an explicit content workflow and rights check.

### Security & privacy

1. Notes and progress are user data — authz on every read/write.
2. Don’t put JWTs in URLs; keep token handling as today.
3. On-device progress is namespaced per student (`user:<email>:` keys) so another student on a shared device never sees it; sign-out keeps it rather than wiping it.

---

## Decision log (short)

| Decision | Choice | Rationale |
| --- | --- | --- |
| PDF rendering (beta) | `react-pdf` (pdf.js), lazy-loaded, + open tab | The iframe showed only a placeholder on Android; our own RTL labelled controls; no iframe focus trap |
| Notes (beta) | Built (`localStorage` + timestamps), off for v0 | `VITE_NOTES_FEATURE_ENABLED`; unblocks the study loop without an API when turned on |
| Layout | Desktop: book under a one-row toolbar; phone: book fills the screen above the player + reading mode | Students follow the book while listening; no scroll inside a scroll on phones |
| Page sync / highlights / offline cache / in-book search | Deferred | See section above |

Update this file when a deferred item is scheduled or a beta item graduates to “Done” with an API.
