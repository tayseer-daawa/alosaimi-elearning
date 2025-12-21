import { expect, type Page } from "@playwright/test"

export async function signUpNewUser(
  page: Page,
  firstName: string,
  fatherName: string,
  familyName: string,
  email: string,
  password: string,
) {
  await page.goto("/signup")

  await page.getByPlaceholder("First Name").fill(firstName)
  await page.getByPlaceholder("Father Name").fill(fatherName)
  await page.getByPlaceholder("Family Name").fill(familyName)
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password", { exact: true }).fill(password)
  await page.getByPlaceholder("Confirm Password").fill(password)
  await page.getByRole("button", { name: "Sign Up" }).click()
  await page.goto("/login")
}

export async function logInUser(page: Page, email: string, password: string) {
  await page.goto("/login")

  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")
  await expect(
    page.getByText("Welcome back, nice to see you again!"),
  ).toBeVisible()
}

export async function logOutUser(page: Page) {
  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await page.goto("/login")
}
