# Architecture

Substance Sampler is a Mode A GitHub Pages application. There is no runtime backend, database, Docker image, nginx proxy, or server-side metrics stack.

Live site:
https://baditaflorin.github.io/substance-sampler/

Repository:
https://github.com/baditaflorin/substance-sampler

## Context

```mermaid
C4Context
title Substance Sampler Context
Person(artist, "Indie game / 3D artist", "Creates usable PBR texture maps from photos")
System(app, "Substance Sampler", "Static browser app hosted on GitHub Pages")
System_Ext(github, "GitHub", "Repository, stars, Pages hosting")
System_Ext(paypal, "PayPal", "Voluntary support link")
Rel(artist, app, "Imports photos, exports maps")
Rel(app, github, "Served by Pages and links to repo")
Rel(app, paypal, "Links to PayPal support page")
```

## Containers

```mermaid
C4Container
title Substance Sampler Containers
Person(artist, "Indie game / 3D artist")
System_Ext(pages, "GitHub Pages", "Static hosting")
System_Boundary(browser, "Browser runtime") {
  Container(ui, "React UI", "TypeScript + Vite", "Upload, controls, status, links, version, map gallery")
  Container(worker, "Texture Worker", "Comlink worker", "CPU image kernels and WebGPU adapter orchestration")
  Container(webgpu, "WebGPU Compute", "WGSL", "Height-map luminance acceleration when available")
  Container(preview, "Three.js Preview", "Lazy-loaded JS", "3D material preview")
  ContainerDb(indexeddb, "IndexedDB", "Browser API", "Local settings")
}
Rel(pages, ui, "Serves docs/")
Rel(artist, ui, "Uses")
Rel(ui, worker, "Sends ImageData and settings")
Rel(worker, webgpu, "Uses optional compute")
Rel(ui, preview, "Passes generated maps")
Rel(ui, indexeddb, "Stores settings")
```

## Module Boundaries

- `src/features/sampler/` owns upload, worker client, settings, and generated texture state.
- `src/lib/image/` owns deterministic image kernels and PNG/ZIP export.
- `src/lib/webgpu/` owns WebGPU feature detection and compute shaders.
- `src/features/preview/` owns the lazy Three.js renderer.
- `src/lib/storage/` owns IndexedDB access.
- `docs/` is both documentation and the GitHub Pages publish directory.

## Pages Boundary

GitHub Pages serves `docs/` from the `main` branch. `make build` writes hashed assets, `index.html`, `404.html`, `build-info.json`, the manifest, and service worker files into `docs/` while preserving documentation under `docs/adr/`.
