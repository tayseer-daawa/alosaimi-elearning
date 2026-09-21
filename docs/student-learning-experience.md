# Student learning experience — roadmap & best practices

Product and engineering guide for the **student course player** (شرح صوتي + PDF + ملاحظات) and related learning features in AlOsaimi E-Learning (برنامج مهمات العلم and sibling tracks).

Use this when prioritizing post-beta work. Domain vocabulary and curriculum map live in [`.claude/skills/muhimmat-al-ilm/SKILL.md`](../.claude/skills/muhimmat-al-ilm/SKILL.md). Agent conventions live in [`AGENTS.md`](../AGENTS.md).

**API / auth / production readiness** (what is wired vs localStorage vs missing): [student-frontend-api-readiness.md](./student-frontend-api-readiness.md).

---

## Beta baseline (shipped)

What “good enough for beta” means today:

| Area | Behavior |
| --- | --- |
| Audio | Custom player with keyboard shortcuts, resume, rate, mute, lesson list, safe-area / touch targets |
| PDF | Browser iframe viewer + «فتح PDF في تبويب جديد»; empty and timeout states with retry |
| Layout | Desktop RTL split (PDF \| notes); notes column collapsible; mobile tabs |
| Notes | Local `localStorage` draft, insert/jump timestamps tied to audio, long «ملاحظات الشرح» collapsed by default |
| Focus | Clicking player / notes / outside the iframe restores shortcuts; hint when the iframe steals focus |
| Loading | Layout-aware skeletons on browse + course screens |

**Do not** restyle the browser’s native PDF chrome (English / LTR toolbar inside an RTL app). That cost is high and the win is low while we stay on iframe.

---

## Explicitly deferred (do not start in beta)

These are real product ideas. They are **out of scope** until the graph, sessions, and core player are stable in production.

### 1. Custom `pdf.js` / `react-pdf` UI

Replace the iframe with a first-party viewer (page canvas, branded toolbar, RTL chrome).

| Why defer | Notes |
| --- | --- |
| Large dependency and a11y surface | Keyboard, zoom, text layer, print, download |
| Cross-browser PDF quirks move into *our* bugs | iframe pushes them to the browser |
| Copyright / hosting | Still must not vendor matn PDFs into git; viewer does not remove CDN / CORS issues |

**Revisit when:** product needs page-level deep links, highlights, or a consistent UI on browsers with weak built-in PDF support (some mobile WebViews).

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
| Implies custom viewer or a PDF annotation library | Conflicts with iframe baseline |
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
8. **Custom PDF viewer** only if #7 or annotations require it.

---

## Feature catalog (this kind of app)

A checklist of improvements that fit **مهمات العلم–style** platforms. Mark status as you ship. Not every item belongs in v1.

### Course player (audio + PDF + notes)

| Feature | Status | Notes |
| --- | --- | --- |
| Keyboard shortcuts + HUD | Done (beta) | Keep documented in-app |
| Resume position / rate locally | Done (beta) | Promote to API next |
| Lesson playlist drawer | Done (beta) | |
| Desktop PDF \| notes split | Done (beta) | Notes column collapsible on desktop |
| Mobile book / notes tabs | Done (beta) | |
| Collapse notes pane (desktop) | Done (beta) | Preference in `localStorage` |
| Timestamp chips in notes | Done (beta) | |
| PDF empty / timeout / open tab | Done (beta) | |
| Shortcut hint when iframe focused | Done (beta) | |
| Synced notes (API) | Next | |
| Page ↔ audio cues | Deferred | Needs metadata |
| Custom pdf.js UI | Deferred | |
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
| Phase book chip «آخر درس» | Done (beta) | Highlights `continue_learning_path.bookId` only |
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
| Focus not trapped in PDF iframe | Done (beta) |
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

---

## Best practices

### Product

1. **Prefer real matn titles and program names** — never invent generic LMS English in the student UI.
2. **Ship the listening loop first** — open درس → سمع → اقرأ المتن → دوّن ملاحظة — before gamification.
3. **Local-first notes are fine for beta**; cloud sync must not wipe local drafts without merge.
4. **Open-in-new-tab is a feature**, not a failure — especially when hosts block embedding.
5. **Defer custom PDF** until a concrete feature *requires* page control (cues, highlights).

### UX (student, Arabic RTL)

1. One primary task per surface; the player bar stays predictable.
2. Don’t fight browser PDF chrome while on iframe.
3. Keep «ملاحظاتي» above the fold; long teacher notes collapse.
4. Mobile: one panel at a time (tabs), not a squeezed split.
5. Shortcuts must work after leaving the PDF — document the hint string and keep it accurate.

### Engineering

1. **Student app** = feature-sliced, thin routes, Chakra v3, Biome — see `AGENTS.md`.
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
3. Be careful with `iframe` sandbox only if you move off opaque third-party viewers — sandbox can break legitimate PDF plugins.

---

## Decision log (short)

| Decision | Choice | Rationale |
| --- | --- | --- |
| PDF rendering (beta) | Browser iframe + open tab | Fast, good enough, no custom viewer debt |
| Notes (beta) | `localStorage` + timestamps | Unblocks study loop without API |
| Layout | Split desktop / tabs mobile | Matches how students listen + read |
| Custom viewer / sync / highlights / offline cache | Deferred | See section above |

Update this file when a deferred item is scheduled or a beta item graduates to “Done” with an API.
