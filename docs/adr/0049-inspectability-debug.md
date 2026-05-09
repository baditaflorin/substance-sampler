# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and maintainers need to see why the app classified an input or reduced confidence.

## Decision

`?debug=1` enables a compact debug panel showing input validation, analysis metrics, warnings, confidence, timings, and source/map fingerprints.

## Consequences

- Support and fixture debugging improve without making the default UI noisy.
- Debug output is read-only.

## Alternatives Considered

- Console-only diagnostics: rejected because production console output is intentionally quiet.
