# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL must work from day one. GitHub Pages can serve from the `main` branch `/docs` folder without GitHub Actions.

## Decision

Publish from `main` branch `/docs`. `make build` generates the production Vite output directly into `docs/`. The `.gitignore` ignores `dist/` but does not ignore `docs/`.

The Vite base path is `/substance-sampler/`. The build emits hashed assets and a `404.html` SPA fallback.

Live site: https://baditaflorin.github.io/substance-sampler/

## Consequences

- Publishing is a normal git commit and push.
- Rollback is a normal git revert of the publishing commit.
- GitHub Pages-specific redirects and headers are unavailable, so routing uses a `404.html` fallback.

## Alternatives Considered

- `gh-pages` branch: rejected because it splits source and published artifact history.
- GitHub Actions deployment: rejected by the no-Actions constraint.
