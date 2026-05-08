# 0016 - Local Git Hooks

## Status

Accepted

## Context

No GitHub Actions are allowed, so local hooks must guard commits and pushes.

## Decision

Use plain `.githooks/` scripts wired by `make install-hooks`.

- `pre-commit`: format check, lint, TypeScript check, tests, and `gitleaks protect --staged` when installed.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.
- `post-merge` and `post-checkout`: dependency hints only; no generated code is required.

## Consequences

- Hooks work without another hook manager dependency.
- Developers need to install optional tools such as `gitleaks` locally for the strongest checks.

## Alternatives Considered

- Lefthook: viable, but plain hooks are enough for this small Mode A app.
