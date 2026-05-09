# Phase 2 Real-Data Performance

Date: 2026-05-09

Command:
`npm run test:realdata`

Environment:
Local Playwright Chromium against a Vite preview of the GitHub Pages build.

The fixture duration includes page load, file upload, browser image decode, worker processing, and UI assertions.

| Fixture              | Duration |
| -------------------- | -------: |
| 01 brick wall        |    3.1 s |
| 02 wood planks       |    1.6 s |
| 03 textured concrete |    2.8 s |
| 04 rock texture      |    1.9 s |
| 05 orange fabric     |    1.8 s |
| 06 red rust          |    1.8 s |
| 07 floor tile        |    3.1 s |
| 08 mislabeled wood   |    1.9 s |
| 09 empty upload      |  0.201 s |
| 10 truncated JPEG    |  0.191 s |

Summary:

- Median fixture duration: 1.85 s.
- p95 fixture duration: 3.1 s.
- Worst fixture duration: 3.1 s on the huge brick source and square tile source.
- Full real-data suite: 10 passed in 19.2 s.
- Full smoke suite: 12 passed in 25.1 s.

Observed hot paths:

1. Browser decode and downsample for huge JPEGs.
2. CPU map kernels for height, normal, roughness, and AO.
3. WebGL material preview initialization.

Phase 2 mitigations:

- Empty, unsupported, and truncated files fail before decode.
- Sources larger than the browser working budget are downsampled intentionally and warned about.
- Processing runs in a worker; the UI remains responsive and the active job is cancellable.
- `?debug=1` exposes elapsed, analysis, and processing timings for fixture triage.
