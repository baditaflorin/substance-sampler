# 0068 - Persistence Schema And Migration Policy

## Status

Accepted

## Context

v0.2.0 persisted raw settings without validation or migration.

## Decision

Use versioned zod schemas for stored settings and project state. Current schema version is `substance-sampler-project-v1`. Unknown versions are recoverable import errors. Missing old fields receive defaults where safe.

## Consequences

- Bad IndexedDB data does not crash startup.
- Project files have a future-compatible boundary.

## Alternatives Considered

- Trusting IndexedDB values: rejected because stale local data is external input.
