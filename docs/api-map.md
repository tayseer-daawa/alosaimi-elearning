# API map

[← Back to docs index](./README.md)

Every endpoint the backend exposes, grouped by the generated client class that calls it.
70 operations across 11 services.

> **This file is derived from the generated client.** It is currently maintained by hand;
> a generator script is planned so that backend changes update it automatically.
> Until then, regenerate the client with `./scripts/generate-client.sh` and re-check this
> table when the backend changes.

---

## How to call these

Import the service class, not a URL. Types come with it.

```ts
import { ProgramsService } from "@/client"

const programs = await ProgramsService.readPrograms({ skip: 0, limit: 100 })
```

The bearer token is attached globally by an interceptor in `src/main.tsx` — never set the
`Authorization` header yourself. All paths are relative to `VITE_API_URL`.

Argument and response types live in `src/client/types.gen.ts`, named after the operation
(`ProgramsReadProgramsData`, `ProgramsReadProgramsResponse`). **`sdk.gen.ts` is 1600+
lines — grep it for the method you need, do not read it end to end.**

---

## Services

### BooksService

| Method | HTTP | Path |
| --- | --- | --- |
| `readBooks()` | GET | `/api/v1/books/` |
| `createBook()` | POST | `/api/v1/books/` |
| `deleteBook()` | DELETE | `/api/v1/books/{book_id}` |
| `readBook()` | GET | `/api/v1/books/{book_id}` |
| `updateBook()` | PATCH | `/api/v1/books/{book_id}` |

### ExamsService

| Method | HTTP | Path |
| --- | --- | --- |
| `createExam()` | POST | `/api/v1/exams/` |
| `deleteExam()` | DELETE | `/api/v1/exams/{exam_id}` |
| `readExam()` | GET | `/api/v1/exams/{exam_id}` |
| `updateExam()` | PATCH | `/api/v1/exams/{exam_id}` |
| `readMyExamAttempts()` | GET | `/api/v1/exams/{exam_id}/attempts` |
| `createExamAttempt()` | POST | `/api/v1/exams/{exam_id}/attempts` |
| `readStudentExamAttempts()` | GET | `/api/v1/exams/{exam_id}/attempts/student/{student_id}` |
| `updateExamAttempt()` | PATCH | `/api/v1/exams/attempts/{attempt_id}` |
| `readExamsBySession()` | GET | `/api/v1/exams/session/{session_id}` |

### LessonsService

| Method | HTTP | Path |
| --- | --- | --- |
| `createLesson()` | POST | `/api/v1/lessons/` |
| `deleteLesson()` | DELETE | `/api/v1/lessons/{lesson_id}` |
| `readLesson()` | GET | `/api/v1/lessons/{lesson_id}` |
| `updateLesson()` | PATCH | `/api/v1/lessons/{lesson_id}` |
| `readLessonsByBook()` | GET | `/api/v1/lessons/book/{book_id}` |

### LoginService

| Method | HTTP | Path |
| --- | --- | --- |
| `loginAccessToken()` | POST | `/api/v1/login/access-token` |
| `testToken()` | POST | `/api/v1/login/test-token` |
| `recoverPasswordHtmlContent()` | POST | `/api/v1/password-recovery-html-content/{email}` |
| `recoverPassword()` | POST | `/api/v1/password-recovery/{email}` |
| `resetPassword()` | POST | `/api/v1/reset-password/` |

### PhasesService

| Method | HTTP | Path |
| --- | --- | --- |
| `readPhases()` | GET | `/api/v1/phases/` |
| `createPhase()` | POST | `/api/v1/phases/` |
| `deletePhase()` | DELETE | `/api/v1/phases/{phase_id}` |
| `readPhase()` | GET | `/api/v1/phases/{phase_id}` |
| `updatePhase()` | PATCH | `/api/v1/phases/{phase_id}` |
| `removeBookFromPhase()` | DELETE | `/api/v1/phases/{phase_id}/books/{book_id}` |
| `addBookToPhase()` | POST | `/api/v1/phases/{phase_id}/books/{book_id}` |
| `readPhasesByProgram()` | GET | `/api/v1/phases/program/{program_id}` |

### PrivateService

| Method | HTTP | Path |
| --- | --- | --- |
| `createUser()` | POST | `/api/v1/private/users/` |

### ProgramsService

| Method | HTTP | Path |
| --- | --- | --- |
| `readPrograms()` | GET | `/api/v1/programs/` |
| `createProgram()` | POST | `/api/v1/programs/` |
| `deleteProgram()` | DELETE | `/api/v1/programs/{program_id}` |
| `readProgram()` | GET | `/api/v1/programs/{program_id}` |
| `updateProgram()` | PATCH | `/api/v1/programs/{program_id}` |

### QuestionsService

| Method | HTTP | Path |
| --- | --- | --- |
| `readQuestions()` | GET | `/api/v1/questions/` |
| `createQuestion()` | POST | `/api/v1/questions/` |
| `deleteQuestion()` | DELETE | `/api/v1/questions/{question_id}` |
| `readQuestion()` | GET | `/api/v1/questions/{question_id}` |
| `updateQuestion()` | PATCH | `/api/v1/questions/{question_id}` |
| `readQuestionsByLesson()` | GET | `/api/v1/questions/lesson/{lesson_id}` |

### SessionsService

| Method | HTTP | Path |
| --- | --- | --- |
| `readSessions()` | GET | `/api/v1/sessions/` |
| `createSession()` | POST | `/api/v1/sessions/` |
| `deleteSession()` | DELETE | `/api/v1/sessions/{session_id}` |
| `readSession()` | GET | `/api/v1/sessions/{session_id}` |
| `updateSession()` | PATCH | `/api/v1/sessions/{session_id}` |
| `readSessionBreaks()` | GET | `/api/v1/sessions/{session_id}/breaks` |
| `readSessionEvents()` | GET | `/api/v1/sessions/{session_id}/events` |
| `createSessionEvent()` | POST | `/api/v1/sessions/{session_id}/events` |
| `readSessionLessons()` | GET | `/api/v1/sessions/{session_id}/lessons` |
| `removeStudentFromSession()` | DELETE | `/api/v1/sessions/{session_id}/students/{user_id}` |
| `addStudentToSession()` | POST | `/api/v1/sessions/{session_id}/students/{user_id}` |
| `removeTeacherFromSession()` | DELETE | `/api/v1/sessions/{session_id}/teachers/{user_id}` |
| `addTeacherToSession()` | POST | `/api/v1/sessions/{session_id}/teachers/{user_id}` |
| `readSessionsByProgram()` | GET | `/api/v1/sessions/program/{program_id}` |

### UsersService

| Method | HTTP | Path |
| --- | --- | --- |
| `readUsers()` | GET | `/api/v1/users/` |
| `createUser()` | POST | `/api/v1/users/` |
| `deleteUser()` | DELETE | `/api/v1/users/{user_id}` |
| `readUserById()` | GET | `/api/v1/users/{user_id}` |
| `updateUser()` | PATCH | `/api/v1/users/{user_id}` |
| `deleteUserMe()` | DELETE | `/api/v1/users/me` |
| `readUserMe()` | GET | `/api/v1/users/me` |
| `updateUserMe()` | PATCH | `/api/v1/users/me` |
| `updatePasswordMe()` | PATCH | `/api/v1/users/me/password` |
| `registerUser()` | POST | `/api/v1/users/signup` |

### UtilsService

| Method | HTTP | Path |
| --- | --- | --- |
| `healthCheck()` | GET | `/api/v1/utils/health-check/` |
| `testEmail()` | POST | `/api/v1/utils/test-email/` |

---

## Not yet used by the student app

`ExamsService`, `QuestionsService`, `SessionsService` and `LessonsService` are fully
generated and typed, but no student screen calls them yet. See
[feature-status.md](../frontend/student/docs/feature-status.md).

`PrivateService` only exists outside production and is under review for removal
(issue #69). Do not build on it.
