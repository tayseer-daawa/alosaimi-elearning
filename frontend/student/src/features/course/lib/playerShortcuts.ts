export const PLAYER_SHORTCUTS = [
  { keys: "مسافة / K", action: "تشغيل أو إيقاف" },
  // Mirrored for RTL: → = ترجيع, ← = تقديم (matches player chevron direction)
  { keys: "→ / ←", action: "ترجيع أو تقديم ٥ ثوانٍ" },
  { keys: "J / L", action: "ترجيع أو تقديم ١٠ ثوانٍ" },
  { keys: "M", action: "كتم الصوت أو إلغاؤه" },
  { keys: "↓ / ↑", action: "رفع أو خفض الصوت" },
  { keys: "< / >", action: "إبطاء أو تسريع التشغيل" },
  { keys: "Shift + N", action: "المقرر التالي" },
  { keys: "Shift + P", action: "المقرر السابق" },
  { keys: "؟", action: "عرض اختصارات لوحة المفاتيح" },
] as const

export const PLAYER_ARIA_KEYSHORTCUTS =
  "Space, ArrowLeft, ArrowRight, KeyJ, KeyL, KeyK, KeyM, Shift+Comma, Shift+Period, Shift+KeyN, Shift+KeyP, Shift+Slash"
