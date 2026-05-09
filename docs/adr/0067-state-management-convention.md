# 0067 - State Management Convention

## Status

Accepted

## Context

The app has local UI state, persisted settings, worker jobs, and exportable project state.

## Decision

Keep React local state for current session workflow. Persist canonical settings, geometry, and last source through `lib/storage`. Export/import project state through a versioned schema. Worker jobs remain latest-wins.

## Consequences

- No global state library is needed.
- Every persisted shape is validated before use.

## Alternatives Considered

- Storing generated maps in IndexedDB: rejected because maps are reproducible from source/settings and would multiply storage usage.
