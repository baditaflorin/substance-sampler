# 0042 - Inference Engine

## Status

Accepted

## Context

V1 applies the same defaults to every material and does not infer source quality.

## Decision

Add a deterministic image-analysis engine that computes luminance distribution, color variance, saturation/chroma dominance, detail energy, dominant direction, seam mismatch, low-frequency gradient, and grid likelihood. It classifies source shape into wood, brick/masonry, concrete, fabric, rust/metal, tile/grid, rock/aggregate, unknown, or unsuitable.

## Consequences

- New uploads receive a useful first guess.
- Classification stays heuristic and explainable.
- The engine is deterministic and testable against fixture contracts.

## Alternatives Considered

- Machine-learning model classification: deferred because large model payloads conflict with Mode A constraints.
