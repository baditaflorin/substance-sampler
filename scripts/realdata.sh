#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/preview-runner.sh"

run_preview_tests REALDATA_PORT tmp/realdata-preview.log e2e/realdata.spec.ts
