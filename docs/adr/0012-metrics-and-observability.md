# 0012 - Metrics And Observability

## Status

Accepted

## Context

Mode A has no server-side metrics. The bootstrap default for Mode A/B is no analytics unless usage insight is important enough to justify it.

## Decision

Ship with no analytics in v1. Browser performance can be profiled locally by maintainers during development.

## Consequences

- No tracking scripts, cookies, PII, or telemetry endpoints are included.
- Adoption metrics come from GitHub stars, forks, issues, and user feedback.

## Alternatives Considered

- Plausible analytics: deferred until there is an explicit privacy policy update and opt-in rationale.
