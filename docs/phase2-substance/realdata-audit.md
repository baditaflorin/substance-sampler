# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Live app tested:
https://baditaflorin.github.io/substance-sampler/

Version shown by app:
v0.1.0, commit 770e5fd

## Summary

V1 technically completed the map-generation flow for 8 of 10 inputs. That overstates product quality. The domain-useful first-guess pass rate is closer to 3 of 10 because the app exports maps confidently even when it should warn about lighting gradients, non-seamable subjects, huge-source downsampling, low-detail/flat materials, or broken inputs.

The worst failure mode is wrong-but-confident output: the app treats any decodable image as a valid PBR source and gives no confidence, no material diagnosis, no seam risk, no provenance, and no next-step guidance.

## Inputs

| ID  | Input                             | Source                                                                                             |                Size | Class                           |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------: | ------------------------------- |
| 01  | Brick wall close-up photo         | https://commons.wikimedia.org/wiki/File:Brick_wall_close-up_view.jpg                               |  10 MB, 4752 x 3168 | clean but huge                  |
| 02  | Wood planks texture               | https://commons.wikimedia.org/wiki/File:Wood_planks_texture.jpg                                    |  111 KB, 1024 x 768 | clean                           |
| 03  | Textured concrete wall            | https://commons.wikimedia.org/wiki/File:Textured_Concrete_Wall.jpg                                 |  12 MB, 6016 x 4016 | huge, lighting/camera processed |
| 04  | Rock texture photo                | https://commons.wikimedia.org/wiki/File:Rock_texture.jpg                                           | 2.2 MB, 3888 x 2592 | genuinely messy                 |
| 05  | Orange fabric textile             | https://commons.wikimedia.org/wiki/File:Orange_fabric_textile_cloth_texture.jpg                    | 124 KB, 1600 x 1200 | fine-detail material            |
| 06  | Red rust texture                  | https://commons.wikimedia.org/wiki/File:RED_RUST_TEXTURE.jpg                                       | 2.0 MB, 1936 x 1288 | chroma-heavy material           |
| 07  | Grey speckled floor tile          | https://commons.wikimedia.org/wiki/File:Grey_speckled_clean_cemented_tile_floor_paving_texture.jpg | 2.3 MB, 2294 x 2294 | structured/grid material        |
| 08  | Wood JPEG bytes mislabeled as PNG | Derived from input 02                                                                              |              111 KB | adversarial format mismatch     |
| 09  | Empty upload                      | Empty local file                                                                                   |                 0 B | empty/broken                    |
| 10  | Truncated concrete JPEG           | First 8 KB of input 03                                                                             |                8 KB | partial/broken transfer         |

## Per-Input Walkthrough

### 01 - Brick Wall Close-Up

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 683, CPU, 301 ms`.

What it should have done:
Detect that the source is large and non-square, infer brick/masonry, suggest square/power-of-two output, estimate seam risk, and warn if perspective/lighting makes a generated height map suspect.

Why it failed:
The engine only runs generic luminance/gradient kernels. It has no material classifier, no perspective/lighting diagnosis, no output-shape recommendation, and no confidence model.

Failure mode:
Wrong-but-confident. The export looks official even though the app never checked whether it is game-ready.

Manual work the user had to do:
Decide whether the crop/aspect ratio is acceptable, inspect seams manually, decide output size manually, and judge whether the normal/height map is believable.

### 02 - Wood Planks Texture

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 768, CPU, 289 ms`.

What it should have done:
Infer wood/planks, preserve strong linear grain direction, suggest anisotropic/wood-friendly defaults, and flag the non-square export if the user likely wants a game texture.

Why it failed:
All materials get the same controls and defaults. The app does not infer material type or structural direction.

Failure mode:
Mostly acceptable, but still under-informed. It works because the input is forgiving.

Manual work the user had to do:
Tune normal/detail by eye and decide whether the plank direction/seams are acceptable.

### 03 - Textured Concrete Wall

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 684, CPU, 274 ms`.

What it should have done:
Detect the broad lighting gradient and camera processing, remove or warn about low-frequency illumination before deriving height/roughness, and expose confidence.

Why it failed:
The height map is based on luminance, so lighting becomes fake geometry. The app has no shading-removal step and no anomaly detection for one-sided brightness ramps.

Failure mode:
Wrong-but-confident. This is one of the clearest v1 failures.

Manual work the user had to do:
Recognize that the height map is mostly lighting, not surface relief, then manually compensate or reject the output.

### 04 - Rock Texture

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 683, CPU, 270 ms`.

What it should have done:
Detect that this is a photographed pile of large rocks, not a flat material sample, and warn that seamless tiling and local-normal generation will be unreliable.

Why it failed:
The engine has no scale reasoning and treats scene geometry as texture micro-relief.

Failure mode:
Wrong-but-confident.

Manual work the user had to do:
Decide whether the subject is even appropriate for a tiling PBR material and inspect artifacts manually.

### 05 - Orange Fabric Textile

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 768, CPU, 308 ms`.

What it should have done:
Infer fabric/weave, preserve microstructure, recommend higher detail/normal defaults, and warn if downsampling removes weave information.

Why it failed:
The same blur/normal pipeline is used for fabric as for stone, wood, and concrete. No material-specific defaults exist.

Failure mode:
Silent quality loss. The app does not say that the output may be too soft.

Manual work the user had to do:
Increase detail by trial and error and visually compare before/after.

### 06 - Red Rust Texture

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 681, CPU, 270 ms`.

What it should have done:
Separate color variation from physical relief better, flag strong chroma-driven luminance as low-confidence for height, and expose roughness/height confidence separately.

Why it failed:
The engine uses luminance as height without checking whether brightness is pigment/color rather than surface depth.

Failure mode:
Wrong-but-confident for height, plausible for albedo.

Manual work the user had to do:
Judge whether color patches are being turned into fake bumps.

### 07 - Grey Speckled Floor Tile

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 1024, CPU, 392 ms`.

What it should have done:
Detect square/grid/tile structure, preserve grout/tile boundaries intentionally, and distinguish surface speckle from tile seams.

Why it failed:
The app has no repeated-grid detector or domain-aware validation for floor tiles.

Failure mode:
Wrong-but-confident around seams and grout.

Manual work the user had to do:
Verify that seams are usable and not accidentally softened or overemphasized.

### 08 - JPEG Bytes Mislabeled As PNG

What v1 did:
Loaded successfully and exported five maps. Status: `Maps ready: 1024 x 768, CPU, 292 ms`.

What it should have done:
Tell the user that the file extension/MIME did not match the actual bytes, normalize it internally, and carry that provenance into export metadata.

Why it failed:
The browser decoder handled the mismatch, but the app never validates or reports input format facts.

Failure mode:
Silent correction. Better than crashing, but not inspectable.

Manual work the user had to do:
None for happy path, but they get no explanation of what happened.

### 09 - Empty Upload

What v1 did:
Failed with `Load failedThe source image could not be decoded.`

What it should have done:
Say the file is empty, explain that there are no image bytes to decode, and offer a next step: choose a PNG/JPEG/WebP with nonzero size.

Why it failed:
Errors are caught only after browser decode fails. The app does no boundary validation before decode.

Failure mode:
Obvious failure, but not actionable enough.

Manual work the user had to do:
Infer that the file itself is empty or invalid.

### 10 - Truncated Concrete JPEG

What v1 did:
Failed with `Load failedThe source image could not be decoded.`

What it should have done:
Identify likely partial/corrupt image transfer, keep any previous successful result intact, and offer a retry/reselect next step.

Why it failed:
The app only knows that `createImageBitmap` rejected. It does not inspect file signatures, byte length, or partial JPEG markers.

Failure mode:
Obvious failure, but generic.

Manual work the user had to do:
Guess whether the problem is file type, corruption, browser support, or app bug.

## Top 5 Logic Gaps

1. The app treats every decodable image as a valid material source. It does not detect material category, flatness, scene scale, perspective, or whether the subject is appropriate for a seamless PBR texture.
2. Height and roughness inference are luminance-driven without separating lighting, shadow, pigment, or albedo variation from actual surface relief.
3. There is no confidence model. Outputs that are speculative look identical to outputs that are likely correct.
4. Input boundary validation is too late and too generic. Empty, corrupt, mislabeled, huge, and partial files are not classified in domain terms.
5. Exports lack provenance. A downstream user cannot tell source dimensions, downsampling, settings, app version, confidence, warnings, or why a map was generated the way it was.

## Top 3 Intuition Failures

1. The app exports maps for questionable inputs without warning, so users may trust bad height/roughness maps.
2. Large images silently downsample and output non-square maps without explaining the tradeoff.
3. Broken inputs fail with a generic decode message instead of saying what is wrong and what to do next.

## Top 3 "Feels Stupid" Moments

1. The user has to know whether a photo is a usable flat texture sample; the app should make the first call.
2. The user has to recognize lighting gradients and shadows that the app is turning into fake geometry.
3. The user has to manually tune settings that should be inferred from material type and image statistics.

## What "Smart" Means For Substance Sampler

1. On first upload, the app classifies the material class and source quality: wood, brick/masonry, concrete, fabric, rust/metal, tile/grid, rock/aggregate, or low-confidence/unsuitable.
2. The app produces a first-pass map set with per-map confidence and visible warnings for lighting gradients, perspective, non-square output, low detail, corrupt/empty files, and seam risk.
3. The app chooses sensible defaults from the image itself: output size/aspect recommendation, detail/normal strength, tile handling, and whether height should trust luminance.
4. The app never exports silent guesses. Exported artifacts carry source metadata, settings, warnings, confidence, and a deterministic generation fingerprint.
5. Every failure explains what failed, why it likely failed in texture terms, and what the user should try next.

## Phase 2 Substance Success Metrics

- Real-data primary-flow pass rate: at least 7 of these 10 inputs produce a useful first guess with no manual tuning.
- No silent wrongness: 10 of 10 inputs surface confidence or warnings when confidence is low.
- Determinism: re-running each input with the same settings produces byte-identical maps and metadata.
- Input validation: empty, truncated, and mislabeled files receive distinct, actionable messages.
- Performance honesty: any operation over 300 ms shows progress details; any operation over 5 seconds is cancellable.
- Metadata completeness: every export includes source identifier, original dimensions, normalized dimensions, settings, app version, schema version, generation fingerprint, warnings, and per-map confidence.
- Median time from upload to useful preview on the fixture set stays under 1 second after image decode on a modern desktop browser.

## Explicitly Out Of Scope For This Phase

- No new major UI surfaces beyond confidence, warnings, debug/inspection, and inline corrections required by the same workflow.
- No backend, auth, cloud processing, or architecture mode change.
- No visual polish pass, theme work, command palette, landing page, social cards, or marketing work.
- No node-graph editor, procedural material system, asset library, or team/project sync.
- No bundled large Real-ESRGAN or libigl native/WASM payload unless a later confirmed Phase 2 plan explicitly prioritizes it within the same static Mode A constraints.
