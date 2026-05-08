# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Artists may want the app to remember the last project locally, but v1 should not require an account or server state.

## Decision

Use IndexedDB for optional local project snapshots and `localStorage` only for tiny UI preferences. Use OPFS later only if large multi-file project persistence becomes a core workflow.

## Consequences

- User images and generated maps stay on the user's device.
- No server storage or backup process is required.
- Clearing browser storage removes saved local projects.

## Alternatives Considered

- Server persistence: rejected by ADR 0001.
- Only `localStorage`: rejected because texture data can exceed practical string storage limits.
