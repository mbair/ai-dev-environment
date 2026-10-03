// Isolated synthetic evaluation world. Never points at application checkouts/APIs.
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer as httpServer } from 'node:http';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.mjs';
import { loadConfig } from './diagnostics.mjs';

const dir = await mkdtemp(join(tmpdir(), 'reserve-eval-'));
process.on('exit', () => rmSync(dir, {recursive: true, force: true}));
const config = {version: 1, projects: {}};
for (const project of ['nfcreserve', 'alpenreserve']) {
  const root = join(dir, project);
  for (const area of ['backend', 'frontend']) await mkdir(join(root, area), {recursive: true});
  config.projects[project] = {root, areas: {backend: 'backend', frontend: 'frontend'}, repositories: project === 'nfcreserve' ? {backend: 'backend', frontend: 'frontend'} : {application: '.'}, scopes: {}};
  await writeFile(join(root, 'backend/channel.js'), 'shared implementation');
  await writeFile(join(root, 'backend/worker.js'), project);
  await writeFile(join(root, 'frontend/form.ts'), 'shared form');
  await writeFile(join(root, 'frontend/input.ts'), project === 'nfcreserve' ? 'old input' : 'improved input');
  if (project === 'nfcreserve') await writeFile(join(root, 'backend/finance.js'), 'settlement feature');
  for (const repo of Object.values(config.projects[project].repositories)) {
    const cwd = join(root, repo);
    execFileSync('git', ['init', '-q', cwd]);
    execFileSync('git', ['add', '.'], {cwd});
    execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '-m', 'fixed fixture'], {cwd, env: {...process.env, GIT_AUTHOR_DATE: '2026-10-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-10-01T00:00:00Z'}});
  }
  const server = httpServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (project === 'alpenreserve' && req.headers.host !== 'hotel.alpen.localhost') {res.writeHead(421); res.end('{}'); return;}
    if (req.url === '/api/healthz' && project === 'alpenreserve') {res.end(JSON.stringify({status: 'ok', revision: 'a'.repeat(40), mode: 'multi'})); return;}
    const match = /^\/api\/channel\/([123])\/sync-logs\?limit=\d+$/.exec(req.url);
    if (!match) {res.writeHead(404); res.end('{}'); return;}
    const id = Number(match[1]);
    const entries = project === 'nfcreserve' ? {1: [['failed', 2], ['partial', 1]], 2: [['success', 0]], 3: []} : {1: [['success', 0]], 2: [['failed', 4]], 3: [['running', 0]]};
    res.end(JSON.stringify(entries[id].map(([status, count], i) => ({id: id * 10 + i, channel_id: id, status, items_failed: count, started_at: '2026-10-01T12:00:00Z', error_message: status === 'failed' ? 'PRIVATE RAW ERROR' : null, summary_json: 'PRIVATE PAYLOAD'}))));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  server.unref();
  const scope = project === 'alpenreserve' ? 'hotel' : 'dev';
  config.projects[project].scopes[scope] = {origin: `http://127.0.0.1:${server.address().port}`, mode: project === 'alpenreserve' ? 'multi' : 'single', ...(project === 'alpenreserve' ? {host: 'hotel.alpen.localhost'} : {})};
}
const path = join(dir, 'config.json');
await writeFile(path, JSON.stringify(config), {mode: 0o600});
const validated = await loadConfig(path);
await serveStdio(() => createServer(validated));
