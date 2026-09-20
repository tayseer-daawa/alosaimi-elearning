#!/usr/bin/env bash
# Local development seed. See app/seed/README.md
set -euo pipefail
cd "$(dirname "$0")/.."
uv run python -m app.seed "$@"
