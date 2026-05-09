# 0061 - Input Pathway Coverage Policy

## Status

Accepted

## Context

Users bring texture sources through more than a desktop file picker.

## Decision

Support browse, drag/drop, native paste, explicit clipboard read where permitted, CORS-readable URL import, generated sample, multi-file queue, project state import, settings share links, and last-project restore. Directory import remains out of scope.

## Consequences

- Every input path routes through the same file validation and source-loading boundary.
- URL imports fail honestly when CORS blocks browser access.
- Multi-file input is a queue, not a batch exporter.

## Alternatives Considered

- Backend URL proxy: rejected because Mode A static deployment remains non-negotiable.
