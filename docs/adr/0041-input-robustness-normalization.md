# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Users upload images with wrong extensions, empty files, huge dimensions, partial transfers, and browser-specific decode behavior.

## Decision

Validate image files at the boundary before decode:

- Detect empty files.
- Detect supported byte signatures for JPEG, PNG, and WebP.
- Compare extension, MIME, and byte signature.
- Identify likely truncated JPEGs by missing end-of-image markers.
- Define a huge-input budget and surface downsampling facts.

Byte signature is authoritative. Extension and MIME are advisory.

## Consequences

- Mislabeled but decodable files can proceed with a warning.
- Empty and partial files fail before processing with actionable next steps.
- The app can explain what was normalized.

## Alternatives Considered

- Trust browser decode alone: rejected because the error is too generic.
