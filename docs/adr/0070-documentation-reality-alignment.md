# 0070 - Documentation Reality Alignment Process

## Status

Accepted

## Context

README claims must stay true as the app grows.

## Decision

README feature bullets map to e2e or unit coverage. Claims not covered by tests are either removed, qualified in limitations, or added to the test suite in the same release.

## Consequences

- Documentation drift is treated as a product bug.
- Limitations are explicit, especially Mode A static/CORS and unavailable model payloads.

## Alternatives Considered

- Keeping aspirational roadmap claims in README: rejected because users need current truth.
