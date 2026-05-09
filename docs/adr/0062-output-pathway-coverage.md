# 0062 - Output Pathway Coverage Policy

## Status

Accepted

## Context

Maps are useful only if users can move the work into engines, teammates' machines, or later sessions.

## Decision

Keep individual PNG and ZIP export. Add direct metadata copy/download, versioned project state export/import, and a settings-only share link. Print/PDF, embed code, and API/curl output remain out of scope for a static texture tool.

## Consequences

- Project state becomes the canonical round-trip format.
- ZIP stays map-focused; state export is separate and explicit.

## Alternatives Considered

- Encoding source images into URLs: rejected because real photos exceed practical URL limits.
