// Mirrors the backend `EmailStr` (email-validator) rules that users actually hit,
// so the email step rejects what the signup API would reject later.

const RESERVED_TLDS = new Set([
  "arpa",
  "invalid",
  "local",
  "localhost",
  "onion",
  "test",
])

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type EmailIssue = "format" | "reserved"

export function emailIssue(value: string): EmailIssue | null {
  const email = value.trim().toLowerCase()
  if (!EMAIL_SHAPE.test(email)) return "format"

  const domain = email.slice(email.lastIndexOf("@") + 1)
  const labels = domain.split(".")
  if (labels.some((label) => !label.length)) return "format"

  const tld = labels[labels.length - 1]
  if (tld.length < 2 || /^\d+$/.test(tld)) return "format"
  if (RESERVED_TLDS.has(tld)) return "reserved"

  return null
}

export const EMAIL_FORMAT_MESSAGE = "الرجاء إدخال بريد إلكتروني صحيح"
export const EMAIL_RESERVED_MESSAGE =
  "هذا البريد غير مقبول، الرجاء استخدام بريدك الإلكتروني الحقيقي"

export function emailIssueMessage(issue: EmailIssue): string {
  return issue === "reserved" ? EMAIL_RESERVED_MESSAGE : EMAIL_FORMAT_MESSAGE
}
