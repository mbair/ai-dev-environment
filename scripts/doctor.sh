#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$root/tools/node_modules/.bin:$HOME/.local/bin:$PATH"
exec python3 "$root/scripts/environment.py" doctor "$@"
