# Phase 3 Codebase Health Audit

Date: 2026-05-09

Scope: `src/`, `e2e/`, `scripts/`, and documentation claims. Generated `docs/assets/` and `node_modules/` are excluded.

## Measurements Before

| Metric                |      Before | Evidence                                                                                                                                                    |
| --------------------- | ----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ---------------------------------- |
| DRY violations        |           2 | Preview server shell logic duplicated in `scripts/smoke.sh` and `scripts/realdata.sh`; PNG fixture generation duplicated between e2e and screenshot script. |
| God modules           |           1 | `src/App.tsx` owns input loading, workflow state, source decoding, rendering, controls, and export buttons.                                                 |
| TODO/FIXME/XXX/HACK   |           0 | `rg "TODO                                                                                                                                                   | FIXME | XXX | HACK"` excluding generated assets. |
| `any` uses            | 0 in source | No source-level `any`; generated assets ignored.                                                                                                            |
| `@ts-ignore`          |           0 | None found.                                                                                                                                                 |
| Unsafe boundary casts |           2 | `document.getElementById("root") as HTMLElement`; IndexedDB request cast in storage helper.                                                                 |
| Dead code             |    1 likely | `fileInputRef` is assigned but not used.                                                                                                                    |
| Test coverage holes   |           6 | Paste, URL input, multi-file, state export/import, settings persistence on change, share link.                                                              |

## DRY Findings

1. `scripts/smoke.sh` and `scripts/realdata.sh` both find a free port, build, preview, poll, and cleanup. Consolidate shell helpers.
2. Sample PNG generation lives in `e2e/smoke.spec.ts` and `scripts/capture-screenshot.mjs` with similar intent. Extracting is optional because one is test-only and one is documentation capture.

## SOLID Findings

1. `src/App.tsx` has multiple reasons to change: input sources, project persistence, processing workflow, UI layout, map downloads, and state import/export.
2. `fileToLoadedSource` is application logic inside the UI component.
3. Project persistence only stores settings; project state has no schema or migration boundary.

## Dead Code

1. `fileInputRef` in `src/App.tsx` is unused.

## Type Safety

1. JSON boundaries are validated for `build-info.json`, but project state does not exist yet.
2. IndexedDB reads trust stored settings without schema validation.

## Consistency

1. User-facing errors use a consistent `UserFacingError` shape.
2. Catch blocks are consistent enough, but storage errors are silently ignored on initial load.
3. Settings persistence is inconsistent: loaded on mount, saved only in processing.

## Test Coverage Holes

1. No test for native paste image.
2. No test for URL import and CORS error guidance.
3. No test for multi-file partial success.
4. No test for project state export/import round trip.
5. No test for settings persistence before regenerate.
6. No test for copied metadata or share link.

## Measurements After

| Metric              |                     After | Evidence                                                                                                                          |
| ------------------- | ------------------------: | --------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ---------------------------------- |
| DRY violations      | 0 in core/release scripts | Preview runner logic now lives in `scripts/preview-runner.sh`.                                                                    |
| God modules         |         0 in core modules | Source loading, project state, storage validation, and sampler presentation moved out of `App.tsx`.                               |
| TODO/FIXME/XXX/HACK |                         0 | `rg "TODO                                                                                                                         | FIXME | XXX | HACK"` excluding generated assets. |
| `any` uses          |               0 in source | `rg "\\bany\\b"` excluding generated assets.                                                                                      |
| `@ts-ignore`        |                         0 | None found.                                                                                                                       |
| Boundary casts      |                2 accepted | JSON parse results are immediately zod-validated in `src/lib/project/state.ts`.                                                   |
| Dead code           |                   0 known | Removed unused file input ref; lint clean.                                                                                        |
| Test coverage holes |       0 for Phase 3 paths | `e2e/completeness.spec.ts` covers paste, URL, multi-file, state round-trip, settings persistence, metadata copy, and share links. |

Remaining accepted debt:

- `App.tsx` is still the high-level workflow orchestrator. It is no longer a source-decoding or presentational component module.
- Test PNG helpers remain under `e2e/` because they are test-only and not product code.
