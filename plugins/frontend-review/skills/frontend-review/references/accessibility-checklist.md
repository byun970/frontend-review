# Accessibility checklist (WCAG 2.2 AA quick reference)

Use this during the accessibility pass. Each item lists what to check and how to
check it with the browser-automation tools, so findings stay evidence-based.

## Contrast

| Text type | Minimum ratio |
|---|---|
| Normal text | 4.5:1 |
| Large text (≥18pt, or ≥14pt bold) | 3:1 |
| UI components / borders that convey information | 3:1 |

Pull `color` and `background-color` via `getComputedStyle` in `javascript_tool`
for the key text elements (headings, body copy, buttons, links, form labels),
compute the contrast ratio, and compare against the table above. Don't eyeball
contrast from a screenshot — colors render differently depending on screen/theme,
and a computed-style check is the real measurement.

## Focus visibility and order

- Every interactive element must show a visible focus indicator when tabbed to —
  not just a mouse `:hover` style, and not `outline: none` with nothing in its
  place.
- Tab order should follow the visual/logical order of the page. Simulate this
  with `computer` keypresses (Tab repeatedly), screenshotting after each press.
- No keyboard trap: the user must be able to Tab (and Shift+Tab) out of any
  component, including modals and custom dropdowns.

## Semantic HTML / ARIA

Read via `read_page`'s accessibility tree:

- **Heading order**: no skipped levels (e.g. an `h2` straight to an `h4` with no
  `h3`), and ideally one `h1` per page/view.
- **Landmarks**: presence of `main`, `nav`, `header`/`footer` (or their ARIA
  role equivalents) so screen-reader users can jump between regions.
- **Images**: meaningful images have descriptive `alt` text; purely decorative
  images have `alt=""` (not a missing attribute).
- **Form labels**: every input has an associated, visible label (via `<label
  for>`, wrapping, or `aria-label`/`aria-labelledby`) — not just a placeholder,
  which disappears on input and isn't reliably read by all assistive tech.
- **Accessible names**: buttons and links need a name that makes sense out of
  context — "Click here" or an icon-only button with no `aria-label` fails this.

## Keyboard navigation

- All interactive functionality must be operable via keyboard alone — if
  something only responds to a mouse click/hover/drag, it's inaccessible to
  keyboard and switch-device users.
- Custom widgets (dropdowns, tabs, modals, carousels) should follow expected
  keyboard conventions (Enter/Space to activate, Escape to close, arrow keys
  within composite widgets where applicable).

## Reduced motion

If the page has animations or auto-playing content, check whether it respects
`prefers-reduced-motion`. This is reachable via `javascript_tool`:
`matchMedia('(prefers-reduced-motion: reduce)').matches` tells you whether the
OS-level setting is on, but confirming the *page* respects it typically means
reading the CSS/JS source for a corresponding media query or check — flag it as
unconfirmed if source isn't reachable rather than guessing.

## When to call this "not fully assessed"

A manual pass through this checklist is real signal, but it isn't exhaustive —
things like full screen-reader compatibility or complex ARIA widget patterns
benefit from a dedicated tool. If `scripts/check-audit-tools.js` finds axe-core
or Lighthouse installed, run it and merge its findings for broader coverage;
otherwise say plainly in the report that accessibility coverage is manual/
heuristic only.

## Related libraries worth suggesting

When a finding here is the kind of thing that keeps coming back across a
project, it's worth naming a tool that catches it automatically instead of
relying on another manual review next time:

- **`eslint-plugin-jsx-a11y`** — lint-time checks for missing alt text, invalid
  ARIA, unlabeled form controls, and more, for React/JSX codebases. Catches a
  good chunk of this checklist before the code even runs.
- **`@axe-core/react`** — logs accessibility violations to the console during
  development as the app runs, without a separate audit step.
- **`axe-core`** / **`lighthouse`** — broader automated scans; this skill
  already checks for these via `scripts/check-audit-tools.js` and runs them
  when present, so don't suggest installing them if that check already found
  them — just note they'd give broader coverage if genuinely absent.
