# Phase 3 Feature Claims Audit

Date: 2026-05-09

Scope: README, docs, ADRs, and visible app text at v0.2.0.

| Claim                           | Status before     | Evidence                                           | Decision                             |
| ------------------------------- | ----------------- | -------------------------------------------------- | ------------------------------------ |
| Browser-based photo-to-PBR      | Shipped fully     | Upload/drop produce PBR-like maps client-side.     | Keep.                                |
| WebGPU-capable processing       | Shipped fully     | WebGPU height path with CPU fallback.              | Keep.                                |
| Lazy Three.js preview           | Shipped fully     | Preview chunk is code-split.                       | Keep.                                |
| Material/source analysis        | Shipped fully     | Analysis panel and metadata.                       | Keep.                                |
| Per-map confidence              | Shipped fully     | Map tiles show confidence.                         | Keep.                                |
| Real-data warnings              | Shipped fully     | 10 fixture suite asserts warnings/errors.          | Keep.                                |
| ZIP export with provenance      | Shipped fully     | Metadata JSON included in ZIP.                     | Keep.                                |
| Local settings persistence      | Shipped partially | Settings persist only after processing.            | Finish.                              |
| Version/commit metadata         | Shipped fully     | Footer and `build-info.json`.                      | Keep.                                |
| Offline-friendly PWA            | Shipped partially | Service worker exists; project restore incomplete. | Improve restore and docs.            |
| "Texture creation from photos"  | Shipped fully     | User photos load via picker/drop.                  | Keep.                                |
| Real-ESRGAN/libigl/scikit-image | Not shipped       | Prompt aspiration only; README does not claim.     | Keep out of README; note limitation. |

Before counts:

- Green: 9
- Yellow: 2
- Red: 1 prompt-level non-claim

Success target:

- Every README/app claim has a direct e2e or unit assertion, or the claim is removed/qualified.

## After Implementation

| Claim                           | Status after                       | Evidence                                                               |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Browser-based photo-to-PBR      | Shipped fully                      | Smoke and real-data tests.                                             |
| WebGPU-capable processing       | Shipped fully                      | Existing WebGPU preference and CPU fallback.                           |
| Lazy Three.js preview           | Shipped fully                      | Smoke tests canvas output.                                             |
| Material/source analysis        | Shipped fully                      | Real-data fixture assertions.                                          |
| Per-map confidence              | Shipped fully                      | Phase 2 unit/e2e coverage retained.                                    |
| Real-data warnings              | Shipped fully                      | `npm run test:realdata`.                                               |
| ZIP export with provenance      | Shipped fully                      | ZIP path retained; metadata direct export added.                       |
| Local settings persistence      | Shipped fully                      | Completeness e2e reload assertion.                                     |
| Version/commit metadata         | Shipped fully                      | Smoke assertion.                                                       |
| Offline-friendly PWA            | Shipped fully within static limits | Last project restore and service worker exist; limitations documented. |
| "Texture creation from photos"  | Shipped fully                      | Browse/drop/paste/URL/sample/import paths.                             |
| Real-ESRGAN/libigl/scikit-image | Not claimed                        | README limitations explicitly say these payloads are not bundled.      |

After counts:

- Green: 11
- Yellow: 0
- Red: 0
- Not claimed/limited: 1
