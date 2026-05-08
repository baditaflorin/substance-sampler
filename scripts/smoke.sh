#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run build

mkdir -p tmp
npx vite preview --host 127.0.0.1 --port 4173 >tmp/pages-preview.log 2>&1 &
SERVER_PID="$!"

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:4173/substance-sampler/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

curl -fsS "http://127.0.0.1:4173/substance-sampler/" >/dev/null
npx playwright test --config=playwright.config.ts
