# 0040 - Real-Data Audit Findings And Substance Success Metrics

## Status

Accepted

## Context

The v1 audit showed that Substance Sampler technically completes 8 of 10 uploads but only produces a domain-useful first guess for roughly 3 of 10. The main issue is wrong-but-confident output.

## Decision

Use the 10 real-data audit inputs as the Phase 2 grading rubric. Substance success is measured by fixture pass rate, confidence/warning coverage, deterministic map fingerprints, actionable error messages, and export provenance.

## Consequences

- Fixture regressions block Phase 2 work.
- A technically successful export can still fail the fixture contract if it hides low confidence.
- The postmortem reports before/after pass rates per fixture.

## Alternatives Considered

- Keep relying on the demo image: rejected because it misses the actual product risk.
- Add only synthetic tests: rejected because Phase 2 requires real inputs.
