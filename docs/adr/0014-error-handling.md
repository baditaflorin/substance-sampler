# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Image processing can fail because of unsupported browser APIs, huge images, corrupted files, or export restrictions.

## Decision

Represent expected failures with typed `Result` objects or thrown `Error` instances at module boundaries. The UI catches failures, shows a clear message, and keeps the previous successful state where possible.

## Consequences

- Users get recoverable errors instead of blank screens.
- Unit tests can assert specific failure messages.

## Alternatives Considered

- Silent fallback for every failure: rejected because artists need to know when output quality changed.
