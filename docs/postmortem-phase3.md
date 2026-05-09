# Phase 3 Completeness Postmortem

Date: 2026-05-09

Live site:
https://baditaflorin.github.io/substance-sampler/

Repository:
https://github.com/baditaflorin/substance-sampler

Release target:
v0.3.0

## What Changed

Phase 3 focused on making the existing texture workflow usable end-to-end by a stranger. The engine stayed locked. The work completed missing input paths, output paths, persistence, documentation alignment, and code-health gaps.

Implemented user-facing completion:

- Inputs: picker, drag-drop, paste, explicit clipboard read, CORS-readable URL, generated sample, multi-file queue, project import, settings links, and last-project restore.
- Outputs: individual PNG maps, ZIP, metadata JSON download, metadata clipboard copy, project JSON export/import, settings-only share URL.
- Persistence: settings save immediately; last project restores from IndexedDB; Start Fresh clears local state and URL hash.
- Guidance: URL/CORS, clipboard, import, decode, and validation failures use actionable errors.

## Audit Grids Before Vs After

| Audit           | Before green/yellow/red/out | After green/yellow/red/out       |
| --------------- | --------------------------- | -------------------------------- |
| Input pathways  | 1 / 3 / 7 / 1               | 11 / 0 / 0 / 1                   |
| Output pathways | 2 / 1 / 4 / 3               | 7 / 0 / 0 / 3                    |
| Controls        | 8 / 10 / 0 / 0              | 27 / 0 / 0 / 0                   |
| Feature claims  | 9 / 2 / 1 / 0               | 11 / 0 / 0 / 1 limited non-claim |

## Half-Baked Feature Triage

Finished:

- Local settings persistence: now saves immediately and validates stored settings.
- Drag/drop: now handles multi-file queues with per-file status.
- Metadata export: now has direct download and clipboard copy.
- Offline restore: now stores/restores project state, not just settings.

Renamed:

- `Upscale` became `Export scale` because the app performs deterministic 2x scaling, not AI super-resolution.

Kept limited:

- Debug overlay remains behind `?debug=1`.
- URL import is CORS-readable only because this is a static Mode A app.

Deleted:

- Unused `fileInputRef`.
- Duplicated preview-runner shell logic.

## Codebase Health Metrics

| Metric                                 |   Before |                   After |
| -------------------------------------- | -------: | ----------------------: |
| DRY violations in core/release scripts |        2 |                       0 |
| God modules in core workflow           |        1 | 0 accepted core modules |
| TODO/FIXME/XXX/HACK                    |        0 |                       0 |
| Source `any`                           |        0 |                       0 |
| `@ts-ignore`                           |        0 |                       0 |
| Known dead code                        | 1 likely |                 0 known |
| Real-user path e2e holes               |        6 |     0 for Phase 3 paths |

Boundary casts remain only where JSON is parsed and immediately zod-validated.

## Stranger Test

Recorded at:
https://github.com/baditaflorin/substance-sampler/blob/main/docs/phase3/stranger-test.md

Findings fixed:

1. Source picker and project import needed distinct test/user paths.
2. Settings persistence could race with older project restore snapshots.
3. Paste and URL paths needed direct coverage and visible errors.

## Documentation Reality Fixes

- README now lists verified features instead of broad claims.
- README limitations now explain CORS, settings-link limits, static Mode A scope, and unavailable Real-ESRGAN/libigl/scikit-image payloads.
- Privacy doc now says the last project source may be stored locally in IndexedDB.
- Phase 3 audit docs now include before/after grids.

## Verification

Latest local verification before this postmortem:

- `npm run lint`: passed.
- `npm test`: 5 files, 14 tests passed.
- `npm run smoke`: 17 browser tests passed, including smoke, real-data, and Phase 3 completeness paths.

The final pre-push hook reruns test, build, smoke, and real-data gates before publication.

## What Surprised Me

- The most important bug was not a missing button. It was the persistence race where a recent settings change could be beaten by an older project snapshot during restore.
- Adding project import made generic file-input tests fail, which was a useful proxy for real UI ambiguity.
- URL import is valuable, but CORS honesty matters more than pretending every image URL can work from a static page.

## Still-Open Completeness Gaps

1. Folder import remains out of scope.
2. Project JSON can be large because it embeds source image data.
3. No cross-device cloud sync; export/import is the transfer story.
4. No backend URL proxy for CORS-blocked sources.
5. No map batch exporter; multi-file input processes a queue and leaves the latest result active.

## Honest Take: Could A Stranger Use It End-To-End?

Yes, for the intended static app workflow: a stranger can open the URL, bring their own image by several common paths, process it, understand warnings, export maps and metadata, save a reloadable project, reset, import it again, and share settings.

Still no in specific ways: a stranger cannot paste an arbitrary blocked website image URL and expect the browser to bypass CORS, cannot sync projects across devices without exporting JSON, and cannot batch-export many source files as a production asset pipeline. Those are real limits, but they are now visible instead of hidden traps.
