# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C deployment topology would include Docker Compose, nginx, TLS, metrics, and a backend API. ADR 0001 selected Mode A.

## Decision

Use GitHub Pages only:

- Source and built artifact live in the same public repository.
- GitHub Pages serves `docs/`.
- No server, Docker image, nginx config, or Prometheus stack is deployed.

## Consequences

- Operational burden is close to zero.
- Runtime browser compatibility becomes the main deployment risk.

## Alternatives Considered

- Pages frontend plus Docker backend: rejected until a feature needs server-side secrets or shared writes.
