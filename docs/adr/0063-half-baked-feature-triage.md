# 0063 - Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

Phase 3 found several features that exist but feel incomplete.

## Decision

Finish:

- Local settings persistence: save immediately, validate on read.
- Drag/drop: support multi-file queue.
- Metadata export: add direct copy/download.
- Offline-friendly restore: persist and restore last project.

Rename:

- `Upscale` becomes `Export scale` because it is deterministic scaling, not AI super-resolution.

Keep hidden/limited:

- Debug overlay remains behind `?debug=1`.

Delete:

- Unused `fileInputRef`.

## Consequences

- Users see fewer vague controls.
- Public docs stay honest about unavailable Real-ESRGAN/libigl/scikit-image payloads.

## Alternatives Considered

- Removing export scale entirely: rejected because it is useful and already works.
