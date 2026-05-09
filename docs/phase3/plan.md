# Phase 3 Completeness Plan

Date: 2026-05-09

Ranking principle: fix the points where a stranger with their own texture source hits a wall.

## Selected Catalog Items

1. Item 1 - Claimed input pathways work: browse, drop, paste, URL, sample, import state.
2. Item 2 - Format detection: continue using byte signature; surface mismatches.
3. Item 3 - URL input: support CORS-readable image URLs and explain CORS failures.
4. Item 4 - Multi-file input: batch queue with progress, partial success, and per-file errors.
5. Item 5 - Mobile picker: keep browser picker and add camera capture hint.
6. Item 6 - Clipboard read: native paste plus explicit clipboard button fallback.
7. Item 7 - Sample/demo: generated sample source in the same UI as user data.
8. Item 8 - Resume: restore last project and provide Start Fresh.
9. Item 9 - Export formats: maps ZIP, metadata, and state file all work.
10. Item 10 - Copy-to-clipboard: copy metadata with confirmation.
11. Item 11 - Downloadable state: versioned project file.
12. Item 12 - Share URL: settings-only hash link with documented limits.
13. Item 15 - Half-baked triage: finish persistence, drop, metadata, export scale, PWA restore.
14. Item 16 - Finish kept features: tests for each kept completion path.
15. Item 18 - Settings completeness: all settings persist immediately; reset clears them.
16. Item 19 - Help/docs alignment: README claims become verified checklist.
17. Item 20 - DRY: consolidate preview runner shell logic.
18. Item 22 - Canonical types: project state and batch state types live in one place.
19. Item 23 - Shared schemas: zod schemas validate project state and stored settings.
20. Item 24 - Split god module: move source loading/state helpers out of `App.tsx`.
21. Item 31 - One error handling convention: user-facing errors for URL/import/clipboard/storage paths.
22. Item 32 - One state convention: source/result/settings/project state flow documented and tested.
23. Item 35 - Eliminate unsafe JSON boundaries: validate imports and IndexedDB settings.
24. Item 36 - Validate every boundary: project files and share links use schemas.
25. Item 38 - Every save saves: settings and geometry persist on change.
26. Item 39 - Persistence migration: versioned local state with v1 migration defaults.
27. Item 40 - Clear state: Start Fresh clears project, result, settings, source, and URL hash.
28. Item 41 - Round-trip: export/import state restores source and settings.
29. Item 42 - README checklist: claims tied to tests.
30. Item 43 - Quickstart: verify via local commands.
31. Item 45 - Limitations: document static/CORS/model limits.
32. Item 46 - Stranger test: private-context run on real workflow.
33. Item 47 - Fix top-3 stranger-test findings.

## Implementation Order

1. ADRs 0060-0071.
2. Shared project/input/output primitives.
3. Input completion in UI and tests.
4. Output/state completion in UI and tests.
5. Persistence and reset.
6. Script DRY consolidation.
7. Docs alignment and stranger test.
8. Version bump, Pages build, release tag.

## Permanent Out Of Scope

- Folder import.
- Print/PDF texture reports.
- Embed code.
- Runtime API/curl examples.
- Backend proxy for CORS-blocked image URLs.
- Engine changes, model payloads, Real-ESRGAN/libigl/scikit-image integration.
