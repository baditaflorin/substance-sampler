# 0001 - Deployment Mode

## Status

Accepted

## Context

Substance Sampler must be easy for indie game and 3D artists to use from a free public URL. The product imports user photos, generates texture maps, previews them on 3D geometry, and exports local files. The bootstrap requirement prefers GitHub Pages unless a runtime backend is genuinely required.

## Decision

Use Mode A: Pure GitHub Pages.

The app runs fully in the browser. Image processing uses browser APIs, Web Workers, WebGPU where available, and CPU fallbacks. Three.js preview and heavy processing code are lazy-loaded after the user selects a photo. User data stays local through memory downloads and optional IndexedDB/OPFS persistence.

Live site: https://baditaflorin.github.io/substance-sampler/

Repository: https://github.com/baditaflorin/substance-sampler

## Consequences

- No runtime backend, database, server secrets, auth, Docker, nginx, or server observability are required for v1.
- GitHub Pages is the deployment boundary and first-class release artifact.
- Cross-origin isolation headers cannot be configured directly on GitHub Pages, so SharedArrayBuffer-only WASM paths are excluded from v1.
- Large model assets must be lazy, optional, or deferred until they fit the static hosting budget.

## Alternatives Considered

- Mode B with pre-built data artifacts: unnecessary because v1 has no shared data corpus.
- Mode C with Docker backend: rejected because runtime GPU processing, auth, and server persistence are not v1 requirements.
