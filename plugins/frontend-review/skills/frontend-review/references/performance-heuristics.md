# Performance heuristics

## Core Web Vitals reference thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| FCP (First Contentful Paint) | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB (Time to First Byte) | ≤ 600ms (rough heuristic, not an official CWV) | ≤ 1.0s | > 1.0s |

These are the thresholds to compare measured values against when filling in the
"Measured metrics" table and rating the Load/Rendering rows on the scorecard.

## Measuring it: the Performance API snippet

Run this through `javascript_tool` against the live page (it must run in the
page's own context, not in a shell — that's why it lives here as a snippet, not
as an executable script). It reads real browser timing data; it does not invoke
any build tooling, so it works on any page regardless of framework.

```js
(() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paint = performance.getEntriesByType('paint');
  const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
  const cls = performance.getEntriesByType('layout-shift')
    .filter(e => !e.hadRecentInput)
    .reduce((sum, e) => sum + e.value, 0);
  const resources = performance.getEntriesByType('resource');
  const byType = {};
  let totalBytes = 0;
  for (const r of resources) {
    const t = r.initiatorType || 'other';
    byType[t] = (byType[t] || 0) + (r.transferSize || 0);
    totalBytes += (r.transferSize || 0);
  }
  return JSON.stringify({
    ttfb: nav.responseStart - nav.requestStart,
    domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
    load: nav.loadEventEnd - nav.startTime,
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    lcp: lcp?.startTime,
    cls,
    totalTransferBytes: totalBytes,
    bytesByInitiatorType: byType,
    resourceCount: resources.length,
  }, null, 2);
})()
```

### Known limitations — report these, don't paper over them

- `transferSize` reads `0` for cross-origin resources that don't send
  `Timing-Allow-Origin`. If totals look suspiciously low, check whether the
  heaviest resources are cross-origin before concluding the page is lightweight.
- The `largest-contentful-paint` and `layout-shift` entry buffers can come back
  empty if nothing qualified, or if the page had already fully settled before the
  snippet ran. An empty result means "not observed," not "zero" — say so in the
  report rather than writing "0" or "N/A" without context.
- This snippet reflects a single page load. If the user cares about a specific
  interaction (e.g. a slow tab switch), re-run it after that interaction and
  compare, or ask the user what interaction they actually care about.

## Rendering / jank signals beyond CLS

- Cross-check CLS with a visual check: take screenshots at the same scroll
  position before and after the page settles, and look for elements that visibly
  moved.
- `read_console_messages` warnings like "Maximum update depth exceeded" or
  repeated hydration-mismatch messages are evidence of render-related problems
  even without a frame-by-frame profiler.

## What's not measurable here

Re-render frequency/count has no browser-automation-visible signal — it requires
React DevTools Profiler (or similar framework tooling) attached by the user.
Don't estimate it. If console output happens to show render-shaped warnings, cite
that as evidence; otherwise, list it under "Not measured / out of scope" in the
report.

## Related libraries worth suggesting

A one-off performance finding is a snapshot; these catch regressions going
forward instead of waiting for the next manual review:

- **`web-vitals`** — a small library that reports real Core Web Vitals (LCP,
  CLS, INP, etc.) from actual users in production, not just this one local
  measurement. Worth suggesting when the project has no real-user monitoring at
  all.
- **`rollup-plugin-visualizer`** or **`vite-bundle-visualizer`** (for
  Vite/Rollup projects) — a treemap of what's actually in the production
  bundle, useful when "bundle weight" findings need a next step beyond a single
  transfer-size number.
- **`vite-plugin-compression`** — adds gzip/brotli output at build time when a
  project is serving uncompressed assets.
