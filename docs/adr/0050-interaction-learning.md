# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

If users change inferred settings, similar processing in the same session should respect that choice without feeling mysterious.

## Decision

Track user-owned settings in the current session. New uploads receive inferred defaults only for settings the user has not explicitly changed. Persist the resulting settings locally as before.

## Consequences

- The first upload feels smart.
- Later uploads respect user corrections.

## Alternatives Considered

- Always overwrite settings on upload: rejected because it fights expert users.
