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
