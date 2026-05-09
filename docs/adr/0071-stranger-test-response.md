# 0071 - Stranger Test Findings And Response

## Status

Accepted

## Context

Phase 3 requires a cold run as a stranger with real data.

## Decision

Run the stranger test in a fresh browser context against the built Pages preview. Record findings in `docs/phase3/stranger-test.md`. Fix the top three issues before release.

## Consequences

- The postmortem includes what was still confusing.
- Automated smoke paths cover the fixed issues where possible.

## Alternatives Considered

- Relying only on existing smoke tests: rejected because smoke tests are too familiar with the app.
