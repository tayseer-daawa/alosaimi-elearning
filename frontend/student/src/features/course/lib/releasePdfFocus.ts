/** Blur a focused PDF iframe so page-level audio shortcuts work again. */
export function releasePdfFocus(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLIFrameElement)) return false
  active.blur()
  return true
}
