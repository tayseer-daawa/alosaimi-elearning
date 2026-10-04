/** PDF reader zoom model — no React, no pdf.js. */

import { readUserItem, writeUserItem } from "@/shared/lib/userStorage"

/**
 * fit-page: the whole page is visible. fit-width: the page fills the
 * reader's width. scale: 1 = the PDF's natural size (like the browser viewer's 100%).
 */
export type PdfZoom =
  | { mode: "fit-page" }
  | { mode: "fit-width" }
  | { mode: "scale"; scale: number }

export const MIN_SCALE = 0.25
export const MAX_SCALE = 4

/** Steps for the zoom buttons, as in browser PDF viewers. */
const ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3,
]

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/** Next step above (direction 1) or below (-1) the current effective scale. */
export function steppedScale(
  current: number,
  direction: 1 | -1,
): number | null {
  const next =
    direction === 1
      ? ZOOM_STEPS.find((step) => step > current + 0.01)
      : [...ZOOM_STEPS].reverse().find((step) => step < current - 0.01)
  return next ?? null
}

export type ReaderLayout = "phone" | "desktop"

/** Phones read best at full width; larger screens start on the whole page. */
export function defaultPdfZoom(layout: ReaderLayout): PdfZoom {
  return layout === "phone" ? { mode: "fit-width" } : { mode: "fit-page" }
}

/**
 * The student's last zoom, kept per layout so a desktop zoom never lands on
 * a phone screen (and the other way round).
 */
export function loadPdfZoom(layout: ReaderLayout): PdfZoom | null {
  try {
    const raw = readUserItem(`pdf_zoom:${layout}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PdfZoom
    if (parsed.mode === "fit-page" || parsed.mode === "fit-width") {
      return { mode: parsed.mode }
    }
    if (
      parsed.mode === "scale" &&
      typeof parsed.scale === "number" &&
      Number.isFinite(parsed.scale)
    ) {
      return { mode: "scale", scale: clampScale(parsed.scale) }
    }
    return null
  } catch {
    return null
  }
}

export function savePdfZoom(layout: ReaderLayout, zoom: PdfZoom): void {
  writeUserItem(`pdf_zoom:${layout}`, JSON.stringify(zoom))
}
