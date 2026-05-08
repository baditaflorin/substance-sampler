# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs TypeScript, fast local iteration, static output for GitHub Pages, and a small enough payload for first load.

## Decision

Use Vite, React, TypeScript strict mode, Vitest, ESLint, Prettier, and Playwright. Styling is plain CSS with CSS variables to avoid a heavy runtime. Three.js is dynamically imported only when the preview mounts.

## Consequences

- Builds are fast and emit hashed assets suitable for Pages.
- React keeps interactive state predictable.
- Avoiding a CSS framework keeps the initial bundle smaller.

## Alternatives Considered

- Vanilla TypeScript: smallest runtime, but slower to build the complete interactive UI.
- Next.js/Astro: unnecessary because the app is a static client tool with no content pipeline.
