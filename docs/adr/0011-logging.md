# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console output can still help development but should stay quiet in production.

## Decision

Use minimal browser console output in production. User-facing errors appear in the app's toast/status area. Development-only diagnostics are guarded by `import.meta.env.DEV`.

## Consequences

- Production users are not flooded with console noise.
- Errors remain visible in the UI.

## Alternatives Considered

- Client log collection service: rejected for privacy and simplicity.
