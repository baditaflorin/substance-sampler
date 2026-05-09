# 0069 - Type Safety Policy At Boundaries

## Status

Accepted

## Context

Phase 3 adds JSON project import, URL hash parsing, and stored state.

## Decision

External JSON, URL hash payloads, and IndexedDB values are parsed as `unknown` and validated with zod before becoming domain types. Source `any` and `@ts-ignore` remain disallowed.

## Consequences

- Type narrowing lives at boundaries.
- Internal code can rely on typed project/session values.

## Alternatives Considered

- Type assertions for imported JSON: rejected as unsafe for user-provided files.
