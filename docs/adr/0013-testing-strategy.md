# 0013 - Testing Strategy

## Status

Accepted

## Context

The project needs fast local checks because GitHub Actions are not used.

## Decision

Use Vitest for unit tests, TypeScript checking for static validation, ESLint and Prettier for lint/format checks, and Playwright for one smoke-level happy path against a static preview server.

Targets:

- `make test`: unit tests.
- `make lint`: ESLint, Prettier check, TypeScript check.
- `make build`: production Pages artifact.
- `make smoke`: build, serve `docs/`, run Playwright happy path.

## Consequences

- Checks are local and hook-friendly.
- The critical flow of upload, process, preview, and export is covered.

## Alternatives Considered

- Browser-only manual QA: rejected because regressions would be easy.
