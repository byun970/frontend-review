# 🔍 frontend-review

A Claude Code skill that evaluates an already-built frontend screen, page, or
component for UI composition (layout, spacing, visual hierarchy, design-system
consistency, responsiveness, accessibility) and performance (load timing,
rendering/jank, bundle and network weight). It drives a real browser via
Claude in Chrome or the built-in browser, pulls real measurements through the
Performance API and computed styles, and writes an evidence-based report
instead of a vibe check — every finding ties to a screenshot, a measured
number, or a specific DOM/CSS fact, and anything it genuinely can't measure
(like re-render frequency) is labeled as out of scope rather than guessed at.

This repository is both a Claude Code **plugin marketplace** and the single
**plugin** it hosts (`frontend-review`), under `plugins/frontend-review/`.

## Install

```
claude plugin install frontend-review --marketplace byun970/frontend-review
```

or, from inside a Claude Code session:

```
/plugin install frontend-review --marketplace byun970/frontend-review
```

(Requires Claude Code 2.1.292+ for the terminal form, 2.1.275+ for the
in-session form. On an older version, add the marketplace and install
separately: `claude plugin marketplace add byun970/frontend-review` then
`claude plugin install frontend-review@byun970-skills`.)

## Usage

Once installed, just ask Claude to review a screen you've built, e.g. "review
this page" or "check the accessibility of this component" — the skill
triggers automatically. See
[`plugins/frontend-review/skills/frontend-review/SKILL.md`](plugins/frontend-review/skills/frontend-review/SKILL.md)
for the full workflow and report format.

## License

MIT — see [LICENSE](LICENSE).
