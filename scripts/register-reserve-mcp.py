#!/usr/bin/env python3
"""Register only the read-only Reserve MCP, preserving existing client settings."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import tomllib

ROOT = Path(__file__).resolve().parents[1]


def definition(node, config, distribution=None):
    server = str(ROOT / 'mcp/reserve-diagnostics/server.mjs')
    if distribution:
        return {'command': r'C:\Windows\System32\wsl.exe', 'args': ['--distribution', distribution, '--cd', str(ROOT), '--exec', '/usr/bin/env', f'RESERVE_DIAGNOSTICS_CONFIG={config}', node, server]}
    return {'command': node, 'args': [server], 'env': {'RESERVE_DIAGNOSTICS_CONFIG': str(config)}}


def register(home, spec):
    """Append one independent TOML section; preserve existing bytes and disabled entries."""
    config = home / 'config.toml'
    original = config.read_bytes() if config.exists() else b''
    parsed = tomllib.loads(original.decode())
    if 'reserve-diagnostics' in parsed.get('mcp_servers', {}):
        return 'Existing reserve-diagnostics definition preserved (including disabled state).'
    lines = ['\n[mcp_servers.reserve-diagnostics]']
    for key, value in spec.items():
        if key != 'env':
            lines.append(f'{key} = {json.dumps(value, ensure_ascii=True)}')
    if spec.get('env'):
        lines.append('[mcp_servers.reserve-diagnostics.env]')
        lines.extend(f'{key} = {json.dumps(value)}' for key, value in spec['env'].items())
    updated = original + ('\n'.join(lines) + '\n').encode()
    tomllib.loads(updated.decode())
    home.mkdir(parents=True, exist_ok=True)
    if original:
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        backup = home / 'environment-backups' / stamp
        backup.mkdir(parents=True, mode=0o700)
        shutil.copy2(config, backup / 'config.toml')
        (backup / 'config.toml').chmod(0o600)
    temp = config.with_name('.reserve-config.tmp')
    # Exclusive creation prevents clobbering another installer’s temporary file.
    with temp.open('xb') as f:
        os.chmod(temp, 0o600)
        f.write(updated)
    try:
        if config.exists() and config.read_bytes() != original:
            raise ValueError('Client config changed during registration; retry after reviewing it.')
        temp.replace(config)
    finally:
        temp.unlink(missing_ok=True)
    return 'Registered reserve-diagnostics; other settings preserved. Reload after current work finishes.'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True, type=Path)
    parser.add_argument('--node', required=True)
    parser.add_argument('--codex-home', type=Path, default=Path.home() / '.codex')
    parser.add_argument('--wsl-distribution', help='Windows Desktop only: launch in this specific WSL distribution')
    parser.add_argument('--apply', action='store_true')
    a = parser.parse_args()
    config = a.config.expanduser().resolve()
    subprocess.run([a.node, '--input-type=module', '-e', "import {loadConfig} from './mcp/reserve-diagnostics/diagnostics.mjs'; await loadConfig(process.argv[1]);", str(config)], cwd=ROOT, check=True, capture_output=True)
    spec = definition(a.node, config, a.wsl_distribution)
    if str(a.codex_home).startswith('/mnt/') and not a.wsl_distribution:
        raise ValueError('Windows Desktop requires an explicit WSL distribution wrapper.')
    if a.apply:
        print(register(a.codex_home, spec))
    else:
        print('PLAN: register reserve-diagnostics with validated host-local configuration; existing definition will be preserved.')


if __name__ == '__main__':
    main()
