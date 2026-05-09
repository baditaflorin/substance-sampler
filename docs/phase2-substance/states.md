# Phase 2 Substance State Taxonomy

Date: 2026-05-09

This document enumerates the reachable app states after the Phase 2 substance pass.

| State                                  | Trigger                                             | User-visible behavior                                                                      | Exit path                                                                       |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `idle-empty`                           | App opens with no source.                           | Empty stage says maps will render after upload.                                            | Drop or browse for an image.                                                    |
| `validating-source`                    | User selects or drops a file.                       | Status says `Validating source`.                                                           | Valid file moves to loading; invalid file moves to recoverable error.           |
| `recoverable-error-empty-file`         | Zero-byte input.                                    | Error code `empty-file` with what/why/next step.                                           | Choose another file; previous maps stay intact if present.                      |
| `recoverable-error-unsupported-format` | Byte signature is not PNG/JPEG/WebP.                | Error code `unsupported-format`.                                                           | Export as PNG/JPEG/WebP and upload again.                                       |
| `recoverable-error-truncated-jpeg`     | JPEG starts correctly but lacks an end marker.      | Error code `truncated-jpeg`.                                                               | Re-download or re-export the file.                                              |
| `recoverable-error-decode-failed`      | Browser cannot decode a validated source.           | Error code `decode-failed`.                                                                | Re-export source or choose another file.                                        |
| `loading-photo`                        | Boundary validation passed.                         | Status says `Loading photo`.                                                               | Decode succeeds and enters processing; decode failure enters recoverable error. |
| `processing`                           | Worker job starts.                                  | Status says `Processing maps`; busy indicator shows; Cancel appears.                       | Worker finishes, fails, or user cancels.                                        |
| `cancelled-empty`                      | User cancels before any maps exist.                 | Status says `Cancelled`.                                                                   | Upload or regenerate after choosing a source.                                   |
| `cancelled-with-result`                | User cancels while previous maps exist.             | Status says `Cancelled. Previous maps kept.`                                               | Regenerate or upload a new source.                                              |
| `ready-with-warnings`                  | Processing succeeds and analysis found warnings.    | Maps, preview, material, confidence, and warnings are visible.                             | Adjust controls, regenerate, export, upload another source.                     |
| `ready-no-warnings`                    | Processing succeeds and analysis found no warnings. | Maps, preview, material, and confidence are visible.                                       | Adjust controls, regenerate, export, upload another source.                     |
| `processing-failed`                    | Worker throws or terminates unexpectedly.           | Error code `processing-failed`; previous maps stay if available.                           | Try lower output size, smaller crop, regenerate, or upload another file.        |
| `debug-visible`                        | URL has `?debug=1`.                                 | Internal report, analysis, metadata, confidence, and performance fields render below maps. | Remove query parameter or continue using app normally.                          |

State machine invariants:

- Every state has at least one user-actionable exit.
- A newer worker job supersedes older jobs; stale worker responses are ignored.
- Cancel terminates the active worker and preserves the last complete result.
- Boundary validation happens before browser image decode.
- User-owned settings are preserved for the session; recommendations only fill settings the user has not touched.
