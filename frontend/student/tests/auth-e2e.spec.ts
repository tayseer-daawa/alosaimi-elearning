import { expect, test } from "@playwright/test"

/**
 * Full UI auth journeys against the live API + MailCatcher.
 * Requires backend :8000 and MailCatcher :1080 (docker compose stack).
 */

const API = process.env.VITE_API_URL || "http://localhost:8000"
const MAIL = process.env.MAILCATCHER_HOST || "http://localhost:1080"
const stamp = Date.now()

async function completeSignupWizard(
  page: import("@playwright/test").Page,
  opts: {
    email: string
    password: string
    first?: string
    father?: string
    family?: string
  },
) {
  const first = opts.first ?? "أحمد"
  const father = opts.father ?? "محمد"
  const family = opts.family ?? "العصيمي"

  await page.goto("/signup")
  await page.getByLabel("الاسم الشخصي").fill(first)
  await page.getByLabel("اسم الأب").fill(father)
  await page.getByLabel("الاسم العائلي").fill(family)
  await page.getByRole("button", { name: "مواصلة" }).click()

  await page.getByLabel("البريد الإلكتروني").fill(opts.email)
  await page.getByRole("button", { name: "مواصلة" }).click()

  await page.getByRole("button", { name: "ذكر" }).click()
  await page.getByRole("button", { name: "مواصلة" }).click()

  const passwordInputs = page.locator('input[type="password"]')
  await expect(passwordInputs).toHaveCount(2)
  await passwordInputs.nth(0).fill(opts.password)
  await passwordInputs.nth(1).fill(opts.password)
  await page.getByRole("button", { name: "إنشاء الحساب" }).click()
}

test.describe("auth E2E UI", () => {
  test.describe.configure({ timeout: 60_000 })

  test("signup signs in → home → logout → login → home", async ({ page }) => {
    const email = `ui.signup.${stamp}@example.com`
    const password = "Password1!"

    await completeSignupWizard(page, { email, password })
    await page.waitForURL("/", { timeout: 15000 })
    await expect(page).toHaveURL("/")
    expect(
      await page.evaluate(() => localStorage.getItem("access_token")),
    ).toBeTruthy()

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10000 })

    await page.goto("/login")
    await expect(page.getByText("أدخل معلومات الحساب")).toBeVisible()
    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.getByLabel("كلمة السر").fill(password)
    await page.getByRole("button", { name: "مواصلة" }).click()
    await page.waitForURL("/", { timeout: 15000 })
    await expect(page).toHaveURL("/")

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10000 })
    await expect(page).toHaveURL("/welcome")
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    )
    const profile = await page.evaluate(() =>
      localStorage.getItem("student_profile"),
    )
    expect(token).toBeNull()
    expect(profile).toBeNull()
  })

  test("signup duplicate email returns to the email step with API error", async ({
    page,
    request,
  }) => {
    const email = `ui.dup.${stamp}@example.com`
    const password = "Password1!"

    const seeded = await request.post(`${API}/api/v1/users/signup`, {
      data: {
        email,
        password,
        first_name: "أحمد",
        father_name: "محمد",
        family_name: "العصيمي",
        is_male: true,
      },
    })
    expect(seeded.ok()).toBeTruthy()

    await completeSignupWizard(page, { email, password })
    await expect(
      page.getByText("يوجد حساب مسجل بهذا البريد الإلكتروني"),
    ).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByLabel("البريد الإلكتروني")).toHaveValue(email)
    await expect(page.getByTestId("signup-step-indicator")).toHaveText(
      "الخطوة 2 من 4",
    )
  })

  test("signup UI rejects passwords shorter than 8 chars", async ({ page }) => {
    const email = `ui.shortpw.${stamp}@example.com`
    await completeSignupWizard(page, { email, password: "short1" })
    await expect(page).not.toHaveURL("/login", { timeout: 5000 })
    await expect(
      page.getByText("كلمة السر يجب أن تكون 8 أحرف على الأقل"),
    ).toBeVisible({ timeout: 5000 })
  })

  test("login wrong password shows Arabic error", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("البريد الإلكتروني").fill("admin@example.com")
    await page.getByLabel("كلمة السر").fill("definitely-wrong")
    await page.getByRole("button", { name: "مواصلة" }).click()
    await expect(
      page.getByText("البريد الإلكتروني أو كلمة السر غير صحيحة"),
    ).toBeVisible({ timeout: 10000 })
    // Failed login must not leave a half-session token
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    )
    expect(token).toBeNull()
  })

  test("login clears token if /users/me fails after access-token", async ({
    page,
  }) => {
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Could not validate credentials" }),
      })
    })

    await page.goto("/login")
    await page.getByLabel("البريد الإلكتروني").fill("student@example.com")
    await page.getByLabel("كلمة السر").fill("Student123!")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(
      page.getByText("تعذر تحميل بيانات الحساب، يرجى المحاولة مرة أخرى"),
    ).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/login/)
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    )
    expect(token).toBeNull()
  })

  test("forget-password success path + MailCatcher email", async ({
    page,
    request,
  }) => {
    const email = `ui.recover.${stamp}@example.com`
    const password = "Password1!"

    // seed user via API
    const signup = await request.post(`${API}/api/v1/users/signup`, {
      data: {
        email,
        password,
        first_name: "خالد",
        father_name: "سعيد",
        family_name: "الحربي",
        is_male: true,
      },
    })
    expect(signup.ok()).toBeTruthy()

    await page.goto("/forget-password")
    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.getByRole("button", { name: "إرسال" }).click()
    await expect(
      page.getByText(
        "تم إرسال البريد الإلكتروني بنجاح. يرجى التحقق من بريدك الإلكتروني.",
      ),
    ).toBeVisible({
      timeout: 10000,
    })

    // poll MailCatcher
    let link: string | null = null
    for (let i = 0; i < 10; i++) {
      const msgs = await request.get(`${MAIL}/messages`)
      const list = (await msgs.json()) as Array<{
        id: number
        recipients: string[]
      }>
      const hit = [...list]
        .reverse()
        .find((m) => (m.recipients || []).some((r) => r.includes(email)))
      if (hit) {
        const htmlRes = await request.get(`${MAIL}/messages/${hit.id}.html`)
        const html = await htmlRes.text()
        const m = html.match(/href="([^"]*reset-password[^"]*)"/)
        if (m) link = m[1]
        break
      }
      await page.waitForTimeout(500)
    }
    expect(link).toBeTruthy()

    // Document host: student vs admin (default recovery targets student)
    const targetsStudent = link!.includes(":5174")
    const targetsAdmin = link!.includes(":5173")
    test.info().annotations.push({
      type: "reset-link-host",
      description: `student=${targetsStudent} admin=${targetsAdmin} link=${link}`,
    })
    expect(targetsStudent).toBeTruthy()
    expect(targetsAdmin).toBeFalsy()

    const studentLink = link!.replace(/&amp;/g, "&")

    // Prefer path-only goto so Playwright baseURL (student :5174) is used
    const resetPath = studentLink.replace(/^https?:\/\/[^/]+/, "")
    await page.goto(resetPath)
    await expect(page.getByText("تحديث كلمة السر")).toBeVisible({
      timeout: 15000,
    })
    const passwordInputs = page.locator('input[type="password"]')
    await expect(passwordInputs).toHaveCount(2, { timeout: 10000 })
    await passwordInputs.nth(0).fill("NewPassword9!")
    await passwordInputs.nth(1).fill("NewPassword9!")
    await page.getByRole("button", { name: "مواصلة" }).click()
    await page.waitForURL("/login", { timeout: 15000 })

    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.locator('input[type="password"]').fill("NewPassword9!")
    await page.getByRole("button", { name: "مواصلة" }).click()
    await page.waitForURL("/", { timeout: 15000 })
  })

  test("reset-password without token shows invalid-link error", async ({
    page,
  }) => {
    await page.goto("/reset-password")
    await expect(page.getByText("تحديث كلمة السر")).toBeVisible({
      timeout: 15000,
    })
    const passwordInputs = page.locator('input[type="password"]')
    await expect(passwordInputs).toHaveCount(2, { timeout: 10000 })
    await passwordInputs.nth(0).fill("Password1!")
    await passwordInputs.nth(1).fill("Password1!")
    await page.getByRole("button", { name: "مواصلة" }).click()
    await expect(
      page.getByText("رابط إعادة تعيين كلمة المرور غير صالح أو مفقود."),
    ).toBeVisible({ timeout: 10000 })
  })

  test("authenticated user is bounced from /login and /welcome to /", async ({
    page,
    request,
  }) => {
    const email = `ui.bounce.${stamp}@example.com`
    const password = "Password1!"
    await request.post(`${API}/api/v1/users/signup`, {
      data: {
        email,
        password,
        first_name: "نورة",
        father_name: "فهد",
        family_name: "القحطاني",
        is_male: false,
      },
    })
    const login = await request.post(`${API}/api/v1/login/access-token`, {
      form: { username: email, password },
    })
    const { access_token } = (await login.json()) as { access_token: string }

    await page.goto("/welcome")
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token)
    }, access_token)
    await page.goto("/login")
    await page.waitForURL("/")
    await page.goto("/welcome")
    await page.waitForURL("/")
  })
})
