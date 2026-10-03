#!/usr/bin/env python3
"""Versioned user skills and read-only environment diagnostics. Python 3.11+."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def inventory(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted((root / 'plugins').rglob('*'))
            if p.is_file() and '__pycache__' not in p.parts}


def write_lock(root):
    (root / 'skills.lock.json').write_text(json.dumps(inventory(root), indent=2) + '\n')


def verify(root):
    expected = json.loads((root / 'skills.lock.json').read_text())
    actual = inventory(root)
    if actual != expected:
        changed = sorted(k for k in set(actual) | set(expected) if actual.get(k) != expected.get(k))
        raise ValueError('Integrity mismatch: ' + ', '.join(changed))
    return len(expected)


def tree_hash(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob('*')) if p.is_file() and '__pycache__' not in p.parts}


def install_skill(source, dest, backup):
    if dest.exists() and tree_hash(source) == tree_hash(dest):
        return 'unchanged'
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() or dest.is_symlink():
        saved = backup / dest.name
        if saved.exists() or saved.is_symlink():
            raise ValueError('Backup already exists: ' + str(saved))
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dest), str(saved))
    shutil.copytree(source, dest, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    return 'installed'


def command(args, timeout=45):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return result.returncode, result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return 127, ''


def doctor(root, dest):
    verify(root)
    expected = json.loads((root / 'environment.json').read_text())
    checks = []
    for name, spec in expected['executables'].items():
        code, output = command(spec['command'])
        checks.append({'name': name, 'status': 'PASS' if code == 0 and spec['version'] in output else 'CHECK',
                       'expected': spec['version'], 'observed': output[:160]})
    for source in sorted((root / 'plugins/mbair-engineering/skills').iterdir()):
        if not source.is_dir():
            continue
        target = dest / source.name
        checks.append({'name': 'skill:' + source.name,
                       'status': 'PASS' if target.exists() and tree_hash(source) == tree_hash(target) else 'MISSING_OR_DIFFERENT'})
    code, output = command(['codex', 'plugin', 'list', '--json'], timeout=60)
    if code == 0:
        installed = json.loads(output).get('installed', [])
        for spec in expected['plugins']:
            hit = next((p for p in installed if p.get('name') == spec['name']), None)
            checks.append({'name': 'plugin:' + spec['name'],
                           'status': 'PASS' if hit and hit.get('enabled') and hit.get('version') == spec['version'] else 'CHECK',
                           'expected': spec['version'], 'observed': hit.get('version') if hit else None})
    else:
        checks.append({'name': 'plugin-list', 'status': 'UNAVAILABLE'})
    code, output = command(['codex', 'mcp', 'list', '--json'])
    if code == 0:
        configured = json.loads(output)
        names = [p['name'] for p in configured if p.get('enabled', True)]
        for name in expected['mcp_names']:
            checks.append({'name': 'mcp-config:' + name, 'status': 'CONFIGURED' if name in names else 'MISSING'})
    code, output = command(['docker', 'info', '--format', '{{.ServerVersion}}'], timeout=10)
    checks.append({'name': 'docker-daemon', 'status': 'REACHABLE' if code == 0 else 'UNAVAILABLE', 'observed': output})
    return {'checks': checks, 'limits': ['Configured MCP is not a handshake or app verdict.',
            'Reticle requires an actual in-app assertion.', 'Account sign-in and hook trust remain machine-local.',
            'Desktop tools are not available in headless CLI.']}



def missing_mcp(servers, installed):
    configured = {p['name'] for p in installed}
    return [name for name in servers if name not in configured]


def configure_mcp(root, apply):
    servers = json.loads((root / 'config/mcp.json').read_text())['mcpServers']
    codex = str(root / 'tools/node_modules/.bin/codex')
    code, output = command([codex, 'mcp', 'list', '--json'])
    if code:
        raise ValueError('Cannot inspect Codex MCP configuration; no changes applied.')
    installed = json.loads(output)
    missing = missing_mcp(servers, installed)
    for item in installed:
        if item['name'] in servers and not item.get('enabled', True):
            print('Preserved disabled MCP: ' + item['name'])
    codex_home = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex')))
    if apply and str(codex_home).startswith('/mnt/'):
        raise ValueError('Use the Windows/WSL profile for desktop config. Linux executables cannot be added to a Windows config automatically.')
    config = codex_home / 'config.toml'
    if apply and missing and config.exists():
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        backup = codex_home / 'environment-backups' / stamp
        backup.mkdir(parents=True)
        shutil.copy2(config, backup / 'config.toml')
    for name in missing:
        spec = servers[name]
        args = [codex, 'mcp', 'add', name]
        if 'url' in spec:
            args += ['--url', spec['url']]
        else:
            for key, value in spec.get('env', {}).items():
                args += ['--env', key + '=' + value]
            args += ['--', spec['command'], *spec.get('args', [])]
        if apply:
            code, _ = command(args)
            if code:
                raise ValueError('Failed to add MCP: ' + name + '; review the saved config backup.')
            print('Added MCP: ' + name)
        else:
            print('PLAN: add MCP ' + name)
    if not missing:
        print('Existing MCP definitions preserved; no changes needed.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['verify', 'install-skills', 'configure-mcp', 'doctor'])
    parser.add_argument('--dest', type=Path, default=Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex'))) / 'skills')
    parser.add_argument('--apply', action='store_true', help='Apply skill copies; otherwise print the plan.')
    args = parser.parse_args()
    count = verify(ROOT)
    if args.action == 'verify':
        print(f'PASS: {count} locked plugin files')
    elif args.action == 'configure-mcp':
        configure_mcp(ROOT, args.apply)
    elif args.action == 'doctor':
        report = doctor(ROOT, args.dest.expanduser())
        print(json.dumps(report, indent=2))
        return 1 if any(c['status'] in ('CHECK', 'MISSING_OR_DIFFERENT', 'MISSING', 'UNAVAILABLE') for c in report['checks']) else 0
    else:
        dest = args.dest.expanduser()
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        backup = dest.parent / 'environment-backups' / stamp
        for source in sorted((ROOT / 'plugins/mbair-engineering/skills').iterdir()):
            if source.is_dir():
                if args.apply:
                    print(f'{install_skill(source, dest / source.name, backup)}: {source.name}')
                else:
                    print(f'PLAN: {source.name} -> {dest / source.name}')
        if args.apply:
            print(f'Existing differing skills backed up under {backup} if needed.')
            print('Restart/reload the client to discover new skills; running goals retain their current context.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
