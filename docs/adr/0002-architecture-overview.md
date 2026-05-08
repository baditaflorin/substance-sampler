# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs a rich frontend without runtime infrastructure. Texture generation, preview, export, release metadata, and persistence should be independently testable.

## Decision

Use a client-only modular architecture:

- `src/features/sampler`: upload, map generation, processing state, and export workflow.
- `src/features/preview`: lazy Three.js material preview.
- `src/lib/image`: canvas, pixel, and map-generation utilities.
- `src/lib/webgpu`: feature detection and compute acceleration.
- `src/lib/storage`: local persistence abstraction.
- `src/lib/build-info`: version and commit display.

## Consequences

- Processing code can be unit tested without rendering the whole app.
- Three.js stays out of the initial bundle through dynamic import.
- Future WASM processors can be added behind the same interfaces.

## Alternatives Considered

- Single-file prototype: faster initially, harder to test and extend.
- Backend-first service: rejected by ADR 0001.
