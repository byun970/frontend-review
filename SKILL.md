---
name: frontend-review
description: >
  Evaluate an already-built frontend screen, page, or component for UI composition
  (layout, spacing, visual hierarchy, design-system consistency, responsiveness,
  accessibility) and performance (load timing, rendering/jank, bundle and network
  weight). Use whenever the user wants a built UI judged, reviewed, audited, graded,
  or critiqued rather than created — including "review this page", "how does this
  look", "check the performance of this component", "is this accessible",
  "a11y 체크 좀 해줘", "이 화면 평가해줘", "이 페이지 어때", "레이아웃 좀 봐줘",
  "왜 이렇게 느리지", "does this match our design system". Trigger proactively right
  after the user builds, runs, or shows a frontend screen and then asks for
  feedback, a review, or an evaluation — even if they don't name "accessibility" or
  "performance" explicitly. This skill is for judging work that already exists. If
  the user instead wants a new visual direction, a fresh design, or a reshaped look
  for a UI that doesn't exist yet or is actively being designed, use frontend-design
  instead, not this skill.
---

# Frontend Review

This skill turns "how does this screen look / perform" into a structured audit
backed by real measurements — screenshots, computed styles, and the browser's
`performance` API — rather than a vibe check. The goal is a report the user can
act on: every claim ties to evidence, and anything that genuinely can't be
measured is labeled as such instead of guessed at.

## 1. Pick the automation path

Most targets are a local dev server the user just started, which the **built-in
browser cannot reach** (it runs in a different place than the shell Claude started
the server from). So:

- **localhost / local dev server → use Claude in Chrome** (`claude-in-chrome`
  skill). This is the default for almost every invocation of this skill.
- **Already-deployed, non-local URL → built-in browser is also fine**, if Claude
  in Chrome isn't available.

Don't re-derive either skill's mechanics here — follow their own instructions
(batch `ToolSearch` loading, tab-context-first, dialog-avoidance rules, stopping
after repeated failures instead of retrying blindly).

## 2. Get the target up

1. If the user gave a URL, use it directly.
2. Otherwise check whether something relevant is already running before touching
   anything — don't restart a server the user already has up.
3. Only if nothing is reachable, use the `run` skill to launch the project.

**Single static HTML file, no dev server:** Claude in Chrome's `navigate` refuses
`file://` URLs outright ("Can't interact with browser-internal or unparseable
URLs"), so you can't just point it at the file on disk. Serve the file's
directory over HTTP instead — e.g. `python -m http.server <port>` run in the
background from that directory — then navigate to
`http://127.0.0.1:<port>/<filename>` (URL-encode non-ASCII filenames). Stop the
server once the review is done.

## 3. Run the evaluation passes

Work through these in order. Each pass produces concrete evidence — note it down
as you go so the final report can cite it.

1. **Baseline screenshot** at the app's natural/default window size.
2. **Responsive pass** — `resize_window` through 375 / 768 / 1024 / 1440px (swap in
   the user's own breakpoints if they named any), screenshot each, and note
   overflow, clipped text, overlapping elements, or stray horizontal scrollbars.
3. **Console pass** — `read_console_messages` for errors, framework warnings
   (hydration mismatches, deprecated APIs), and CSP violations.
4. **Network pass** — `read_network_requests` for failed requests, unusually large
   assets, and total request count.
5. **Performance measurement pass** — run the snippet in
   `references/performance-heuristics.md` through `javascript_tool` to get real
   TTFB, FCP, LCP, CLS, transfer bytes by type, and resource count. This is the
   single highest-value step in this skill: it replaces guesswork with numbers.
6. **Accessibility pass**:
   - `read_page` for the accessibility tree — heading order, landmarks, image alt
     text, form label association, accessible names on buttons/links.
   - Tab-key traversal via `computer` — screenshot after each Tab press to verify
     a visible focus indicator, a logical order, and no keyboard trap.
   - `javascript_tool` + `getComputedStyle` to pull foreground/background colors
     for key text, then compute contrast ratio and compare against the WCAG
     thresholds in `references/accessibility-checklist.md`.
7. **Optional tool-assisted pass** — run `scripts/check-audit-tools.js` to detect
   whether axe-core or Lighthouse CLI are available in the project (global, local
   `node_modules/.bin`, or `package.json` devDependencies). If present, run them
   and fold the results in, clearly labeled as tool-sourced. If absent, say so in
   the report rather than silently skipping — don't imply a full automated audit
   happened when it didn't.
8. **Design-system consistency pass** (only if the project's source is reachable)
   — grep for a theme/tokens file (CSS variables, Tailwind config,
   styled-system/theme object) and diff its declared values against the computed
   styles gathered in step 6. Flag inline overrides or off-token colors/spacing.
   Without source access, this degrades to a visual-only heuristic — say so.

See `references/ui-composition-checklist.md` for what to look for in the layout,
hierarchy, and consistency passes specifically.

### What's genuinely out of scope

Some things people ask about here can't be measured with browser automation
alone — most notably **excessive re-renders**, which needs React DevTools
Profiler or added instrumentation, not just DOM/network observation. When you hit
one of these, put it under "Not measured / out of scope" in the report instead of
inventing a plausible-sounding number. The same goes for `transferSize` reading 0
on cross-origin resources without `Timing-Allow-Origin`, or LCP/CLS entries coming
back empty — report "not observed," don't backfill.

## 4. Write the report

Use the template below exactly. Write it in whatever language the user asked the
question in (Korean request → Korean report, English request → English report).
Every scorecard rating needs at least one finding behind it with real evidence
(a screenshot reference, a measured number, or a specific DOM/CSS fact) — never a
score with nothing underneath it. Don't stop at a table of grades: the "Overall
feedback" section is where you say, in your own words as a reviewer, what the
biggest-picture issues and patterns are, and each recommendation needs to explain
*why it matters* and *how to fix it*, not just name the symptom.

When a finding is the kind of thing a library or lint rule exists specifically to
catch or prevent — color contrast, missing ARIA attributes, bundle bloat, Core
Web Vitals regressions — name that tool in the "how" part of the recommendation,
not just the one-off manual fix. The relevant reference file for that pass
(`accessibility-checklist.md`, `performance-heuristics.md`,
`ui-composition-checklist.md`) lists a few well-known options to draw from. The
point isn't to push a dependency on every project — it's that "change this hex
value" fixes today's instance, while "and consider `eslint-plugin-jsx-a11y` so
this class of bug gets caught at lint time" helps the project stop reproducing
the same finding on every future review. Don't claim a library is already
installed — check `package.json` first, and phrase it as "if you don't already
have X" when you haven't confirmed either way.

```markdown
# UI & Performance Review — [Screen/Page Name]

**Reviewed:** [date] · **Target:** [URL or component path] · **Breakpoints tested:** [list]
**Automation path:** [Claude in Chrome | built-in browser] · **Tool-assisted scan:** [axe-core/Lighthouse used, or "none detected"]

## Summary
[2-4 sentences: the biggest wins and the biggest risks, in plain language]

## Overall feedback
[Reviewer's own qualitative read, not a restatement of the scorecard: overall
impression, any pattern across findings (same mistake repeating, problems
clustered in one area), and what to prioritize first. 2-5 sentences.]

## Scorecard
| Dimension | Rating | Confidence | Notes |
|---|---|---|---|
| Layout & alignment | Good / Needs work / Poor | High / Medium / Low | |
| Visual hierarchy | | | |
| Design-system consistency | | | |
| Responsiveness | | | |
| Accessibility | | | |
| Load performance | | | |
| Rendering performance | | | |
| Bundle / network weight | | | |

## Findings

### UI Composition
#### Layout, spacing & alignment
- [Severity] — [finding] — [evidence] — [recommendation]

#### Visual hierarchy
- ...

#### Design-system consistency
- ...

#### Responsiveness ([breakpoints])
- ...

#### Accessibility
- Contrast: ...
- Focus states: ...
- Semantic HTML / ARIA: ...
- Keyboard navigation: ...

### Performance
#### Load
- ...

#### Rendering
- ...

#### Bundle / network weight
- ...

## Measured metrics
| Metric | Value | Source | Reference target |
|---|---|---|---|
| TTFB | — | Performance API | <600ms good |
| FCP | — | Performance API | <1.8s good |
| LCP | — | Performance API | <2.5s good |
| CLS | — | Performance API | <0.1 good |
| Total transfer size | — | Resource timing | — |
| Request count | — | Network | — |

## Screenshots
- [breakpoint] — [reference]

## Recommendations (prioritized)
1. [What to change] — [why it matters: the impact/evidence behind it] — [how: a concrete way to fix it]
2. ...

## Not measured / out of scope
- [e.g. "axe-core/Lighthouse not detected — accessibility coverage is manual/heuristic only"]
- [e.g. "re-render frequency not measurable without React DevTools Profiler"]
```

Use a severity scheme consistently within one report (e.g. Blocker/High/Medium/Low)
— pick one and stick to it rather than mixing schemes across findings.

## Reference files

- `references/performance-heuristics.md` — Core Web Vitals thresholds and the
  Performance API snippet to run via `javascript_tool`.
- `references/accessibility-checklist.md` — WCAG 2.2 AA quick reference: contrast
  thresholds, focus visibility, landmarks/heading order, labels, keyboard traps.
- `references/ui-composition-checklist.md` — spacing/grid heuristics, touch-target
  sizing, line length, visual-hierarchy cues.
- `scripts/check-audit-tools.js` — detects whether axe-core/Lighthouse are
  available in the project; never runs anything on its own.
