# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap includes Go backend guidance for Mode B and Mode C. ADR 0001 selected Mode A.

## Decision

Skip the Go backend entirely in v1.

## Consequences

- No `cmd/`, `internal/`, `pkg/`, `api/`, Dockerfile, migrations, or Go module are created.
- Backend-specific hooks and checks are not installed.

## Alternatives Considered

- Add an empty Go layout for future use: rejected because it creates false maintenance surface.
