# 0043 - Domain Vocabulary And UI Language

## Status

Accepted

## Context

Users think in texture terms: seam, lighting, material, height, roughness, albedo, source photo, and export. V1 exposes generic processing failures.

## Decision

Use material-author vocabulary in warnings, errors, status, and export metadata. Avoid implementation terms unless `?debug=1` is enabled.

## Consequences

- Errors become easier to act on.
- Debug details remain available without making the default UI feel technical.

## Alternatives Considered

- Keep generic browser/API wording: rejected because it forces users to diagnose developer-level failures.
