#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/preview-runner.sh"

run_preview_tests SMOKE_PORT tmp/pages-preview.log
