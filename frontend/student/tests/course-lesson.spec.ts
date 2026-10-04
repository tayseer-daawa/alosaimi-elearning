import { expect, type Page, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"
const STUDENT_EMAIL = "student@example.com"
const STUDENT_PASSWORD = "Student123!"

async function loginAsStudent(page: Page) {
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

async function openFirstLesson(page: Page) {
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
  const sorted = [...lessonList].sort((a, b) => a.order - b.order)
  const lesson = sorted[0]
  expect(lesson).toBeTruthy()

  const url = `/programs/${program.id}/phases/${phase.id}/books/${book.id}/courses/${lesson.id}`
  await page.goto(url)
  await expect(page.getByTestId("course-screen")).toBeVisible()
  await expect(page.locator("audio")).toHaveCount(1)
  return {
    url,
    programId: program.id as string,
    phaseId: phase.id as string,
    bookId: book.id as string,
    lessonId: lesson.id,
    bookTitle: book.title as string,
    hasNext: sorted.length > 1,
    hasPrev: false,
  }
}

/** The first book page is drawn by pdf.js (a painted canvas, not an iframe). */
async function expectFirstPdfPageDrawn(page: Page) {
  const firstPage = page.getByTestId("pdf-reader-page-1")
  await expect(firstPage.locator("canvas")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId("pdf-reader-loading")).toHaveCount(0)
}

async function audioState(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector("audio")
    if (!audio) return null
    return {
      currentTime: audio.currentTime,
      duration: audio.duration,
      paused: audio.paused,
      volume: audio.volume,
      playbackRate: audio.playbackRate,
    }
  })
}

async function waitForAudioReady(page: Page) {
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio")
    return Boolean(
      audio && Number.isFinite(audio.duration) && audio.duration > 20,
    )
  })
}

test.describe("course lesson player", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  test("shows PDF reader and audio player controls", async ({ page }) => {
    await openFirstLesson(page)

    // v0: notes UI hidden — PDF full width, no book/notes tabs.
    await expect(page.getByTestId("tab-book")).toHaveCount(0)
    await expect(page.getByTestId("tab-notes")).toHaveCount(0)
    await expect(page.getByTestId("tab-panel-notes")).toHaveCount(0)
    await expect(page.getByTestId("lesson-notes")).toHaveCount(0)
    await expect(page.getByTestId("tab-panel-book")).toBeVisible()
    await expect(page.getByTestId("pdf-reader")).toBeVisible()
    await expectFirstPdfPageDrawn(page)
    await expect(page.getByTestId("course-split")).toHaveAttribute(
      "data-notes-open",
      "false",
    )

    const player = page.getByTestId("audio-player")
    await expect(player).toBeVisible()
    await expect(page.getByTestId("audio-play-pause")).toBeVisible()
    await expect(page.getByTestId("audio-current-time")).toBeVisible()
    await expect(page.getByTestId("audio-duration")).toBeVisible()
    await expect(page.getByTestId("audio-shortcuts")).toBeVisible()

    await waitForAudioReady(page)
    const durationText = await page.getByTestId("audio-duration").innerText()
    const parts = durationText.split(":")
    // ≥1h lectures: H:MM:SS; shorter ones stay M:SS
    expect(parts.length === 2 || parts.length === 3).toBeTruthy()
    if (parts.length === 3) {
      expect(Number(parts[0])).toBeGreaterThan(0)
      expect(Number(parts[1])).toBeLessThan(60)
    } else {
      expect(Number(parts[0])).toBeLessThan(60)
    }
  })

  test("phone: the book shows right away and fills the screen above the player", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openFirstLesson(page)

    await expect(page.getByTestId("tab-book")).toHaveCount(0)
    await expect(page.getByTestId("tab-notes")).toHaveCount(0)
    await expect(page.getByTestId("lesson-notes")).toHaveCount(0)
    // No tap needed: the book is drawn on the lesson page itself.
    // (Mobile browsers without a PDF viewer showed a placeholder in the iframe.)
    await expectFirstPdfPageDrawn(page)
    await expect(page.getByTestId("pdf-reader-phone-bar")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-page-label")).toContainText(
      "1 من",
    )
    const pageBox = await page.getByTestId("pdf-reader-page-1").boundingBox()
    expect(pageBox?.width ?? 0).toBeGreaterThan(300)

    // Only the book scrolls: the page fits the screen and the book ends
    // above the fixed audio player.
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        ),
      )
      .toBeLessThanOrEqual(1)
    const book = (await page.getByTestId("pdf-reader-pages").boundingBox())!
    const player = (await page.getByTestId("audio-player").boundingBox())!
    expect(book.y + book.height).toBeLessThanOrEqual(player.y + 1)
    expect(book.height).toBeGreaterThan(300)

    // On a taller screen the book grows to the player — no empty band.
    await page.setViewportSize({ width: 390, height: 1100 })
    await expect
      .poll(async () => {
        const b = (await page.getByTestId("pdf-reader-pages").boundingBox())!
        const p = (await page.getByTestId("audio-player").boundingBox())!
        return p.y - (b.y + b.height)
      })
      .toBeLessThan(60)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      ),
    ).toBeLessThanOrEqual(1)
    await page.setViewportSize({ width: 390, height: 844 })

    await page.getByTestId("pdf-reader-next-page").click()
    await expect(page.getByTestId("pdf-reader-page-label")).toContainText(
      "2 من",
    )

    // All controls fit in one row, and the zoom toggle goes in and back out.
    const bar = (await page.getByTestId("pdf-reader-phone-bar").boundingBox())!
    expect(bar.height).toBeLessThan(70)
    const toggle = page.getByTestId("pdf-reader-zoom-toggle")
    const fitted = (await page.getByTestId("pdf-reader-page-1").boundingBox())!
      .width
    await expect(toggle).toContainText("تكبير")
    await toggle.click()
    await expect(toggle).toContainText("تصغير")
    await expect
      .poll(
        async () =>
          (await page.getByTestId("pdf-reader-page-1").boundingBox())!.width,
      )
      .toBeGreaterThan(fitted * 1.8)
    await toggle.click()
    await expect(toggle).toContainText("تكبير")
  })

  test("phone reading mode: compact controls, audio strip, back button closes it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const { url } = await openFirstLesson(page)
    const reader = page.getByTestId("pdf-reader")
    await page.getByTestId("pdf-reader-open-reading").click()
    await expect(reader).toHaveAttribute("data-reading", "true")
    await expectFirstPdfPageDrawn(page)
    const box = (await reader.boundingBox())!
    expect(box.y).toBe(0)
    expect(box.height).toBeGreaterThan(800)
    // The book gets most of the screen; controls stay compact.
    const pagesBox = (await page.getByTestId("pdf-reader-pages").boundingBox())!
    expect(pagesBox.height).toBeGreaterThan(box.height * 0.6)

    await page.getByTestId("pdf-reader-next-page").click()
    await expect(page.getByTestId("pdf-reader-page-input")).toHaveValue("2")
    const level = page.getByTestId("pdf-reader-zoom-level")
    const before = await level.innerText()
    await page.getByTestId("pdf-reader-zoom-in").click()
    await expect(level).not.toHaveText(before)

    // The strip drives the same audio as the main player.
    await waitForAudioReady(page)
    await page.getByTestId("reading-audio-play").click()
    await expect(page.getByTestId("reading-audio-play")).toHaveAttribute(
      "aria-label",
      "إيقاف مؤقت",
    )
    await expect.poll(async () => (await audioState(page))?.paused).toBe(false)
    await expect(page.getByTestId("audio-play-pause")).toHaveAttribute(
      "aria-label",
      "إيقاف مؤقت",
    )
    await page.getByTestId("reading-audio-play").click()
    await expect.poll(async () => (await audioState(page))?.paused).toBe(true)

    // The phone's back button closes reading mode and stays on the lesson.
    await page.goBack()
    await expect(reader).toHaveAttribute("data-reading", "false")
    expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(
      url.replace(/\/$/, ""),
    )
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-page-label")).toContainText(
      "2 من",
    )

    // «إغلاق» closes it too; reopening lands on the same page.
    await page.getByTestId("pdf-reader-open-reading").click()
    await expect(page.getByTestId("pdf-reader-page-input")).toHaveValue("2")
    await page.getByTestId("pdf-reader-close-reading").click()
    await expect(reader).toHaveAttribute("data-reading", "false")
    expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(
      url.replace(/\/$/, ""),
    )
  })

  test("phone reading mode: pinch and double-tap zoom the book, and zoom is remembered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openFirstLesson(page)
    await page.getByTestId("pdf-reader-open-reading").click()
    await expectFirstPdfPageDrawn(page)
    const level = page.getByTestId("pdf-reader-zoom-level")
    const percent = async () =>
      Number((await level.innerText()).replace(/\D/g, ""))
    const fitWidth = await percent()

    // Synthetic touches straight on the book (Playwright has no multi-touch).
    const touch = (
      type: "touchstart" | "touchmove" | "touchend",
      points: [number, number][],
    ) =>
      page.getByTestId("pdf-reader-pages").evaluate(
        (el, { type, points }) => {
          const rect = el.getBoundingClientRect()
          const touches = points.map(
            ([x, y], i) =>
              new Touch({
                identifier: i,
                target: el,
                clientX: rect.left + x,
                clientY: rect.top + y,
              }),
          )
          const active = type === "touchend" ? [] : touches
          el.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: active,
              targetTouches: active,
              changedTouches: touches,
            }),
          )
        },
        { type, points },
      )

    // Pinch out: fingers move apart from 100px to 200px.
    await touch("touchstart", [
      [150, 200],
      [250, 200],
    ])
    await touch("touchmove", [
      [100, 200],
      [300, 200],
    ])
    await touch("touchend", [
      [100, 200],
      [300, 200],
    ])
    await expect.poll(percent).toBeGreaterThan(fitWidth * 1.6)

    // Double-tap goes back to fit width, then zooms in again.
    const doubleTap = async () => {
      for (let i = 0; i < 2; i++) {
        await touch("touchstart", [[180, 250]])
        await touch("touchend", [[180, 250]])
      }
    }
    await doubleTap()
    await expect.poll(percent).toBe(fitWidth)
    await doubleTap()
    await expect.poll(percent).toBeGreaterThan(fitWidth * 1.6)
    const zoomed = await percent()

    // The chosen zoom comes back after a reload.
    await page.reload()
    await page.getByTestId("pdf-reader-open-reading").click()
    await expectFirstPdfPageDrawn(page)
    await expect.poll(percent).toBe(zoomed)
  })

  test("PDF load failure offers retry and open-in-tab; retry draws the book", async ({
    page,
  }) => {
    let failPdf = true
    await page.route(/\.pdf(\?|$)/i, (route) =>
      failPdf ? route.fulfill({ status: 404 }) : route.fallback(),
    )
    await openFirstLesson(page)

    await expect(page.getByTestId("pdf-reader-error")).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByTestId("pdf-reader-error")).toContainText(
      "تعذر عرض الملف داخل الصفحة",
    )
    await expect(page.getByTestId("pdf-reader-open-tab-panel")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-open-tab")).toBeVisible()

    failPdf = false
    await page.getByTestId("pdf-reader-retry-panel").click()
    await expect(page.getByTestId("pdf-reader-error")).toHaveCount(0)
    await expectFirstPdfPageDrawn(page)
  })

  test("PDF zoom: buttons step the %, fit modes, and ctrl+wheel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openFirstLesson(page)
    await expectFirstPdfPageDrawn(page)
    const level = page.getByTestId("pdf-reader-zoom-level")
    const percent = async () =>
      Number((await level.innerText()).replace(/\D/g, ""))
    const firstPage = page.getByTestId("pdf-reader-page-1")
    const width = async () => (await firstPage.boundingBox())?.width ?? 0
    const reader = page.getByTestId("pdf-reader-pages")

    // Desktop opens on the whole page: it fits the reader's height.
    await expect(page.getByTestId("pdf-reader-fit-page")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    const readerBox = (await reader.boundingBox())!
    expect((await firstPage.boundingBox())!.height).toBeLessThanOrEqual(
      readerBox.height,
    )

    // Zoom out goes several steps below the fitted size, not just one.
    const start = await percent()
    for (let i = 0; i < 2; i++) {
      const before = await percent()
      await page.getByTestId("pdf-reader-zoom-out").click()
      await expect.poll(percent).toBeLessThan(before)
    }
    expect(await percent()).toBeLessThan(start)
    const zoomedOut = await width()
    await page.getByTestId("pdf-reader-zoom-in").click()
    await expect.poll(width).toBeGreaterThan(zoomedOut)

    await page.getByTestId("pdf-reader-fit-width").click()
    await expect.poll(width).toBeGreaterThan(readerBox.width - 60)

    // Ctrl + wheel over the book zooms the book, not the page.
    const fitWidthPercent = await percent()
    await reader.hover()
    await page.keyboard.down("Control")
    await page.mouse.wheel(0, 300)
    await page.keyboard.up("Control")
    await expect.poll(percent).toBeLessThan(fitWidthPercent)
  })

  test("PDF page navigation: next, previous, and jump to a page", async ({
    page,
  }) => {
    await openFirstLesson(page)
    await expectFirstPdfPageDrawn(page)
    const input = page.getByTestId("pdf-reader-page-input")
    await expect(input).toHaveValue("1")
    await expect(page.getByTestId("pdf-reader-prev-page")).toBeDisabled()

    await page.getByTestId("pdf-reader-next-page").click()
    await expect(input).toHaveValue("2")

    await input.fill("7")
    await input.press("Enter")
    await expect(input).toHaveValue("7")
    await expect(
      page.getByTestId("pdf-reader-page-7").locator("canvas"),
    ).toBeVisible()

    await page.getByTestId("pdf-reader-prev-page").click()
    await expect(input).toHaveValue("6")

    // Scrolling by hand moves the page number too.
    await page
      .getByTestId("pdf-reader-page-3")
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await expect(input).toHaveValue("3")
  })

  test("PDF full screen shows only the book and exits again", async ({
    page,
  }) => {
    await openFirstLesson(page)
    await expectFirstPdfPageDrawn(page)
    const toggle = page.getByTestId("pdf-reader-fullscreen")
    await toggle.click()
    await expect(page.getByTestId("pdf-reader")).toHaveAttribute(
      "data-fullscreen",
      "true",
    )
    expect(
      await page.evaluate(
        () => document.fullscreenElement?.getAttribute("data-testid") ?? null,
      ),
    ).toBe("pdf-reader")
    await expect(toggle).toContainText("الخروج من ملء الشاشة")

    await toggle.click()
    await expect(page.getByTestId("pdf-reader")).toHaveAttribute(
      "data-fullscreen",
      "false",
    )
  })

  test("reopens the book on the page the student was reading", async ({
    page,
  }) => {
    await openFirstLesson(page)
    await expectFirstPdfPageDrawn(page)
    const input = page.getByTestId("pdf-reader-page-input")
    await input.fill("4")
    await input.press("Enter")
    await expect(input).toHaveValue("4")

    await page.reload()
    await expect(page.getByTestId("pdf-reader-page-input")).toHaveValue("4", {
      timeout: 20_000,
    })
    await expect(
      page.getByTestId("pdf-reader-page-4").locator("canvas"),
    ).toBeVisible()
  })

  test("retry reloads the audio after it failed to load", async ({ page }) => {
    let failAudio = true
    await page.route("**/*", (route) =>
      failAudio && route.request().resourceType() === "media"
        ? route.abort()
        : route.fallback(),
    )
    await openFirstLesson(page)

    const retry = page.getByTestId("audio-player-retry")
    await expect(retry).toBeVisible({ timeout: 15_000 })

    failAudio = false
    await retry.click()

    await waitForAudioReady(page)
    await expect(page.getByTestId("audio-player-loading")).toHaveCount(0)
    await expect(retry).toHaveCount(0)
  })

  test("UI controls: play, mute, rate, and seek", async ({ page }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    // Desktop: ±10 must be on-screen — not shortcut-only (non-technical users).
    await expect(page.getByTestId("audio-skip-back")).toBeVisible()
    await expect(page.getByTestId("audio-skip-forward")).toBeVisible()
    await expect(page.getByTestId("audio-skip-back")).toHaveAttribute(
      "aria-label",
      "ترجيع 10 ثوانٍ",
    )
    await page.evaluate(() => {
      const audio = document.querySelector("audio")
      if (audio) audio.currentTime = 30
    })
    await page.getByTestId("audio-skip-forward").click()
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(39.5)
    await page.getByTestId("audio-skip-back").click()
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeLessThanOrEqual(31)

    const play = page.getByTestId("audio-play-pause")
    await play.click()
    await expect(play).toHaveAttribute("aria-label", "إيقاف مؤقت")
    await expect.poll(async () => (await audioState(page))?.paused).toBe(false)

    await play.click()
    await expect(play).toHaveAttribute("aria-label", "تشغيل")
    await expect.poll(async () => (await audioState(page))?.paused).toBe(true)

    await page.getByTestId("audio-mute").click()
    await expect.poll(async () => (await audioState(page))?.volume).toBe(0)
    await expect(page.getByTestId("player-action-hud")).toContainText("صامت")

    await page.getByTestId("audio-mute").click()
    await expect
      .poll(async () => (await audioState(page))?.volume)
      .toBeGreaterThan(0)

    await page.getByTestId("audio-rate").click()
    await page.getByRole("menuitem", { name: "1.25×" }).click()
    await expect
      .poll(async () => (await audioState(page))?.playbackRate)
      .toBe(1.25)
    await expect(page.getByTestId("player-action-hud")).toContainText("1.25×")
    await expect(page.getByTestId("player-action-hud")).toBeVisible()

    await page.getByTestId("audio-rate").click()
    await expect(page.getByRole("menuitem", { name: "2×" })).toBeVisible()
    await page.getByRole("menuitem", { name: "2×" }).click()
    await expect
      .poll(async () => (await audioState(page))?.playbackRate)
      .toBe(2)

    // After picking a rate with the mouse, Space must only play/pause — not re-hit the menu.
    await page.keyboard.press("Space")
    await expect(play).toHaveAttribute("aria-label", "إيقاف مؤقت")
    await expect
      .poll(async () => (await audioState(page))?.playbackRate)
      .toBe(2)
    await page.keyboard.press("Space")
    await expect(play).toHaveAttribute("aria-label", "تشغيل")
    await expect
      .poll(async () => (await audioState(page))?.playbackRate)
      .toBe(2)

    const before = (await audioState(page))!.currentTime
    await page.evaluate(() => {
      const audio = document.querySelector("audio")
      if (audio) audio.currentTime = 12
    })
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(11)
    expect((await audioState(page))!.currentTime).not.toBe(before)
  })

  test("all keyboard shortcuts control playback", async ({ page }) => {
    const { url, hasNext, lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)

    const hud = page.getByTestId("player-action-hud")

    // Space / K — play & pause
    await page.keyboard.press("Space")
    await expect(hud).toContainText("تشغيل")
    await expect.poll(async () => (await audioState(page))?.paused).toBe(false)

    await page.keyboard.press("k")
    await expect(hud).toContainText("إيقاف")
    await expect.poll(async () => (await audioState(page))?.paused).toBe(true)

    // Seed position for seek tests
    await page.evaluate(() => {
      const audio = document.querySelector("audio")
      if (audio) audio.currentTime = 30
    })
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(29)

    // ArrowLeft / ArrowRight — ±5s
    await page.keyboard.press("ArrowRight")
    await expect(hud).toContainText("تقديم")
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(34.5)

    await page.keyboard.press("ArrowLeft")
    await expect(hud).toContainText("ترجيع")
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeLessThanOrEqual(31)

    // J / L — ±10s
    const mid = (await audioState(page))!.currentTime
    await page.keyboard.press("l")
    await expect(hud).toContainText("تقديم")
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(mid + 9.5)

    const afterL = (await audioState(page))!.currentTime
    await page.keyboard.press("j")
    await expect(hud).toContainText("ترجيع")
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeLessThanOrEqual(afterL - 9.5)

    // M — mute / unmute
    await page.keyboard.press("m")
    await expect(hud).toContainText("صامت")
    await expect.poll(async () => (await audioState(page))?.volume).toBe(0)

    await page.keyboard.press("m")
    await expect(hud).toContainText("الصوت مفعّل")
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 0)
      .toBeGreaterThan(0)

    // ArrowUp / ArrowDown — volume
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(hud).toContainText("مستوى الصوت")
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 1)
      .toBeLessThan(1)

    const lowered = (await audioState(page))!.volume
    await page.keyboard.press("ArrowUp")
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 0)
      .toBeGreaterThan(lowered)

    // < / > — playback rate (YouTube-style)
    await page.keyboard.press(">")
    await expect(hud).toContainText("سرعة التشغيل")
    await expect(hud.getByTestId("player-action-hud-detail")).toBeVisible()
    await expect
      .poll(async () => (await audioState(page))?.playbackRate ?? 1)
      .toBeGreaterThan(1)

    await page.keyboard.press("<")
    await expect
      .poll(async () => (await audioState(page))?.playbackRate ?? 0)
      .toBe(1)

    // Shift+N / Shift+P — lesson navigation (player remount clears HUD)
    if (hasNext) {
      await page.keyboard.press("Shift+N")
      await expect(page).not.toHaveURL(url)
      await expect(page.getByTestId("course-screen")).toBeVisible()
      await expect(page.getByTestId("audio-player")).toBeVisible()
      expect(page.url()).not.toContain(lessonId)

      await waitForAudioReady(page)
      await page.keyboard.press("Shift+P")
      await expect(page).toHaveURL(new RegExp(`/courses/${lessonId}`))
    }
  })

  test("shortcuts help opens as dialog from button and ?", async ({ page }) => {
    await openFirstLesson(page)

    await page.getByTestId("audio-shortcuts").click()
    const panel = page.getByTestId("audio-shortcuts-panel")
    await expect(panel).toBeVisible()
    await expect(panel).toContainText("اختصارات المشغّل")
    await expect(page.getByTestId("audio-shortcuts-title")).toHaveCSS(
      "text-align",
      "right",
    )
    await expect(panel).toContainText("→ / ←")
    await expect(panel).toContainText("تشغيل أو إيقاف")
    await expect(panel).toContainText("إبطاء أو تسريع التشغيل")
    await expect(panel).toContainText("المقرر التالي")
    // Dimmed overlay behind the dialog
    await expect(page.locator("[data-part='backdrop']").first()).toBeVisible()

    // RTL: close sits on the physical left; description aligns to the start (right)
    const closeBox = await page
      .getByTestId("audio-shortcuts-close")
      .boundingBox()
    const panelBox = await panel.boundingBox()
    expect(closeBox && panelBox).toBeTruthy()
    if (closeBox && panelBox) {
      expect(closeBox.x).toBeLessThan(panelBox.x + panelBox.width / 2)
    }
    await expect(panel.locator("[data-part='description']")).toHaveCSS(
      "text-align",
      "right",
    )

    await page.getByTestId("audio-shortcuts-close").click()
    await expect(panel).toBeHidden()

    await page.keyboard.press("Shift+/")
    await expect(panel).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(panel).toBeHidden()
  })

  test("volume picker stays open while moving cursor onto the slider", async ({
    page,
  }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    const mute = page.getByTestId("audio-mute")
    const panel = page.getByTestId("audio-volume-panel")

    await mute.hover()
    await expect(panel).toBeVisible()

    // Crossing the former gap must not dismiss the picker.
    await page.getByTestId("audio-volume-bridge").hover({
      position: { x: 20, y: 8 },
    })
    await expect(panel).toBeVisible()

    await panel.hover()
    await expect(panel).toBeVisible()

    const before = (await audioState(page))!.volume
    const slider = panel.getByRole("slider")
    await slider.focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 1)
      .toBeLessThan(before)
    await expect(page.getByTestId("player-action-hud")).toContainText(
      "مستوى الصوت",
    )
    await expect(page.getByTestId("player-action-hud-detail")).toBeVisible()

    // Leaving the volume wrap closes the panel.
    await page.getByTestId("audio-play-pause").hover()
    await expect(panel).toBeHidden()
  })

  test("next lesson navigation from player button", async ({ page }) => {
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

  test("resumes playback position and rate after reload", async ({ page }) => {
    const { lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)

    // Seed on the next document load — pagehide on the current page would
    // otherwise flush React's still-default rate/position over evaluate().
    await page.addInitScript(
      ({ id, position, rate }) => {
        localStorage.setItem(
          `user:student@example.com:lesson_playback:${id}`,
          JSON.stringify({ position, rate, updatedAt: Date.now() }),
        )
      },
      { id: lessonId, position: 45, rate: 1.5 },
    )

    await page.reload()
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await waitForAudioReady(page)

    await expect
      .poll(async () => (await audioState(page))?.playbackRate)
      .toBe(1.5)
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(40)
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 999)
      .toBeLessThan(55)
  })

  test("going back to the start is remembered after reload", async ({
    page,
  }) => {
    const { lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)

    const seekAndPause = (seconds: number) =>
      page.evaluate((to) => {
        const audio = document.querySelector("audio")!
        audio.currentTime = to
        audio.dispatchEvent(new Event("pause"))
      }, seconds)
    const savedPosition = () =>
      page.evaluate((id) => {
        const raw = localStorage.getItem(
          `user:student@example.com:lesson_playback:${id}`,
        )
        return raw ? (JSON.parse(raw) as { position: number }).position : null
      }, lessonId)

    await seekAndPause(45)
    await expect.poll(savedPosition).toBeGreaterThanOrEqual(44)

    await seekAndPause(0)
    await expect.poll(savedPosition).toBeLessThan(2)

    await page.reload()
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await waitForAudioReady(page)
    expect((await audioState(page))?.currentTime ?? 999).toBeLessThan(2)
  })

  test("logging out from a lesson ends the session but keeps the student's progress", async ({
    page,
  }) => {
    const { lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)
    await page.evaluate(() => {
      const audio = document.querySelector("audio")!
      audio.currentTime = 30
      audio.dispatchEvent(new Event("pause"))
    })
    const playbackKey = `user:${STUDENT_EMAIL}:lesson_playback:${lessonId}`
    const storedKeys = () => page.evaluate(() => Object.keys(localStorage))
    await expect.poll(storedKeys).toContain(playbackKey)

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome")

    const keys = await storedKeys()
    expect(keys).not.toContain("access_token")
    expect(keys).not.toContain("student_profile")
    expect(keys).toContain(playbackKey)
    // pagehide flushes from the player have no student to write for.
    expect(keys.filter((k) => k.startsWith("lesson_"))).toEqual([])
  })

  test("persists volume and mute globally across reload", async ({ page }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    // Seed after navigation — pagehide flushes in-memory volume over evaluate().
    await page.addInitScript(() => {
      localStorage.setItem(
        "audio_player_volume",
        JSON.stringify({ volume: 0.4, muted: true }),
      )
    })

    await page.reload()
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await waitForAudioReady(page)

    await expect.poll(async () => (await audioState(page))?.volume).toBe(0)
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("audio_player_volume")
          return raw
            ? (JSON.parse(raw) as { volume: number; muted: boolean })
            : null
        }),
      )
      .toMatchObject({ volume: 0.4, muted: true })

    await page.getByTestId("audio-mute").click()
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 0)
      .toBeCloseTo(0.4, 1)
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("audio_player_volume")
          return raw ? (JSON.parse(raw) as { muted: boolean }).muted : null
        }),
      )
      .toBe(false)
  })

  test("unmute restores audible level after volume was zeroed", async ({
    page,
  }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    await page.addInitScript(() => {
      localStorage.setItem(
        "audio_player_volume",
        JSON.stringify({ volume: 0, muted: true }),
      )
    })
    await page.reload()
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await waitForAudioReady(page)

    await expect(page.getByTestId("audio-mute")).toHaveAttribute(
      "aria-label",
      "إلغاء كتم الصوت",
    )
    await page.getByTestId("audio-mute").click()
    await expect(page.getByTestId("player-action-hud")).toContainText(
      "الصوت مفعّل",
    )
    await expect
      .poll(async () => (await audioState(page))?.volume ?? 0)
      .toBeGreaterThan(0)
    await expect(page.getByTestId("audio-mute")).toHaveAttribute(
      "aria-label",
      "كتم الصوت",
    )
  })

  test("lesson drawer shows resume and completion toggles", async ({
    page,
  }) => {
    const { lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)

    await page.evaluate((id) => {
      localStorage.setItem(
        `user:student@example.com:lesson_playback:${id}`,
        JSON.stringify({ position: 90, rate: 1, updatedAt: Date.now() }),
      )
      localStorage.removeItem(`user:student@example.com:lesson_completed:${id}`)
    }, lessonId)

    await page.getByTestId("lesson-list-open").click()
    const drawer = page.getByTestId("lesson-list-drawer")
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText("مقررات الكتاب")
    await expect(drawer.getByTestId("lesson-list-item-0")).toBeVisible()
    await expect(drawer).toContainText("استئناف من")

    await page.getByTestId("lesson-complete-toggle-0").click()
    await expect(drawer).toContainText("مكتمل")
    await expect
      .poll(async () =>
        page.evaluate(
          (id) =>
            localStorage.getItem(
              `user:student@example.com:lesson_completed:${id}`,
            ) != null,
          lessonId,
        ),
      )
      .toBe(true)

    await page.getByTestId("lesson-complete-toggle-0").click()
    await expect(drawer).not.toContainText("مكتمل")
  })

  test("a PDF that never finishes loading shows the error panel", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      ;(
        window as Window & { __COURSE_PDF_TIMEOUT_MS__?: number }
      ).__COURSE_PDF_TIMEOUT_MS__ = 800
    })

    await page.route("**/*", async (route) => {
      const url = route.request().url().toLowerCase()
      if (url.includes(".pdf")) {
        // Never complete — forces the reader timeout fallback.
        await new Promise(() => {})
        return
      }
      await route.continue()
    })

    await openFirstLesson(page)
    await expect(page.getByTestId("pdf-reader-open-tab")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-error")).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByTestId("pdf-reader-retry-panel")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-error")).toContainText(
      "تعذر عرض الملف داخل الصفحة",
    )
  })

  test("audio load failure shows retry and open-in-new-tab", async ({
    page,
  }) => {
    await page.route("**/*", async (route) => {
      const url = route.request().url().toLowerCase()
      if (url.includes("/api/")) {
        await route.continue()
        return
      }
      if (
        url.includes(".mp3") ||
        url.includes(".m4a") ||
        url.includes(".ogg") ||
        url.includes(".wav") ||
        url.includes(".aac")
      ) {
        await route.abort()
        return
      }
      await route.continue()
    })

    await openFirstLesson(page)
    await expect(page.getByTestId("audio-player-error")).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByTestId("audio-player-retry")).toBeVisible()
    await expect(page.getByTestId("audio-player-open-tab")).toBeVisible()
    await expect(page.getByTestId("audio-player-error")).toContainText(
      "تعذر تشغيل الملف الصوتي",
    )
  })

  test("scrub previews time; audio seeks only on release", async ({ page }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    await page.evaluate(() => {
      const audio = document.querySelector("audio")
      if (audio) audio.currentTime = 8
    })
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThanOrEqual(7)

    const seek = page.getByTestId("audio-seek")
    const box = await seek.boundingBox()
    expect(box).toBeTruthy()
    if (!box) return

    const y = box.y + box.height / 2
    await page.mouse.move(box.x + 12, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.65, y, { steps: 8 })

    // Thumb preview moved far ahead, but media time should still be near the start.
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 999)
      .toBeLessThan(40)

    const previewText = await page.getByTestId("audio-current-time").innerText()
    expect(previewText).not.toMatch(/^0:0[0-8]$/)

    await page.mouse.up()
    await expect
      .poll(async () => (await audioState(page))?.currentTime ?? 0)
      .toBeGreaterThan(60)
  })

  test("shows buffering message while media is waiting", async ({ page }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

    await page.evaluate(() => {
      document.querySelector("audio")?.dispatchEvent(new Event("waiting"))
    })
    // Indicator is delayed to avoid flash on fast seeks.
    await expect(page.getByTestId("audio-player-buffering")).toBeVisible({
      timeout: 2000,
    })
    await expect(page.getByTestId("audio-player-buffering")).toContainText(
      "جاري تحميل الموضع",
    )

    await page.evaluate(() => {
      document.querySelector("audio")?.dispatchEvent(new Event("playing"))
    })
    await expect(page.getByTestId("audio-player-buffering")).toBeHidden({
      timeout: 2000,
    })
  })

  test("only remembers the continue path for deep links the API confirms", async ({
    page,
  }) => {
    const readSavedPath = () =>
      page.evaluate(() => {
        const raw = localStorage.getItem(
          "user:student@example.com:continue_learning_path",
        )
        return raw ? (JSON.parse(raw) as Record<string, string>) : null
      })

    const first = await openFirstLesson(page)
    await expect.poll(readSavedPath).toMatchObject({
      programId: first.programId,
      phaseId: first.phaseId,
      bookId: first.bookId,
      courseId: first.lessonId,
    })

    const unknownLessonId = "00000000-0000-4000-8000-000000000000"
    await page.goto(
      `/programs/${first.programId}/phases/${first.phaseId}/books/${first.bookId}/courses/${unknownLessonId}`,
    )
    // React Query retries the 404 three times before surfacing the error.
    await expect(page.getByText("تعذر تحميل المقرر.")).toBeVisible({
      timeout: 15_000,
    })
    expect((await readSavedPath())?.courseId).toBe(first.lessonId)

    const books = await page.request.get(
      `${API}/api/v1/phases/${first.phaseId}/books?limit=50`,
    )
    const otherBook = ((await books.json()).data as { id: string }[]).find(
      (book) => book.id !== first.bookId,
    )
    expect(otherBook).toBeTruthy()
    const phaseLoaded = page.waitForResponse((res) =>
      res.url().includes(`/api/v1/phases/${first.phaseId}`),
    )
    await page.goto(
      `/programs/${first.programId}/phases/${first.phaseId}/books/${otherBook!.id}/courses/${first.lessonId}`,
    )
    await phaseLoaded
    await expect(page.getByTestId("course-screen")).toBeVisible()
    expect(await readSavedPath()).toMatchObject({
      bookId: first.bookId,
      courseId: first.lessonId,
    })
  })

  test("lesson load error offers retry and a way back to the book", async ({
    page,
  }) => {
    const { url, programId, phaseId, bookId, lessonId } =
      await openFirstLesson(page)

    let failLesson = true
    await page.route(`**/api/v1/lessons/${lessonId}`, (route) =>
      failLesson ? route.fulfill({ status: 500 }) : route.fallback(),
    )
    await page.goto(url)
    // React Query retries three times before surfacing the error.
    const retry = page.getByTestId("course-load-retry")
    await expect(retry).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId("course-load-back")).toBeVisible()

    failLesson = false
    await retry.click()
    await expect(page.getByTestId("course-screen")).toBeVisible()

    const unknownLessonId = "00000000-0000-4000-8000-000000000000"
    await page.goto(
      `/programs/${programId}/phases/${phaseId}/books/${bookId}/courses/${unknownLessonId}`,
    )
    const back = page.getByTestId("course-load-back")
    await expect(back).toBeVisible({ timeout: 15_000 })
    await back.click()
    await expect(page).toHaveURL(
      new RegExp(`/programs/${programId}/phases/${phaseId}/books/${bookId}/?$`),
    )
  })

  test("back to book returns to the book lessons page", async ({ page }) => {
    const { programId, phaseId, bookId } = await openFirstLesson(page)
    await expect(page.getByTestId("course-screen")).toBeVisible()

    await page.getByTestId("back-to-book").click()
    await expect(page).toHaveURL(
      new RegExp(`/programs/${programId}/phases/${phaseId}/books/${bookId}/?$`),
    )
  })
})
