# Phase 3 Input Pathway Audit

Date: 2026-05-09

Scope: v0.2.0 at commit `496b294`.

| Input pathway                 | Status before   | Evidence                                                         | Decision                                                         |
| ----------------------------- | --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Browse file picker            | Works fully     | `<input type="file">` accepts PNG/JPEG/WebP and validates bytes. | Keep and test.                                                   |
| Drag and drop                 | Works partially | Drop handler reads only the first file.                          | Finish multi-file handling.                                      |
| Paste image from clipboard    | Not built       | No `paste` listener or clipboard button.                         | Build.                                                           |
| Clipboard permission fallback | Not built       | No Clipboard API handling.                                       | Build a paste fallback that works with native paste.             |
| URL input                     | Not built       | No URL field; CORS failure guidance absent.                      | Build CORS-aware URL import with honest errors.                  |
| Multi-file input              | Not built       | File input lacks `multiple`; no per-file status.                 | Build simple batch queue with partial success/error rows.        |
| Folder input                  | Not built       | No directory picker claim.                                       | Out of scope for static v0.3.0.                                  |
| Mobile picker                 | Works partially | Browser file picker works; no camera hint.                       | Add `capture` hint and document phone testing limits.            |
| Sample/demo source            | Not built       | E2E has generated sample, but app UI does not.                   | Build first-class generated sample loader.                       |
| Deep links                    | Not built       | No hash parsing.                                                 | Build settings-only share links; source images are too large.    |
| Imported state                | Not built       | No project-state input.                                          | Build versioned state import.                                    |
| Restored autosave             | Works partially | Only settings persist, and only after processing.                | Persist current project/settings immediately and restore source. |

Before counts:

- Green: 1
- Yellow: 3
- Red: 7
- Out of scope: 1

Success target:

- Green all rows except folder input, which remains explicitly out of scope.

## After Implementation

| Input pathway                 | Status after                      | Evidence                                                                  |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Browse file picker            | Works fully                       | `e2e/smoke.spec.ts`, `e2e/realdata.spec.ts`.                              |
| Drag and drop                 | Works fully                       | Shared `loadFiles` queue handles all dropped files.                       |
| Paste image from clipboard    | Works fully                       | `e2e/completeness.spec.ts` dispatches image paste and verifies maps.      |
| Clipboard permission fallback | Works fully                       | Paste button uses Clipboard API and gives actionable permission errors.   |
| URL input                     | Works fully                       | CORS-readable URL test passes; blocked/invalid URLs show domain errors.   |
| Multi-file input              | Works fully                       | Partial success/error queue covered in e2e.                               |
| Folder input                  | Out of scope                      | ADR 0061 keeps directory import out of v0.3.0.                            |
| Mobile picker                 | Works fully within browser limits | File input keeps browser picker and adds camera capture hint.             |
| Sample/demo source            | Works fully                       | `Load sample` e2e path passes.                                            |
| Deep links                    | Works fully for settings          | Settings hash link e2e path passes; source images intentionally excluded. |
| Imported state                | Works fully                       | Project JSON import/export e2e path passes.                               |
| Restored autosave             | Works fully                       | Last project/settings restore through versioned IndexedDB state.          |

After counts:

- Green: 11
- Yellow: 0
- Red: 0
- Out of scope: 1
