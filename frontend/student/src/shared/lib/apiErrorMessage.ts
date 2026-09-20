/** Map backend API error details to Arabic copy for auth screens. */

const EXACT: Record<string, string> = {
  "The user with this email already exists in the system":
    "يوجد حساب مسجل بهذا البريد الإلكتروني",
  "Invalid token": "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
  "Inactive user": "هذا الحساب غير مفعّل. تواصل مع الإدارة",
  "Incorrect email or password": "البريد الإلكتروني أو كلمة السر غير صحيحة",
  "Incorrect password": "كلمة السر الحالية غير صحيحة",
  "Not authenticated": "يجب تسجيل الدخول للمتابعة",
  "Could not validate credentials":
    "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً",
}

const CONTAINS: Array<{ match: RegExp; message: string }> = [
  {
    match: /at least 8 characters/i,
    message: "كلمة السر يجب أن تكون 8 أحرف على الأقل",
  },
  {
    match: /not a valid email/i,
    message: "الرجاء إدخال بريد إلكتروني صحيح",
  },
  {
    match: /already exists/i,
    message: "يوجد حساب مسجل بهذا البريد الإلكتروني",
  },
]

function mapDetailString(detail: string): string {
  if (EXACT[detail]) return EXACT[detail]
  for (const { match, message } of CONTAINS) {
    if (match.test(detail)) return message
  }
  return detail
}

/**
 * Extract a user-facing Arabic message from an API error body.
 * Falls back to `fallback` when the body has no usable detail.
 */
export function apiErrorMessage(
  body: unknown,
  fallback = "حدث خطأ أثناء الاتصال بالخادم",
): string {
  const detail = (body as { detail?: unknown } | null | undefined)?.detail

  if (typeof detail === "string") {
    return mapDetailString(detail)
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string }
    if (typeof first?.msg === "string" && first.msg.length > 0) {
      return mapDetailString(first.msg)
    }
  }

  return fallback
}
