#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$root/tools/node_modules/.bin:$HOME/.local/bin:$PATH"
if [[ "$(node --version)" != "v24.14.0" ]]; then
  printf 'Activate Node 24.14.0 before starting the shared Codex runtime.\n' >&2
  exit 1
fi
exec "$root/tools/node_modules/.bin/codex" "$@"
