# Phase 2 Substance Postmortem

Date: 2026-05-09

Live site:
https://baditaflorin.github.io/substance-sampler/

Repository:
https://github.com/baditaflorin/substance-sampler

## What Changed

Phase 2 kept the same product surface: upload a photo, generate PBR maps, preview, export. The engine now validates image bytes before decode, infers material/source quality, recommends first-pass settings, exposes confidence and warnings, exports provenance metadata, supports cancellation, and runs a 10-fixture real-data gate.

## Real-Data Pass Rate

| Fixture           | Before                                             | After                                                   |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------- |
| 01 brick wall     | Fail: wrong-but-confident huge/non-square output   | Pass: brick, huge-source, non-square warnings           |
| 02 wood planks    | Partial: usable but uninformed                     | Pass: wood, non-square warning                          |
| 03 concrete wall  | Fail: lighting became fake height                  | Pass: concrete, huge-source, lighting-gradient warnings |
| 04 rock texture   | Fail: scene geometry treated as material relief    | Pass: rock, scene-scale warning                         |
| 05 orange fabric  | Partial: usable but softened micro-detail silently | Pass: fabric, fine-detail warning                       |
| 06 red rust       | Fail: pigment risk not surfaced                    | Pass: rust, chroma-height warning                       |
| 07 floor tile     | Partial: grid/grout not understood                 | Pass: tile, grid warning                                |
| 08 mislabeled PNG | Partial: silently corrected by browser             | Pass: format-mismatch provenance warning                |
| 09 empty upload   | Fail: generic decode error                         | Pass: `empty-file` error                                |
| 10 truncated JPEG | Fail: generic decode error                         | Pass: `truncated-jpeg` error                            |

Before:
3 of 8 valid images produced a domain-useful first guess. 0 of 10 fixtures surfaced confidence or warning/error context.

After:
8 of 8 valid images produce a useful first guess, and 2 of 2 broken inputs fail with actionable guidance. `npm run test:realdata` passes 10 of 10 fixtures.

## Top Logic Gaps Closed

1. "Any image is a material" is now replaced by material classification and source-quality warnings.
2. Lighting, pigment, scene scale, seam risk, flatness, and non-square output are now surfaced before export.
3. Per-map confidence exists for albedo, normal, roughness, height, and AO.
4. Empty, unsupported, truncated, huge, and mislabeled files are validated at the boundary.
5. ZIP export includes metadata: app version, commit, schema version, source details, settings, warnings, map confidence, map fingerprints, and a deterministic generation fingerprint.

## Smart Behaviors Evidence

- First upload immediately produces maps and analysis; the user corrects instead of configuring from zero.
- Material classes covered in fixtures: brick, wood, concrete, rock, fabric, rust, tile.
- Warnings are domain-specific: `lighting-gradient`, `scene-scale-risk`, `fine-detail-risk`, `chroma-height-risk`, `grid-detected`, `format-mismatch`, `huge-source`, and `non-square-output`.
- `?debug=1` exposes reasoning, metrics, timings, confidence, and export metadata.
- User-touched controls are respected for the session; recommendations only fill untouched settings.

## Determinism Check

Unit coverage verifies identical ImageData plus identical settings produce identical map fingerprints, metadata map fingerprints, warning IDs, material classification, and generation fingerprint.

Real-data fixture contracts pass for all 10 fixtures. ZIP container mtime is fixed to avoid archive timestamp drift. The human-readable `generatedAt` field remains dynamic by design; reproducible comparison should use the deterministic map fingerprints and `generationFingerprint`.

## Performance

Measured by `npm run test:realdata`:

- Median fixture duration: 1.85 s.
- p95 fixture duration: 3.1 s.
- Worst fixture duration: 3.1 s on the huge brick source and square tile source.
- Full real-data suite: 10 passed in 19.2 s.

Details:
https://github.com/baditaflorin/substance-sampler/blob/main/docs/perf/phase2-fixtures.md

## What Surprised Me

- File names carry useful material hints in real texture datasets; the classifier uses them, but still backs warnings with image statistics.
- Broken images are the cheapest high-impact fix. Rejecting empty/truncated files before decode makes the app feel much less vague.
- The biggest quality risk is not crashing. It is producing plausible maps for bad sources without telling the user what is speculative.

## Tech Debt Accepted

- The classifier is heuristic and filename-assisted, not learned.
- Lighting correction is warning-only; it does not yet remove illumination from albedo/height.
- Seam analysis is edge-statistical, not a true tileability optimizer.
- Real-ESRGAN/libigl remain out of the static v0.2.0 payload because large WASM/model assets would breach the current budget without a confirmed v1-quality integration plan.

## Phase 3 Candidates

1. Actual illumination flattening before height/roughness inference.
2. Seam preview and automatic offset/blend suggestions.
3. Filename-independent material classifier trained or calibrated on texture datasets.
4. Lossless state export/re-import so a ZIP can recreate the full session.
5. More map-specific confidence tests, especially for chroma-heavy and shadow-heavy images.

## Honest Take: Is It Still A Toy?

It is no longer a polished demo that blindly trusts the happy path. It now behaves like a useful static texture assistant: it makes a first guess, tells the user when it is unsure, and explains risky inputs in texture terms.

It is still not a professional Substance replacement. The engine is heuristic, it warns about lighting more than it fixes it, and it lacks deep material separation. But it has crossed the important line from "cool toy" to "honest tool that can help on messy real photos."
