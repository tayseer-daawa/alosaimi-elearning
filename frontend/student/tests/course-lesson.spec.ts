import { expect, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"
const STUDENT_EMAIL = "student@example.com"
const STUDENT_PASSWORD = "Student123!"

async function loginAsStudent(page: import("@playwright/test").Page) {
  const body = new URLSearchParams({
    username: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
  })
  const tokenRes = await page.request.post(`${API}/api/v1/login/access-token`, {
    form: Object.fromEntries(body),
  })
  expect(tokenRes.ok()).toBeTruthy()
  const { access_token } = await tokenRes.json()

  await page.goto("/welcome")
  await page.evaluate(
    ({ token, email }) => {
      localStorage.setItem("access_token", token)
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email, full_name: "طالب تجريبي" }),
      )
    },
    { token: access_token, email: STUDENT_EMAIL },
  )
}

async function openFirstLesson(page: import("@playwright/test").Page) {
  const programs = await page.request.get(`${API}/api/v1/programs/?limit=50`)
  expect(programs.ok()).toBeTruthy()
  const progJson = await programs.json()
  const program =
    progJson.data.find((p: { title: string }) => p.title === "مهمات العلم") ??
    progJson.data[0]
  expect(program).toBeTruthy()

  const phases = await page.request.get(
    `${API}/api/v1/phases/program/${program.id}?limit=50`,
  )
  expect(phases.ok()).toBeTruthy()
  const phaseList = (await phases.json()).data as {
    id: string
    order: number
  }[]
  const phase = [...phaseList].sort((a, b) => a.order - b.order)[0]

  const books = await page.request.get(
    `${API}/api/v1/phases/${phase.id}/books?limit=50`,
  )
  expect(books.ok()).toBeTruthy()
  const book = (await books.json()).data[0]
  expect(book).toBeTruthy()

  const lessons = await page.request.get(
    `${API}/api/v1/lessons/book/${book.id}?limit=50`,
  )
  expect(lessons.ok()).toBeTruthy()
  const lessonList = (await lessons.json()).data as {
    id: string
    order: number
  }[]
  const lesson = [...lessonList].sort((a, b) => a.order - b.order)[0]
  expect(lesson).toBeTruthy()

  const url = `/programs/${program.id}/phases/${phase.id}/books/${book.id}/courses/${lesson.id}`
  await page.goto(url)
  await expect(page.getByTestId("course-screen")).toBeVisible()
  return { url, lessonId: lesson.id, bookTitle: book.title as string }
}

test.describe("course lesson player", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  test("shows PDF reader, notes tab, and audio player controls", async ({
    page,
  }) => {
    await openFirstLesson(page)

    await expect(page.getByTestId("tab-book")).toBeVisible()
    await expect(page.getByTestId("pdf-reader")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-frame")).toBeVisible()

    await page.getByTestId("tab-notes").click()
    await expect(page.getByTestId("lesson-notes")).toBeVisible()
    await expect(page.getByTestId("lesson-notes-input")).toBeVisible()

    const note = `ملاحظة اختبار ${Date.now()}`
    await page.getByTestId("lesson-notes-input").fill(note)
    await expect(page.getByTestId("lesson-notes-saved")).toHaveText(
      "تم الحفظ محلياً",
    )

    await page.getByTestId("tab-book").click()
    await page.getByTestId("tab-notes").click()
    await expect(page.getByTestId("lesson-notes-input")).toHaveValue(note)

    const player = page.getByTestId("audio-player")
    await expect(player).toBeVisible()
    await expect(page.getByTestId("audio-play-pause")).toBeVisible()
    await expect(page.getByTestId("audio-current-time")).toBeVisible()
    await expect(page.getByTestId("audio-duration")).toBeVisible()
  })

  test("play / pause and keyboard seek update playback position", async ({
    page,
  }) => {
    await openFirstLesson(page)

    const play = page.getByTestId("audio-play-pause")
    await play.click()
    await expect(play).toHaveAttribute("aria-label", "إيقاف مؤقت")

    await page.waitForTimeout(1500)
    const timeAfterPlay = await page
      .getByTestId("audio-current-time")
      .innerText()
    expect(timeAfterPlay).not.toBe("0:00")

    await play.click()
    await expect(play).toHaveAttribute("aria-label", "تشغيل")

    const before = await page.evaluate(() => {
      const audio = document.querySelector("audio")
      return audio?.currentTime ?? 0
    })
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    const after = await page.evaluate(() => {
      const audio = document.querySelector("audio")
      return audio?.currentTime ?? 0
    })
    expect(after).toBeGreaterThanOrEqual(before + 5)
  })

  test("keyboard shortcuts show center action HUD", async ({ page }) => {
    await openFirstLesson(page)

    await page.keyboard.press("m")
    const hud = page.getByTestId("player-action-hud")
    await expect(hud).toBeVisible()
    await expect(hud).toContainText(/صامت|الصوت مفعّل/)

    await page.keyboard.press("ArrowRight")
    await expect(hud).toBeVisible()
    await expect(hud).toContainText("تقديم")

    await page.keyboard.press("k")
    await expect(hud).toBeVisible()
    await expect(hud).toContainText(/تشغيل|إيقاف/)
  })

  test("next lesson navigation from player", async ({ page }) => {
    const { url } = await openFirstLesson(page)
    const nextBtn = page.getByTestId("audio-next-lesson")
    if (await nextBtn.isDisabled()) {
      test.skip()
      return
    }
    await nextBtn.click()
    await expect(page).not.toHaveURL(url)
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await expect(page.getByTestId("audio-player")).toBeVisible()
  })
})
