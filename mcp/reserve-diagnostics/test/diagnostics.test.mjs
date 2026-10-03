import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer as httpServer } from 'node:http';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { Diagnostics, loadConfig } from '../diagnostics.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'reserve-diagnostics-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const config = {version: 1, projects: {}};
  for (const name of ['nfcreserve', 'alpenreserve']) {
    const root = join(dir, name);
    await mkdir(join(root, 'backend'), {recursive: true});
    await mkdir(join(root, 'frontend'), {recursive: true});
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', name]);
    config.projects[name] = {root, areas: {backend: 'backend', frontend: 'frontend'}, repositories: {application: '.'}, scopes: {}};
  }
  const path = join(dir, 'config.json');
  const save = async () => { await writeFile(path, JSON.stringify(config)); return loadConfig(path); };
  return {dir, config, path, save};
}
async function api(t, handler) {
  const server = httpServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}
const json = (res, body) => {res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body));};

test('independent roots and credentials cannot be aliased', async t => {
  const f = await fixture(t);
  f.config.projects.alpenreserve.root = f.config.projects.nfcreserve.root;
  await assert.rejects(f.save(), {code: 'PROJECT_OVERLAP'});
  f.config.projects.alpenreserve.root = join(f.dir, 'alpenreserve');
  f.config.projects.nfcreserve.scopes.dev = {origin: 'http://127.0.0.1:3000', mode: 'single'};
  f.config.projects.alpenreserve.scopes.dev = {origin: 'http://127.0.0.1:3000', mode: 'single'};
  await assert.rejects(f.save(), {code: 'ENDPOINT_OVERLAP'});
  f.config.projects.alpenreserve.scopes.dev.host = 'alpen.localhost';
  f.config.projects.alpenreserve.scopes.dev.tokenEnv = 'RESERVE_NFCRESERVE_DEV_TOKEN';
  await assert.rejects(f.save(), {code: 'TOKEN_SCOPE'});
});

test('multi mode requires routing host; credentials and nonlocal origins are rejected', async t => {
  const f = await fixture(t);
  for (const scope of [{origin: 'http://127.0.0.1:3000', mode: 'multi'}, {origin: 'https://production.example', mode: 'single'}, {origin: 'http://user:secret@localhost:3000', mode: 'single'}]) {
    f.config.projects.alpenreserve.scopes.dev = scope;
    await assert.rejects(f.save(), {code: 'CONFIG_INVALID'});
  }
});

test('an absent project does not fall back to the other checkout', async t => {
  const f = await fixture(t);
  await rm(f.config.projects.nfcreserve.root, {recursive: true});
  const d = new Diagnostics(await f.save());
  assert.equal((await d.listProjects()).projects[0].source_available, false);
  await assert.rejects(d.status('nfcreserve'), {code: 'PROJECT_UNAVAILABLE'});
  assert.equal((await d.status('alpenreserve')).project, 'alpenreserve');
});

test('Git status remains bound to project despite inherited Git environment', async t => {
  const f = await fixture(t);
  const d = new Diagnostics(await f.save(), {...process.env, GIT_DIR: join(f.config.projects.alpenreserve.root, '.git')});
  const nfcHead = execFileSync('git', ['-C', f.config.projects.nfcreserve.root, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  assert.equal((await d.status('nfcreserve')).repositories[0].head, nfcHead);
  await writeFile(join(f.config.projects.nfcreserve.root, 'backend/a.js'), 'original');
  execFileSync('git', ['-C', f.config.projects.nfcreserve.root, 'add', '.']);
  execFileSync('git', ['-C', f.config.projects.nfcreserve.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '-m', 'file']);
  await writeFile(join(f.config.projects.nfcreserve.root, 'backend/a.js'), 'modified');
  await writeFile(join(f.config.projects.nfcreserve.root, 'backend/b.js'), 'untracked');
  const status = await d.status('nfcreserve');
  assert.equal(status.repositories[0].modified_entries, 1); assert.equal(status.repositories[0].untracked_entries, 1); assert.equal(status.clean, false);
  assert.equal((await d.status('alpenreserve')).clean, true);
});

test('comparison reports byte differences and missing counterparts without writes', async t => {
  const f = await fixture(t), d = new Diagnostics(await f.save());
  for (const p of Object.values(f.config.projects)) await writeFile(join(p.root, 'backend/same.js'), 'same');
  await writeFile(join(f.config.projects.nfcreserve.root, 'backend/different.js'), 'first');
  await writeFile(join(f.config.projects.alpenreserve.root, 'backend/different.js'), 'second');
  const result = await d.compare('nfcreserve', 'alpenreserve', 'backend', ['same.js', 'different.js', 'missing.js']);
  assert.deepEqual(result.files.map(f => f.comparison), ['identical', 'different', 'missing']);
  assert.equal(result.source_project, 'nfcreserve'); assert.equal(result.target_project, 'alpenreserve');
  assert.equal(result.files[0].source.sha256, result.files[0].target.sha256);
});

test('a project can have separate frontend/backend Git repositories', async t => {
  const f = await fixture(t), p = f.config.projects.nfcreserve;
  await rm(join(p.root, '.git'), {recursive: true});
  p.repositories = {backend: 'backend', frontend: 'frontend'};
  for (const area of Object.values(p.repositories)) {
    const root = join(p.root, area);
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', area]);
  }
  await writeFile(join(p.root, 'frontend/modified.ts'), 'frontend change');
  const d = new Diagnostics(await f.save());
  const status = await d.status('nfcreserve');
  assert.deepEqual(status.repositories.map(r => [r.repository, r.clean]), [['backend', true], ['frontend', false]]);
  assert.equal(status.clean, false);
  assert.equal((await d.status('alpenreserve')).repositories.length, 1);
});

test('comparison rejects traversal, symlinks, secret/config and generated paths', async t => {
  const f = await fixture(t), d = new Diagnostics(await f.save());
  await writeFile(join(f.config.projects.alpenreserve.root, 'backend/private.js'), 'secret');
  await symlink(join(f.config.projects.alpenreserve.root, 'backend/private.js'), join(f.config.projects.nfcreserve.root, 'backend/link.js'));
  await assert.rejects(d.compare('nfcreserve', 'alpenreserve', 'backend', ['link.js']), {code: 'PATH_ESCAPE'});
  for (const path of ['../alpenreserve/backend/private.js', '/etc/passwd', 'config/credentials.js', '.env', 'node_modules/a.js']) await assert.rejects(d.compare('nfcreserve', 'alpenreserve', 'backend', [path]));
});

test('channel reads use GET, explicit host and project token and return sanitized evidence', async t => {
  const f = await fixture(t), requests = [];
  const origin = await api(t, (req, res) => {
    requests.push({method: req.method, host: req.headers.host, token: req.headers.authorization, path: req.url});
    json(res, [{id: 2, channel_id: 7, status: 'failed', direction: 'inbound', kind: 'reservations', items_failed: 3, error_message: 'PII SECRET', summary_json: 'SECRET', triggered_by_user_id: 1234, started_at: '2026-10-03T12:00:00Z'}]);
  });
  f.config.projects.alpenreserve.scopes.hotel = {origin, mode: 'multi', host: 'hotel.alpen.localhost', tokenEnv: 'RESERVE_ALPENRESERVE_HOTEL_TOKEN'};
  const d = new Diagnostics(await f.save(), {RESERVE_ALPENRESERVE_HOTEL_TOKEN: 'alpen-token', RESERVE_NFCRESERVE_DEV_TOKEN: 'nfc-token'});
  const result = await d.channelSync('alpenreserve', 'hotel', 7, 20);
  assert.deepEqual(requests, [{method: 'GET', host: 'hotel.alpen.localhost', token: 'Bearer alpen-token', path: '/api/channel/7/sync-logs?limit=20'}]);
  assert.equal(result.project, 'alpenreserve'); assert.equal(result.scope, 'hotel'); assert.equal(result.counts.failed, 1);
  assert.equal(result.logs[0].has_error, true); assert.equal(result.logs[0].items_failed, 3);
  assert.doesNotMatch(JSON.stringify(result), /SECRET|1234|alpen-token|nfc-token/);
  await assert.rejects(d.channelSync('nfcreserve', 'hotel', 7, 20), {code: 'SCOPE_UNAVAILABLE'});
  assert.equal(requests.length, 1);
});

test('missing auth, mismatched channel and response bounds are errors', async t => {
  const f = await fixture(t);
  let body = [{channel_id: 8, status: 'success'}];
  const origin = await api(t, (req, res) => json(res, body));
  f.config.projects.nfcreserve.scopes.dev = {origin, mode: 'single', tokenEnv: 'RESERVE_NFCRESERVE_DEV_TOKEN'};
  const config = await f.save(), d = new Diagnostics(config, {});
  await assert.rejects(d.channelSync('nfcreserve', 'dev', 7, 1), {code: 'AUTH_UNAVAILABLE'});
  d.env.RESERVE_NFCRESERVE_DEV_TOKEN = 'token';
  await assert.rejects(d.channelSync('nfcreserve', 'dev', 7, 1), {code: 'API_FORMAT'});
  body = Array(2).fill({channel_id: 7, status: 'success'});
  await assert.rejects(d.channelSync('nfcreserve', 'dev', 7, 1), {code: 'API_FORMAT'});
  body = 'x'.repeat(262145);
  await assert.rejects(d.channelSync('nfcreserve', 'dev', 7, 1), {code: 'API_TOO_LARGE'});
});

test('redirects are never followed and health does not claim database/worker coverage', async t => {
  const f = await fixture(t); let redirected = 0;
  const target = await api(t, (req, res) => {redirected++; json(res, []);});
  const origin = await api(t, (req, res) => {
    if (req.url === '/api/healthz') json(res, {status: 'ok', revision: 'abcdef1234', mode: 'multi', secret: 'SECRET'});
    else {res.writeHead(302, {Location: target}); res.end();}
  });
  f.config.projects.alpenreserve.scopes.dev = {origin, mode: 'multi', host: 'hotel.localhost'};
  const d = new Diagnostics(await f.save());
  const result = await d.health('alpenreserve', 'dev');
  assert.match(result.coverage, /does not prove tenant, database or worker health/);
  assert.doesNotMatch(JSON.stringify(result), /SECRET/);
  await assert.rejects(d.channelSync('alpenreserve', 'dev', 1, 1), {code: 'API_UNAVAILABLE'});
  assert.equal(redirected, 0);
});

test('real SDK stdio handshake, schemas and explicit project calls work', async t => {
  const f = await fixture(t); await f.save();
  const client = new Client({name: 'reserve-test', version: '1.0.0'});
  const transport = new StdioClientTransport({command: process.execPath, args: [new URL('../server.mjs', import.meta.url).pathname], env: {...process.env, RESERVE_DIAGNOSTICS_CONFIG: f.path}, stderr: 'pipe'});
  t.after(() => client.close());
  await client.connect(transport);
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 5); assert.ok(tools.every(t => t.annotations.readOnlyHint && !t.annotations.destructiveHint));
  const result = await client.callTool({name: 'reserve_project_status', arguments: {project: 'nfcreserve'}});
  assert.equal(result.structuredContent.project, 'nfcreserve'); assert.equal(result.isError, undefined);
  const invalid = await client.callTool({name: 'reserve_project_status', arguments: {}});
  assert.equal(invalid.isError, true);
  const unavailable = await client.callTool({name: 'reserve_channel_sync', arguments: {project: 'nfcreserve', scope: 'missing', channel_id: 1}});
  assert.equal(unavailable.isError, true); assert.equal(unavailable.structuredContent.error.code, 'SCOPE_UNAVAILABLE');
});

test('all ten evaluation answer keys are verified against isolated MCP fixtures', async t => {
  const client = new Client({name: 'evaluation-key-verifier', version: '1.0.0'});
  t.after(() => client.close());
  await client.connect(new StdioClientTransport({command: process.execPath, args: [new URL('../evaluation-fixture.mjs', import.meta.url).pathname], env: process.env, stderr: 'pipe'}));
  const call = async (name, args) => (await client.callTool({name, arguments: args})).structuredContent;
  const projects = await call('reserve_list_projects', {});
  assert.equal(projects.projects.length, 2);
  const compare = (area, paths, reverse = false) => call('reserve_compare_files', {source_project: reverse ? 'alpenreserve' : 'nfcreserve', target_project: reverse ? 'nfcreserve' : 'alpenreserve', area, paths});
  const backend = await compare('backend', ['channel.js', 'worker.js', 'finance.js']);
  const reversed = await compare('backend', ['finance.js'], true);
  const frontend = await compare('frontend', ['form.ts', 'input.ts']);
  const nfcStatus = await call('reserve_project_status', {project: 'nfcreserve'});
  const alpenStatus = await call('reserve_project_status', {project: 'alpenreserve'});
  assert.equal(alpenStatus.repositories.length, 1);
  const logs = {};
  for (const p of projects.projects) {
    logs[p.project] = [];
    for (const channel_id of [1, 2, 3]) logs[p.project].push(await call('reserve_channel_sync', {project: p.project, scope: p.scopes[0], channel_id}));
  }
  const sum = list => list.reduce((total, response) => total + response.logs.reduce((s, row) => s + (row.items_failed ?? 0), 0), 0);
  const health = await call('reserve_api_health', {project: 'alpenreserve', scope: 'hotel'});
  const nfcHealth = await call('reserve_api_health', {project: 'nfcreserve', scope: 'dev'});
  const answers = [
    backend.files[2].source.exists && !backend.files[2].target.exists ? 'nfcreserve' : 'unknown',
    sum(logs.alpenreserve) > sum(logs.nfcreserve) ? 'alpenreserve' : 'nfcreserve',
    [...backend.files.slice(0, 2), frontend.files[0]].every(f => f.comparison === 'identical') ? 'True' : 'False',
    frontend.files.find(f => f.comparison === 'different').path,
    String(nfcStatus.repositories.length),
    health.coverage.includes('does not prove tenant, database or worker health') ? 'False' : 'True',
    /PRIVATE RAW ERROR|PRIVATE PAYLOAD/.test(JSON.stringify(logs)) ? 'True' : 'False',
    nfcHealth.error.code,
    String(sum(logs.nfcreserve) + sum(logs.alpenreserve)),
    backend.files[2].comparison === reversed.files[0].comparison ? backend.files[2].comparison : 'inconsistent'
  ];
  const xml = await readFile(new URL('../evaluation.xml', import.meta.url), 'utf8');
  const expected = [...xml.matchAll(/<answer>([^<]+)<\/answer>/g)].map(m => m[1]);
  assert.equal(expected.length, 10);
  assert.deepEqual(answers, expected);
});
