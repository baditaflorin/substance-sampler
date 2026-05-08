# 0017 - Dependency Policy

## Status

Accepted

## Context

The app needs reliable browser rendering and processing while keeping the first load small.

## Decision

Use production-ready, actively maintained dependencies only:

- Vite, React, TypeScript, Vitest, ESLint, Prettier, and Playwright for development.
- Three.js for 3D preview, lazy-loaded.
- Browser-native APIs for canvas, workers, WebGPU, downloads, and storage.

Dependencies with large model weights or special headers must be lazy, optional, or deferred until the Pages constraints are solved.

## Consequences

- The core app stays maintainable and fast.
- Future libigl/Real-ESRGAN WASM additions have to prove size, licensing, and Pages compatibility.

## Alternatives Considered

- Hand-roll 3D preview: rejected because Three.js is battle-tested.
- Add experimental abandoned WebGPU libraries: rejected.
