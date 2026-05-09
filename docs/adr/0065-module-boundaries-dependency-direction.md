# 0065 - Module Boundaries And Dependency Direction

## Status

Accepted

## Context

`App.tsx` had become a workflow module and UI module at the same time.

## Decision

Use this dependency direction: UI components -> feature/client helpers -> lib/domain helpers -> primitives. `lib/input`, `lib/project`, `lib/storage`, and `lib/image` must not import React UI.

## Consequences

- Source decoding, project serialization, and storage validation can be unit-tested without React.
- UI owns presentation and high-level workflow only.

## Alternatives Considered

- Introducing a full application service layer: rejected as heavier than this app needs.
