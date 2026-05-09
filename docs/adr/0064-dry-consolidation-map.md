# 0064 - DRY Consolidation Map

## Status

Accepted

## Context

Audit found duplicated preview-server shell logic and source-loading logic in UI.

## Decision

Consolidate preview server behavior into a shared shell helper used by smoke and real-data scripts. Move source decoding and project state helpers out of `App.tsx` into library modules.

## Consequences

- Test scripts change in one place when preview startup changes.
- UI code becomes mostly orchestration/rendering.

## Alternatives Considered

- Over-abstracting test PNG generation: deferred because the duplication is test-only and low-risk.
