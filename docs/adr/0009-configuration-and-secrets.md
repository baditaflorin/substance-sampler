# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

Mode A must not put secrets in the frontend. Configuration should be transparent and reproducible.

## Decision

Use build-time public Vite variables only. `.env.example` documents the base path. The app uses no API keys, tokens, passwords, or private endpoints.

## Consequences

- No secrets are needed to run, build, or deploy v1.
- Secret scanning still runs in local hooks where tooling is available.
- Any future secret-backed flow must move to an offline generator or a separately justified Mode C backend.

## Alternatives Considered

- Obfuscated frontend keys: rejected because frontend secrets are not secrets.
