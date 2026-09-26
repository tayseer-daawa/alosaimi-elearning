/** Compact chrome controls — avoid the tall default button recipe. */
export const chromeIconProps = {
  variant: "ghost" as const,
  size: "sm" as const,
  h: { base: "11", md: "8" } as const,
  minW: { base: "11", md: "8" } as const,
  minH: { base: "11", md: "8" } as const,
  p: "0" as const,
  borderRadius: "full" as const,
  color: "brand.secondary" as const,
}

/** Larger touch target for the transport row (skip ±10) on mobile. */
export const transportIconProps = {
  ...chromeIconProps,
  h: { base: "12", md: "8" } as const,
  minH: { base: "12", md: "8" } as const,
  minW: { base: "12", md: "8" } as const,
}
