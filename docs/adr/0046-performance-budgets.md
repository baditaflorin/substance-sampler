# 0046 - Performance Budgets And Measurement Plan

## Status

Accepted

## Context

Real inputs include 10 MB to 12 MB source files. Users need honest feedback when work takes time.

## Decision

Budgets:

- Boundary validation under 50 ms for normal images.
- Analysis under 250 ms after decode for 1024 px derived data.
- Processing under 1.5 s median after decode on the fixture set.
- Show progress details after 300 ms.
- Make processing cancellable.

Measure fixture timings in `docs/perf/phase2-fixtures.md`.

## Consequences

- Performance regressions become visible.
- Huge inputs are handled through downsampling plus warnings, not silent delay.

## Alternatives Considered

- Optimize only after complaints: rejected because real-data size was already an audit issue.
