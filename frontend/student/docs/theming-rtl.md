# Theming and right-to-left

[← Back to student app docs](./README.md)

Chakra UI v3. The design system lives in `src/theme.ts` (tokens, global CSS) and
`src/theme/` (component recipes). `ThemeProvider` in `src/providers/theme.tsx` wires it up.

---

## Colour tokens

Use tokens, never raw hex.

| Token | Value | Used for |
| --- | --- | --- |
| `brand.primary` | `#21605D` | Headings, primary buttons, active surfaces |
| `brand.secondary` | `#2D836E` | Secondary text, icon circles |
| `brand.accent` | `#E4DB99` | Sand buttons, highlights |
| `brand.info` | `#0B8CE9` | Informational actions |
| `brand.lightTeal` | `#C9EBE9` | Soft fills |
| `brand.lightGray` | `#BCBCBC` | Text on dark surfaces |
| `brand.gray` | `#333333` | Neutral text |
| `text.default` | `#1A4D4A` | Body text — this is the global default |

```tsx
<Heading color="brand.primary" />   // yes
<Heading color="#21605D" />         // no
```

Adding a colour means adding a token in `src/theme.ts`, not a hex literal in a component.

---

## Typography

**Cairo** for everything, headings and body, loaded with a system fallback stack. Chosen
because it carries both Arabic and Latin at the same weights. `html` is pinned to `16px`.

Do not introduce a second typeface without agreeing it first — a mixed-script UI degrades
badly when the two faces have different vertical metrics.

---

## Background

Set globally on `body` in `src/theme.ts`, swapping at `48em`:

- `public/assets/bg-mobile.svg` below the breakpoint
- `public/assets/bg-desktop.svg` above it

Screens do not set their own page background. If a section needs a surface, use
`bg="white"` on a container.

---

## Buttons

Buttons come from a recipe, `src/theme/button.recipe.ts`. Extend the recipe rather than
styling buttons inline.

| Variants | `primary` (default) · `secondary` · `info` |
| --- | --- |
| **Sizes** | `sm` (h 9) · `md` (h 4rem, default) · `lg` (h 6rem) |

```tsx
<Button>متابعة</Button>                       // primary / md
<Button variant="secondary" size="sm">…</Button>
```

`AuthCtaBtn` in `@/shared/components` wraps this with the responsive width the auth screens
share — use it there instead of repeating the props.

---

## Responsive

Mobile first, object syntax, `base` → `md` → `lg`:

```tsx
<Heading size={{ base: "xl", lg: "5xl" }} />
<Box px={{ base: 6, lg: 16 }} />
```

The pattern across the learning screens: a centred desktop page heading hidden on mobile
(`display={{ base: "none", lg: "block" }}`), with breadcrumbs shown on mobile instead.

Some auth spacing uses `calc()` values derived from Figma to survive short mobile
viewports — see `AuthLayout`. They are deliberate; do not round them off.

---

## Right-to-left

The product is Arabic. **Every page container sets `dir="rtl"`.**

```tsx
<Box minH="100vh" dir="rtl" px={6} py={4}>
```

### Icon direction

Directional icons must be chosen for RTL, not copied from an LTR layout:

| Meaning | Icon | Points |
| --- | --- | --- |
| Next / forward | `MoveLeft` | left |
| Previous / back | `MoveRight` | right |

Getting this backwards is the most common RTL bug in this codebase.

### Alignment

Prefer `textAlign="right"` or `"start"` for Arabic text, and Chakra's logical props where
available. Long Arabic paragraphs read better with `textAlign="justify"`.

---

## Icons and assets

- **`lucide-react`** in newer code. `react-icons` also present, used in older code — prefer
  Lucide for anything new.
- SVGs live in `public/assets/` and are imported by absolute path:

  ```tsx
  import MenuIcon from "/assets/menu.svg"
  ```

Available: `menu`, `headphones`, `book`, `audio-icon`, `mecque`, `icomoon-free_books`,
plus the two backgrounds.

---

## Dark mode

`next-themes` is installed and Chakra's `defaultConfig` supports colour modes, but **the
app defines no dark palette** — every token has a single value and `body` is hardcoded to
a white background. The app is light-only today. Adding dark mode means adding semantic
tokens with `_dark` values, not sprinkling conditionals.
