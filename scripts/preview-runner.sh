#!/usr/bin/env bash
set -euo pipefail

preview_repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

preview_free_port() {
  node -e "const net=require('node:net');const server=net.createServer();server.listen(0,'127.0.0.1',()=>{console.log(server.address().port);server.close();});"
}

run_preview_tests() {
  local port_env_name="$1"
  local log_file="$2"
  shift 2

  local root
  root="$(preview_repo_root)"
  cd "$root"

  npm run build

  mkdir -p tmp
  local env_port="${!port_env_name:-}"
  local port="${env_port:-$(preview_free_port)}"
  npx vite preview --host 127.0.0.1 --port "$port" --strictPort >"$log_file" 2>&1 &
  local server_pid="$!"

  cleanup() {
    kill "$server_pid" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  for _ in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:$port/substance-sampler/" >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
  done

  curl -fsS "http://127.0.0.1:$port/substance-sampler/" >/dev/null
  PLAYWRIGHT_BASE_URL="http://127.0.0.1:$port" npx playwright test --config=playwright.config.ts "$@"
}
