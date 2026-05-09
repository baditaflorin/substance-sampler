# 0047 - Error Taxonomy And Messaging

## Status

Accepted

## Context

V1 reports empty and corrupt files as generic decode failures.

## Decision

Every user-facing error includes:

- What failed.
- Why it likely failed in texture/domain terms.
- What to do next.

Classify errors as recoverable or fatal. Recoverable errors preserve prior successful output.

## Consequences

- Empty and partial uploads no longer feel like app bugs.
- Error tests assert message IDs rather than brittle full strings.

## Alternatives Considered

- Surface raw exception messages: rejected.
