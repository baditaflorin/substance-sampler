# Phase 3 Controls Audit

Date: 2026-05-09

Scope: v0.2.0 at commit `496b294`.

| Control                 | Status before   | Evidence                                                       | Decision                                        |
| ----------------------- | --------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Browse                  | Works fully     | Opens file picker and processes selected image.                | Keep.                                           |
| Drop zone               | Works partially | Processes only first dropped file.                             | Finish batch behavior.                          |
| Size                    | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| Tile                    | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| Normal                  | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| Height                  | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| Rough                   | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| Detail                  | Works partially | Changes state but persists only after regenerate.              | Persist immediately.                            |
| WebGPU                  | Works partially | Toggles processing preference; persists only after regenerate. | Persist immediately and keep fallback behavior. |
| Upscale                 | Works partially | Performs 2x scaling, but label is vague.                       | Rename to export scale.                         |
| Regenerate              | Works fully     | Reprocesses active source.                                     | Keep and test.                                  |
| Cancel                  | Works fully     | Terminates active worker and keeps previous result.            | Keep and test.                                  |
| Preview geometry        | Works partially | Changes preview geometry but does not persist.                 | Persist.                                        |
| Download ZIP            | Works fully     | Downloads ZIP when maps exist.                                 | Keep and test.                                  |
| Individual map download | Works fully     | Downloads PNG map.                                             | Keep and test.                                  |
| GitHub link             | Works fully     | Correct repo URL.                                              | Keep.                                           |
| PayPal link             | Works fully     | Correct PayPal URL.                                            | Keep.                                           |
| Debug overlay           | Works fully     | `?debug=1` renders internal state.                             | Keep.                                           |

Before counts:

- Green: 8
- Yellow: 10
- Red: 0

Success target:

- Every visible production control either completes its label end-to-end or is renamed to match behavior.

## After Implementation

| Control                 | Status after | Evidence                                          |
| ----------------------- | ------------ | ------------------------------------------------- |
| Browse                  | Works fully  | Smoke and real-data tests.                        |
| Drop zone               | Works fully  | Shared multi-file queue.                          |
| Load sample             | Works fully  | Completeness e2e.                                 |
| Paste image             | Works fully  | Clipboard e2e plus fallback errors.               |
| URL field and Load URL  | Works fully  | CORS-readable and invalid URL e2e.                |
| Size                    | Works fully  | Persists before regenerate; e2e reload assertion. |
| Tile                    | Works fully  | Shared settings persistence path.                 |
| Normal                  | Works fully  | Shared settings persistence path.                 |
| Height                  | Works fully  | Shared settings persistence path.                 |
| Rough                   | Works fully  | Shared settings persistence path.                 |
| Detail                  | Works fully  | Shared settings persistence path.                 |
| WebGPU                  | Works fully  | Preference persists; CPU fallback remains.        |
| Export scale            | Works fully  | Renamed from Upscale; output scaling still works. |
| Regenerate              | Works fully  | Smoke path.                                       |
| Cancel                  | Works fully  | Existing latest-wins worker behavior retained.    |
| Preview geometry        | Works fully  | Settings-link e2e checks plane state.             |
| Download ZIP            | Works fully  | Smoke path.                                       |
| Metadata                | Works fully  | Direct JSON download.                             |
| Copy metadata           | Works fully  | Completeness e2e.                                 |
| Save project            | Works fully  | Completeness e2e.                                 |
| Import project          | Works fully  | Completeness e2e.                                 |
| Copy settings link      | Works fully  | Completeness e2e.                                 |
| Start fresh             | Works fully  | Completeness e2e.                                 |
| Individual map download | Works fully  | Existing map buttons retained.                    |
| GitHub link             | Works fully  | Smoke path.                                       |
| PayPal link             | Works fully  | Smoke path.                                       |
| Debug overlay           | Works fully  | Kept behind `?debug=1`.                           |

After counts:

- Green: 27
- Yellow: 0
- Red: 0
