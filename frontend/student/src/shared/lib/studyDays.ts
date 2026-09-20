const DAY_LABELS_AR: Record<string, string> = {
  Sunday: "الأحد",
  Monday: "الإثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
}

/** Map API day names to a short Arabic subtitle for program cards. */
export function formatStudyDays(days: string[]): string {
  if (!days.length) return ""
  return days.map((day) => DAY_LABELS_AR[day] ?? day).join(" · ")
}
