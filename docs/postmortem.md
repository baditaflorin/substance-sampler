# Postmortem

## What Was Built

Substance Sampler v0.1.0 is a static GitHub Pages app that imports a photo, generates albedo, normal, roughness, height, and ambient occlusion maps in-browser, previews them on a Three.js material, and exports a ZIP. The live page includes GitHub and PayPal links plus visible version and commit metadata.

Live site:
https://baditaflorin.github.io/substance-sampler/

Repository:
https://github.com/baditaflorin/substance-sampler

## Was Mode A Correct?

Yes. Mode A was the right choice for v1. The core workflow has no auth, shared writes, server secrets, or runtime GPU service requirement. Browser CPU fallbacks and optional WebGPU compute are enough to make the first useful version work from a free static URL.

## What Worked

- GitHub Pages from `main` `/docs` kept deployment simple.
- Lazy-loading Three.js kept the initial gzipped JS well below the 200 KB target.
- Worker-based image processing kept the UI responsive.
- Playwright smoke tests caught both a bad test fixture and a fragile fixed-port preview script.

## What Did Not Work

- GitHub Pages cannot set COOP/COEP headers, so SharedArrayBuffer-heavy WASM paths are not a clean default.
- Embedding the current git commit directly in the JS bundle caused self-referential build churn. The final approach keeps commit metadata in `build-info.json`.
- Real Real-ESRGAN/libigl binaries are too large and header-sensitive for the first static release.

## Surprises

- The static app path was enough for the whole v1 loop.
- The test fixture mattered: Chromium rejected the first embedded PNG, which validated the app's load-failure state.
- Vite preview silently changes ports unless `--strictPort` is set.

## Accepted Tech Debt

- The upscaler is a local browser fallback, not bundled Real-ESRGAN model inference.
- libigl is represented by preview-oriented geometry workflows, not a native libigl WASM module.
- The first image kernels are TypeScript implementations modeled after common scikit-image operations.

## Next Three Improvements

1. Add optional ONNX/WebGPU super-resolution model loading behind an explicit large-download action.
2. Add seamless texture controls with offset preview and clone-brush-style seam repair.
3. Add a compact project file format for saving source image, settings, and generated maps locally.

## Time Spent Vs Estimate

Estimated: one focused bootstrap session.

Actual: one focused bootstrap session, with extra time spent hardening smoke tests and metadata publishing.
