# 0048 - Determinism And Reproducibility

## Status

Accepted

## Context

Texture exports should be reproducible for build pipelines and artists comparing changes.

## Decision

Map generation is deterministic for identical ImageData and settings. Export metadata includes schema version, app version, source fingerprint, settings, analysis, warnings, confidence, map fingerprints, and a deterministic `generationFingerprint` computed from the stable metadata fields. Dynamic timestamps are recorded separately from deterministic fingerprints.

## Consequences

- Fixture tests can compare stable fingerprints.
- Exports are inspectable and rerunnable even if download time differs.
- The ZIP container uses a fixed internal mtime so archive metadata does not add avoidable drift.

## Alternatives Considered

- Timestamp-only provenance: rejected because it does not make outputs reproducible.
