# 0048 - Determinism And Reproducibility

## Status

Accepted

## Context

Texture exports should be reproducible for build pipelines and artists comparing changes.

## Decision

Map generation is deterministic for identical ImageData and settings. Export metadata includes schema version, app version, source fingerprint, settings, analysis, warnings, confidence, and map fingerprints. Dynamic timestamps are recorded separately from deterministic fingerprints.

## Consequences

- Fixture tests can compare stable fingerprints.
- Exports are inspectable and rerunnable even if download time differs.

## Alternatives Considered

- Timestamp-only provenance: rejected because it does not make outputs reproducible.
