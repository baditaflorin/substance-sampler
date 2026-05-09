# Phase 2 Substance Plan

## Ranking Principle

Ranked by impact on the real-data audit, not implementation novelty.

## Selected Catalog Items

1. Item 32 - Actionable errors: empty/truncated/misdecoded files need what/why/next-step messages.
2. Item 33 - Validate at boundaries: file size, MIME, extension, byte signature, and decode constraints before processing.
3. Item 4 - Partial inputs: truncated JPEGs degrade clearly instead of generic decode failure.
4. Item 2 - Format variants: normalize and report file-signature/MIME/extension mismatches.
5. Item 3 - Huge inputs: define budgets and surface downsample/output-shape warnings.
6. Item 6 - Auto-detect structure: infer material/source class from image statistics.
7. Item 8 - Useful first guess: new upload applies recommended settings from analysis before processing.
8. Item 9 - Format normalization by default: use byte signature over extension/MIME for supported formats.
9. Item 12 - Domain-aware validation: flag lighting gradients, non-square output, low detail, chroma-driven height, seam risk.
10. Item 13 - Recognize common shapes: wood/planks, brick/masonry, concrete, fabric, rust/metal, tile/grid, rock/aggregate, unknown/unsuitable.
11. Item 15 - Domain conventions: prefer power-of-two recommendations and texture-map terminology.
12. Item 16 - Confidence scores: source, material, and per-map confidence.
13. Item 18 - Surface anomalies: warnings for gradients, seam mismatch, flatness, high chroma, grid seams, and downsampling.
14. Item 19 - Explain decisions: concise reasoning attached to material classification and warnings.
15. Item 14 - Domain-aware export: metadata JSON in ZIP with source, settings, confidence, warnings, and fingerprints.
16. Item 38 - Output provenance: app version, schema version, source fingerprint, map fingerprints, settings, warnings.
17. Item 35 - Deterministic outputs: same ImageData/settings produce stable map fingerprints.
18. Item 24 - Enumerate states: explicit state taxonomy in docs and UI state model.
19. Item 25 - No stuck states: every state has an exit path.
20. Item 26 - Cancellation actually cancels: long processing can be cancelled by terminating/refreshing the worker job.
21. Item 27 - Concurrency safety: latest job wins; stale worker responses are ignored.
22. Item 28 - Profile real-data inputs: measure fixture timings and document hot paths.
23. Item 29 - Heavy work off the main thread: keep worker boundary and expand report metadata.
24. Item 31 - Cache expensive things: source fingerprint and analysis travel with the result.
25. Item 37 - Debug overlay: `?debug=1` shows internal analysis, confidence, and performance report.
26. Item 39 - Remember user corrections within session: changed controls mark settings as user-owned for the current session.

## Implementation Order

1. Fixture contracts and fixture runner.
2. File validation and actionable errors.
3. Image analysis engine and material classifier.
4. Smart default recommendation on upload.
5. Confidence and warnings surfaced in UI.
6. Export metadata and deterministic fingerprints.
7. Cancellation/concurrency/state cleanup.
8. Debug surface and performance report.
9. Fixture pass-rate postmortem and version bump.

## Non-Goals

- No backend or Mode C escalation.
- No new product surface such as a material library, node graph, or account system.
- No visual polish pass beyond UI text needed for confidence, warnings, and debug.
- No bundled large model payloads.
