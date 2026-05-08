# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B requires a scheduled or offline data-generation pipeline. Substance Sampler v1 is Mode A and does not consume shared datasets.

## Decision

No Mode B data-generation pipeline is included in v1. The only generation script writes release metadata for the static site.

## Consequences

- No `make data` target is required beyond a no-op explaining Mode A.
- No GitHub Release data artifacts are required.

## Alternatives Considered

- Pre-building sample material packs: deferred because user-imported photos are the v1 center.
