# 0044 - Confidence Model

## Status

Accepted

## Context

Wrong-but-confident exports are the biggest v1 failure mode.

## Decision

Represent confidence as a 0 to 1 score with `low`, `medium`, or `high` labels. Track source confidence, material confidence, and per-map confidence. Warnings reduce confidence deterministically.

## Consequences

- Low-confidence maps can still be exported, but the UI and metadata say so.
- Fixture tests can assert expected warning IDs and confidence ceilings/floors.

## Alternatives Considered

- Boolean valid/invalid: rejected because real texture quality is graded, not binary.
