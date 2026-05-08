# 0006 - WASM And WebGPU Modules

## Status

Accepted

## Context

The product concept calls for WebGPU compute, libigl-style geometry processing, scikit-image-style image filters, Real-ESRGAN-style upscaling, and Three.js preview. GitHub Pages cannot set COOP/COEP headers directly, so some high-performance WASM threading patterns are unavailable.

## Decision

V1 ships these browser modules:

- WebGPU compute adapter for supported devices, with CPU canvas fallback.
- TypeScript image operators modeled after common scikit-image workflows: luminance, gradients, blur, histogram normalization, tile blending, and map derivation.
- A Real-ESRGAN-ready upscaler interface with a static, local upscale fallback; model weights are not bundled in v1.
- libigl-inspired geometry preview controls through Three.js primitives; no native libigl WASM binary is bundled in v1.
- Three.js lazy import for material preview.

## Consequences

- The published site works from GitHub Pages without special headers.
- Heavy native/WASM/model assets can be added later behind stable interfaces.
- V1 still provides the key workflow: photo in, PBR maps out, 3D preview live.

## Alternatives Considered

- Bundle large Real-ESRGAN ONNX weights immediately: rejected due to asset budget and first-load concerns.
- Require a backend GPU service: rejected by ADR 0001.
