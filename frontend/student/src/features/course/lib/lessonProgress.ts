/** Client-side lesson / player prefs (localStorage). Survives reload on this browser/device. */

const PLAYBACK_PREFIX = "lesson_playback:"
const COMPLETED_PREFIX = "lesson_completed:"
/** Global across lessons — device preference, not per-lesson. */
const VOLUME_PREFS_KEY = "audio_player_volume"
/** Last opened course path for home «متابعة التعلم». */
const LAST_LEARNING_PATH_KEY = "continue_learning_path"

/** Mark complete when the listener reaches this fraction of duration. */
export const COMPLETE_RATIO = 0.9

export type LessonPlaybackState = {
  position: number
  rate: number
  updatedAt: number
}

export type VolumePrefs = {
  volume: number
  muted: boolean
}

/** Route params for the last lesson the student opened on this device. */
export type LastLearningPath = {
  programId: string
  phaseId: string
  bookId: string
  courseId: string
  updatedAt: number
}

function playbackKey(lessonId: string) {
  return `${PLAYBACK_PREFIX}${lessonId}`
}

function completedKey(lessonId: string) {
  return `${COMPLETED_PREFIX}${lessonId}`
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function loadPlayback(lessonId: string): LessonPlaybackState | null {
  try {
    const raw = localStorage.getItem(playbackKey(lessonId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as LessonPlaybackState
    if (
      typeof parsed.position !== "number" ||
      typeof parsed.rate !== "number" ||
      !Number.isFinite(parsed.position)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function savePlayback(
  lessonId: string,
  position: number,
  rate: number,
): void {
  if (!Number.isFinite(position) || position < 0) return
  const payload: LessonPlaybackState = {
    position,
    rate,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(playbackKey(lessonId), JSON.stringify(payload))
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * Persist playback without clobbering a real resume point with a transient 0
 * (React Strict Mode remount / reload before metadata).
 */
export function savePlaybackSafe(
  lessonId: string,
  position: number,
  rate: number,
): void {
  if (!Number.isFinite(position) || position < 0) return
  if (position < 5) {
    const existing = loadPlayback(lessonId)
    if (existing && existing.position >= 5) {
      savePlayback(lessonId, existing.position, rate)
      return
    }
  }
  savePlayback(lessonId, position, rate)
}

export function isLessonCompleted(lessonId: string): boolean {
  try {
    return localStorage.getItem(completedKey(lessonId)) != null
  } catch {
    return false
  }
}

export function markLessonCompleted(lessonId: string): void {
  try {
    localStorage.setItem(
      completedKey(lessonId),
      JSON.stringify({ completedAt: Date.now() }),
    )
  } catch {
    // ignore
  }
}

export function clearLessonCompleted(lessonId: string): void {
  try {
    localStorage.removeItem(completedKey(lessonId))
  } catch {
    // ignore
  }
}

export function toggleLessonCompleted(lessonId: string): boolean {
  if (isLessonCompleted(lessonId)) {
    clearLessonCompleted(lessonId)
    return false
  }
  markLessonCompleted(lessonId)
  return true
}

/** Resume unless still at the start or essentially finished. */
export function resumePosition(saved: number, duration: number): number | null {
  if (!Number.isFinite(duration) || duration < 5) return null
  if (saved < 2) return null
  // Last 5 seconds — start fresh next time (lesson treated as finished).
  if (saved >= duration - 5) return null
  return Math.min(saved, duration - 0.25)
}

export function loadVolumePrefs(): VolumePrefs | null {
  try {
    const raw = localStorage.getItem(VOLUME_PREFS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VolumePrefs
    if (
      typeof parsed.volume !== "number" ||
      !Number.isFinite(parsed.volume) ||
      typeof parsed.muted !== "boolean"
    ) {
      return null
    }
    return {
      volume: Math.min(1, Math.max(0, parsed.volume)),
      muted: parsed.muted,
    }
  } catch {
    return null
  }
}

export function saveVolumePrefs(volume: number, muted: boolean): void {
  if (!Number.isFinite(volume)) return
  const payload: VolumePrefs = {
    volume: Math.min(1, Math.max(0, volume)),
    muted,
  }
  try {
    localStorage.setItem(VOLUME_PREFS_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function loadLastLearningPath(): LastLearningPath | null {
  try {
    const raw = localStorage.getItem(LAST_LEARNING_PATH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastLearningPath
    if (
      !isNonEmptyString(parsed.programId) ||
      !isNonEmptyString(parsed.phaseId) ||
      !isNonEmptyString(parsed.bookId) ||
      !isNonEmptyString(parsed.courseId)
    ) {
      return null
    }
    return {
      programId: parsed.programId,
      phaseId: parsed.phaseId,
      bookId: parsed.bookId,
      courseId: parsed.courseId,
      updatedAt:
        typeof parsed.updatedAt === "number" &&
        Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : 0,
    }
  } catch {
    return null
  }
}

export function saveLastLearningPath(path: {
  programId: string
  phaseId: string
  bookId: string
  courseId: string
}): void {
  if (
    !isNonEmptyString(path.programId) ||
    !isNonEmptyString(path.phaseId) ||
    !isNonEmptyString(path.bookId) ||
    !isNonEmptyString(path.courseId)
  ) {
    return
  }
  const payload: LastLearningPath = {
    programId: path.programId,
    phaseId: path.phaseId,
    bookId: path.bookId,
    courseId: path.courseId,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(LAST_LEARNING_PATH_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
