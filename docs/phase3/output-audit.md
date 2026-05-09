# Phase 3 Output Pathway Audit

Date: 2026-05-09

Scope: v0.2.0 at commit `496b294`.

| Output pathway               | Status before   | Evidence                                     | Decision                                         |
| ---------------------------- | --------------- | -------------------------------------------- | ------------------------------------------------ |
| Download individual PNG maps | Works fully     | Each map tile has a download button.         | Keep and test.                                   |
| Download ZIP                 | Works fully     | ZIP includes maps and metadata JSON.         | Keep and test.                                   |
| JSON metadata export         | Works partially | Metadata exists only inside ZIP.             | Add copy/download direct metadata actions.       |
| Copy-to-clipboard            | Not built       | No clipboard output handlers.                | Build metadata copy.                             |
| Downloadable project state   | Not built       | No state file format.                        | Build versioned `.json` state export.            |
| Import exported state        | Not built       | No import path.                              | Build round-trip import.                         |
| Shareable URL                | Not built       | No hash export/import.                       | Build settings-only link with documented limits. |
| Print/PDF                    | Not built       | Not claimed and not useful for texture maps. | Permanently out of scope in ADR 0062.            |
| Embed code                   | Not built       | Not claimed.                                 | Out of scope.                                    |
| API/curl output              | Not built       | Static client app; no runtime API.           | Out of scope.                                    |

Before counts:

- Green: 2
- Yellow: 1
- Red: 4
- Out of scope: 3

Success target:

- Green all app-relevant export rows; keep print/embed/API explicitly out of scope.

## After Implementation

| Output pathway               | Status after             | Evidence                                                        |
| ---------------------------- | ------------------------ | --------------------------------------------------------------- |
| Download individual PNG maps | Works fully              | Smoke test reads generated map canvas; existing buttons remain. |
| Download ZIP                 | Works fully              | Smoke test enables ZIP after processing.                        |
| JSON metadata export         | Works fully              | Direct metadata download button plus ZIP metadata.              |
| Copy-to-clipboard            | Works fully              | `e2e/completeness.spec.ts` verifies metadata copy confirmation. |
| Downloadable project state   | Works fully              | Project JSON download e2e path passes.                          |
| Import exported state        | Works fully              | Exported project is imported and reprocessed in e2e.            |
| Shareable URL                | Works fully for settings | Settings link e2e path passes; image data excluded by design.   |
| Print/PDF                    | Out of scope             | ADR 0062.                                                       |
| Embed code                   | Out of scope             | ADR 0062.                                                       |
| API/curl output              | Out of scope             | ADR 0062; Mode A has no runtime API.                            |

After counts:

- Green: 7
- Yellow: 0
- Red: 0
- Out of scope: 3
