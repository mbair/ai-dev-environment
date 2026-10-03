#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$root/scripts/environment.py" verify
if [[ "${1:-}" != "--apply" ]]; then
  python3 "$root/scripts/environment.py" install-skills
  printf '\nUse --apply to install locked npm tools, copy skills with backups, and register the private marketplace.\n'
  exit 0
fi
if [[ "$(node --version)" != "v24.14.0" ]]; then
  printf 'Activate Node 24.14.0 before setup. No global Node installation is changed.\n' >&2
  exit 1
fi
npm ci --prefix "$root/tools" --no-audit --no-fund
npm ci --prefix "$root/mcp/reserve-diagnostics" --no-audit --no-fund
python3 "$root/scripts/environment.py" install-skills --apply
"$root/tools/node_modules/.bin/codex" plugin marketplace add "$root"
printf '\nPrivate marketplace registered. Direct skill installation is active; do not also enable the skill plugin unless removing those direct copies to avoid duplicate discovery.\n'
printf 'MCP settings and remote plugins are checked separately; run scripts/doctor.sh. Existing MCP definitions are preserved.\n'
