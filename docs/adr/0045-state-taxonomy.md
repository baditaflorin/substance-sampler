# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

V1 has basic ready/loading/failed states but no explicit taxonomy for cancelled, stale, validating, analyzing, or recoverable failures.

## Decision

Document and implement these states: idle, validating, loading, analyzing, processing, ready, recoverable-error, fatal-error, cancelled, and stale-result-ignored. Every state has a user-actionable exit.

## Consequences

- Cancellation and double-click behavior are defined.
- UI status text maps to intentional states.

## Alternatives Considered

- Ad hoc booleans only: rejected because they already hide edge cases.
