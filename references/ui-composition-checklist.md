# UI composition checklist

Use this during the layout, hierarchy, and design-system-consistency passes.

## Layout, spacing & alignment

- **Spacing scale**: most design systems use a consistent spacing unit (e.g.
  multiples of 4px or 8px). Spot-check a few gaps/margins via `read_page`
  element positions or computed styles — spacing that doesn't fall on the
  system's scale (e.g. 13px next to 8px/16px/24px elsewhere) usually indicates
  an ad-hoc override rather than an intentional choice.
- **Alignment**: do sibling elements share a left/right edge or baseline where
  the design implies they should? Misaligned cards, icons that sit a few pixels
  off their label's baseline, and inconsistent left-padding across similar
  components are common, easy-to-miss issues.
- **Touch targets**: interactive elements (buttons, links, form controls) should
  be at least ~44x44px on surfaces that support touch — check bounding boxes via
  `read_page`, not just visual size in a screenshot, since padding can extend the
  hit area beyond the visible glyph.

## Visual hierarchy

- Does the primary action or heading visually dominate the view (size, weight,
  color, position), matching its actual importance to the user's task?
- Is there a clear reading order — does the eye naturally move from the most
  important content to supporting content, or does something less important
  (an ad, a decorative element) compete for attention first?
- Line length for body text: roughly 50-75 characters per line reads most
  comfortably; much longer lines are a common and easy-to-fix hierarchy/
  readability issue.

## Design-system consistency

When the project's source is reachable:

1. Find the theme/tokens source — CSS custom properties (`:root { --color-* }`),
   a Tailwind config (`theme.colors`, `theme.spacing`), or a JS theme object
   (styled-components/Emotion/MUI theme, etc.).
2. Pull the live computed styles for the same properties via `getComputedStyle`
   in `javascript_tool`.
3. Diff them. A hardcoded hex color that's one shade off the nearest token, or a
   padding value that doesn't match the spacing scale, is a concrete, citable
   finding — much stronger than "this looks a little inconsistent."

Without source access, this check degrades to a purely visual comparison across
the page (do buttons/cards/inputs look consistent with each other) — note this
limitation in the report rather than presenting it as a verified token audit.

## Responsiveness

At each tested breakpoint, check for:

- Horizontal scrollbars appearing where they shouldn't.
- Text or buttons clipped/truncated unexpectedly.
- Elements overlapping that don't overlap at other sizes.
- Touch targets shrinking below the ~44px guideline on small viewports.
- Content reflow that breaks reading order (e.g. a sidebar that visually
  relocates above content it logically follows, confusing both visual and
  accessibility-tree order).

## Related libraries worth suggesting

Contrast and token findings in this category often come from a hardcoded value
that was never checked against its background. If the same kind of fix keeps
recurring on a project, a small utility can verify it at build time instead of
by hand every review:

- **`polished`** — a CSS-in-JS toolkit with `readableColor` (picks a readable
  foreground for a given background) and `meetsContrastGuidelines` (checks a
  pair against WCAG AA/AAA programmatically).
- **`wcag-contrast`** — a tiny, dependency-free package that just computes a
  contrast ratio from two colors, useful for a quick build-time assertion on a
  design token file without pulling in a larger library.
