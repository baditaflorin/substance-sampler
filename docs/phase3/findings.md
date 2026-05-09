# Phase 3 Findings Synthesis

Date: 2026-05-09

## Top 5 Usability Gaps

1. Users can only bring data through browse/drop; paste, URL, sample, batch, and state import are missing.
2. Users can download maps but cannot take the whole working session with them and reload it later.
3. Settings feel persistent but only save after map generation, so changed controls can be lost on reload.
4. Multi-file attempts silently process only one file, hiding partial failure.
5. URL/CORS reality is not explained, so users who have an image URL hit a wall.

## Top 5 Half-Baked Features

1. Local settings persistence: finish by saving immediately and validating stored shape.
2. Drag-drop: finish by handling multiple files with per-file status.
3. Export metadata: finish by exposing copy/download directly, not only inside ZIP.
4. Upscale label: keep behavior but rename to export scale so it does not imply AI super-resolution.
5. Offline-friendly PWA: keep but make last project restore real.

## Top 5 Codebase Pain Points

1. `App.tsx` mixes UI, workflow, source decoding, and persistence.
2. Preview runner shell logic is duplicated across smoke and real-data scripts.
3. Project/session state lacks a schema boundary.
4. Input source loading is not reusable across browse/drop/paste/URL/import.
5. E2E tests cover happy path and real fixtures, but not completeness paths.

## Top 5 Documentation/Reality Mismatches

1. README says local settings persistence; before Phase 3 this is delayed until regenerate.
2. README says offline-friendly through PWA indirectly; last project restore is not real.
3. Output provenance exists in ZIP but direct metadata export is not discoverable.
4. Drag/drop text implies source input generally, but multi-file drops are silently narrowed.
5. Initial prompt mentioned Real-ESRGAN/libigl/scikit-image; public docs correctly avoid claiming them, but limitations should stay explicit.

## Fully Usable Means

1. A stranger can load a source by browse, drop, paste, URL, sample, or state import.
2. A stranger can process one or several real images and see per-file success or errors.
3. A stranger can leave, reload, and continue from the last source/settings or explicitly start fresh.
4. A stranger can export maps, metadata, and a reloadable project state without reading code.
5. A stranger can trust README claims because every claim maps to a current test or documented limitation.

## Phase 3 Success Metrics

- Input audit: 10 of 11 app-relevant rows green; folder input documented out of scope.
- Output audit: 7 of 7 app-relevant rows green; print/embed/API documented out of scope.
- Controls audit: 18 of 18 visible controls green.
- E2E coverage: paste, URL import, multi-file, state import/export, metadata copy, share link, and settings persistence tested.
- Codebase health: zero TODO/FIXME/XXX/HACK, zero source `any`, no `@ts-ignore`, and no duplicated preview-runner shell logic.
- Real-data floor: Phase 2 fixture suite remains 10 of 10 green.

## Out Of Scope

- No new engine logic or material inference changes.
- No visual polish pass.
- No backend, auth, cloud storage, or server-side proxy.
- No folder import, print/PDF, embed code, or runtime API.
- No Real-ESRGAN/libigl/scikit-image payloads in this phase.
