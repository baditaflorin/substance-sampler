# 0066 - Error Handling Convention

## Status

Accepted

## Context

Phase 2 established `UserFacingError` for domain errors.

## Decision

All user-reachable failures return or set `UserFacingError` with `what`, `why`, and `nextStep`. Programmatic errors may throw internally, but UI boundaries translate them before display.

## Consequences

- URL, clipboard, import, storage, and decode failures use the same language shape.
- Tests assert error codes instead of brittle full strings.

## Alternatives Considered

- Toast-only errors: rejected because the app already has an accessible status strip.
