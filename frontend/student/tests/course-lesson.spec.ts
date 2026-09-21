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

  test("shows PDF reader, notes tab, and audio player controls", async ({
    page,
  }) => {
    await openFirstLesson(page)

    // Desktop Chrome: PDF + notes side-by-side (no tabs).
    await expect(page.getByTestId("tab-book")).toBeHidden()
    await expect(page.getByTestId("tab-notes")).toBeHidden()
    await expect(page.getByTestId("tab-panel-book")).toBeVisible()
    await expect(page.getByTestId("tab-panel-notes")).toBeVisible()
    await expect(page.getByTestId("pdf-reader")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-frame")).toBeVisible()
    await expect(page.getByTestId("lesson-notes")).toBeVisible()
    await expect(page.getByTestId("lesson-notes-input")).toBeVisible()

    const note = `ملاحظة اختبار ${Date.now()}`
    await page.getByTestId("lesson-notes-input").fill(note)
    await expect(page.getByTestId("lesson-notes-saved")).toHaveText(
      "تم الحفظ محلياً",
    )
    await expect(page.getByTestId("lesson-notes-input")).toHaveValue(note)

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

  test("collapses and expands the notes pane on desktop", async ({ page }) => {
    await openFirstLesson(page)

    await expect(page.getByTestId("tab-panel-notes")).toBeVisible()
    await expect(page.getByTestId("notes-pane-collapse")).toBeVisible()

    await page.getByTestId("notes-pane-collapse").click()
    await expect(page.getByTestId("tab-panel-notes")).toBeHidden()
    await expect(page.getByTestId("notes-pane-expand")).toBeVisible()
    await expect(page.getByTestId("course-split")).toHaveAttribute(
      "data-notes-open",
      "false",
    )

    // Collapsed preference persists across reload.
    await page.reload()
    await expect(page.getByTestId("course-screen")).toBeVisible()
    await expect(page.getByTestId("tab-panel-notes")).toBeHidden()
    await expect(page.getByTestId("notes-pane-expand")).toBeVisible()

    await page.getByTestId("notes-pane-expand").click()
    await expect(page.getByTestId("tab-panel-notes")).toBeVisible()
    await expect(page.getByTestId("lesson-notes-input")).toBeVisible()
    await expect(page.getByTestId("course-split")).toHaveAttribute(
      "data-notes-open",
      "true",
    )
  })

  test("uses tabs for PDF and notes on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openFirstLesson(page)

    await expect(page.getByTestId("tab-book")).toBeVisible()
    await expect(page.getByTestId("tab-notes")).toBeVisible()
    await expect(page.getByTestId("tab-panel-book")).toBeVisible()
    await expect(page.getByTestId("lesson-notes-input")).toBeHidden()

    await page.getByTestId("tab-notes").click()
    await expect(page.getByTestId("lesson-notes-input")).toBeVisible()
    await expect(page.getByTestId("pdf-reader")).toBeHidden()
  })

  test("shows PDF timeout panel with retry and open-in-tab", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      ;(
        window as Window & { __COURSE_PDF_TIMEOUT_MS__?: number }
      ).__COURSE_PDF_TIMEOUT_MS__ = 1
    })
    await openFirstLesson(page)

    await expect(page.getByTestId("pdf-reader-timeout")).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByTestId("pdf-reader-retry-panel")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-open-tab-panel")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-open-tab")).toBeVisible()
  })

  test("keeps long teacher explanation collapsed so my notes stay visible", async ({
    page,
  }) => {
    await openFirstLesson(page)

    const toggle = page.getByTestId("lesson-explanation-toggle")
    if ((await toggle.count()) === 0) {
      test.skip()
      return
    }

    const expanded = await toggle.getAttribute("aria-expanded")
    if (expanded === "true") {
      // Short explanation opens by default on desktop.
      await expect(page.getByTestId("lesson-explanation")).toBeVisible()
      return
    }

    await expect(page.getByTestId("lesson-notes-input")).toBeVisible()
    await expect(page.getByTestId("lesson-explanation")).toBeHidden()
    await toggle.click()
    await expect(page.getByTestId("lesson-explanation")).toBeVisible()
  })

  test("UI controls: play, mute, rate, and seek", async ({ page }) => {
    await openFirstLesson(page)
    await waitForAudioReady(page)

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
    await expect(panel).toContainText("الدرس التالي")
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
          `lesson_playback:${id}`,
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

  test("lesson drawer shows resume and completion toggles", async ({
    page,
  }) => {
    const { lessonId } = await openFirstLesson(page)
    await waitForAudioReady(page)

    await page.evaluate((id) => {
      localStorage.setItem(
        `lesson_playback:${id}`,
        JSON.stringify({ position: 90, rate: 1, updatedAt: Date.now() }),
      )
      localStorage.removeItem(`lesson_completed:${id}`)
    }, lessonId)

    await page.getByTestId("lesson-list-open").click()
    const drawer = page.getByTestId("lesson-list-drawer")
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText("دروس الكتاب")
    await expect(drawer.getByTestId("lesson-list-item-0")).toBeVisible()
    await expect(drawer).toContainText("استئناف من")

    await page.getByTestId("lesson-complete-toggle-0").click()
    await expect(drawer).toContainText("مكتمل")
    await expect
      .poll(async () =>
        page.evaluate(
          (id) => localStorage.getItem(`lesson_completed:${id}`) != null,
          lessonId,
        ),
      )
      .toBe(true)

    await page.getByTestId("lesson-complete-toggle-0").click()
    await expect(drawer).not.toContainText("مكتمل")
  })

  test("PDF open-in-new-tab link is available and timeout offers retry", async ({
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
    await expect(page.getByTestId("pdf-reader-timeout")).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByTestId("pdf-reader-retry-panel")).toBeVisible()
    await expect(page.getByTestId("pdf-reader-timeout")).toContainText(
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

  test("back to book returns to the book lessons page", async ({ page }) => {
    const { programId, phaseId, bookId } = await openFirstLesson(page)
    await expect(page.getByTestId("course-screen")).toBeVisible()

    await page.getByTestId("back-to-book").click()
    await expect(page).toHaveURL(
      new RegExp(`/programs/${programId}/phases/${phaseId}/books/${bookId}/?$`),
    )
  })
})
