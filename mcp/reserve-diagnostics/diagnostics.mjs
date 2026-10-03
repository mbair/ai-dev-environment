import { readFile, realpath, stat, open } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import * as z from 'zod/v4';

const exec = promisify(execFile);
export const projectName = z.enum(['nfcreserve', 'alpenreserve']);
export const scopeName = z.string().regex(/^[a-z][a-z0-9_-]{0,47}$/);
const absolute = z.string().refine(isAbsolute, 'Use an absolute host-local path');
const localPath = z.string().min(1).max(240).refine(p => !isAbsolute(p) && !p.includes('\\') && p.split('/').every(s => s && s !== '.' && s !== '..'), 'Use a relative path without traversal');
const scopeSchema = z.object({
  origin: z.string().url().refine(value => {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) && u.pathname === '/' && !u.username && !u.password && !u.search && !u.hash;
  }, 'Only a loopback development origin is allowed; use an SSH tunnel for another host'),
  mode: z.enum(['single', 'multi']),
  host: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]*(?::[0-9]{1,5})?$/).optional(),
  tokenEnv: z.string().regex(/^[A-Z][A-Z0-9_]{2,100}$/).optional()
}).strict().refine(s => s.mode !== 'multi' || Boolean(s.host), 'Multi-tenant scopes require an explicit routing host');
const profileSchema = z.object({root: absolute, areas: z.object({backend: localPath, frontend: localPath}).strict(), repositories: z.record(scopeName, z.union([z.literal('.'), localPath])).refine(r => Object.keys(r).length > 0 && Object.keys(r).length <= 8), scopes: z.record(scopeName, scopeSchema)}).strict();
const configSchema = z.object({version: z.literal(1), projects: z.object({nfcreserve: profileSchema, alpenreserve: profileSchema}).strict()}).strict();

export class DiagnosticError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new DiagnosticError(code, message); };
const contains = (parent, child) => { const r = relative(parent, child); return r === '' || (!r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r)); };
async function canonical(p) { try { return await realpath(p); } catch (e) { if (e.code === 'ENOENT') return resolve(p); throw e; } }

export async function loadConfig(path) {
  let config;
  try {
    if ((await stat(path)).size > 65536) fail('CONFIG_INVALID', 'Configuration is too large.');
    config = configSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (e) {
    if (e instanceof DiagnosticError) throw e;
    fail('CONFIG_INVALID', 'Check the private host-local configuration against config.example.json; values are not echoed.');
  }
  const roots = await Promise.all(Object.values(config.projects).map(p => canonical(p.root)));
  if (contains(roots[0], roots[1]) || contains(roots[1], roots[0])) fail('PROJECT_OVERLAP', 'Project roots must be separate, non-nested checkouts.');
  const endpoints = new Set(), tokenNames = new Set();
  for (const [name, p] of Object.entries(config.projects)) {
    p.root = await canonical(p.root);
    for (const area of [...Object.values(p.areas), ...Object.values(p.repositories)]) {
      if (!contains(p.root, await canonical(resolve(p.root, area)))) fail('PATH_ESCAPE', 'Configured source areas must remain inside their project.');
    }
    for (const s of Object.values(p.scopes)) {
      const endpoint = `${new URL(s.origin).origin}|${(s.host ?? new URL(s.origin).host).toLowerCase()}`;
      if (endpoints.has(endpoint)) fail('ENDPOINT_OVERLAP', 'Each scope must have its own origin/routing-host combination.');
      endpoints.add(endpoint);
      if (s.tokenEnv) {
        if (!s.tokenEnv.startsWith(`RESERVE_${name.toUpperCase()}_`) || tokenNames.has(s.tokenEnv)) fail('TOKEN_SCOPE', 'Use a unique project-prefixed token variable for each scope.');
        tokenNames.add(s.tokenEnv);
      }
    }
  }
  return config;
}

export class Diagnostics {
  constructor(config, env = process.env) { this.config = config; this.env = env; }
  profile(project) {
    projectName.parse(project);
    return this.config.projects[project];
  }
  evidence(project, scope, source) { return { project, ...(scope ? {scope} : {}), observed_at: new Date().toISOString(), source }; }
  async root(project) {
    const p = this.profile(project);
    try { if (!(await stat(p.root)).isDirectory()) throw new Error(); }
    catch { fail('PROJECT_UNAVAILABLE', 'This project checkout is absent on this host; configure its own root.'); }
    if (await realpath(p.root) !== p.root) fail('PATH_ESCAPE', 'Project root changed; review host configuration.');
    return p.root;
  }
  async listProjects() {
    const projects = await Promise.all(Object.keys(this.config.projects).map(async project => {
      let available = true;
      try { await this.root(project); } catch { available = false; }
      return {project, source_available: available, repositories: Object.keys(this.profile(project).repositories), scopes: Object.keys(this.profile(project).scopes), health_supported: project === 'alpenreserve'};
    }));
    return {observed_at: new Date().toISOString(), projects};
  }
  async repositoryRoot(project, repository) {
    const root = await this.root(project);
    const cwd = await canonical(resolve(root, this.profile(project).repositories[repository]));
    if (!contains(root, cwd)) fail('PATH_ESCAPE', 'Repository must remain inside its project.');
    return cwd;
  }
  async git(project, repository, args) {
    const cwd = await this.repositoryRoot(project, repository);
    try {
      const env = Object.fromEntries(Object.entries(this.env).filter(([key]) => !key.startsWith('GIT_')));
      const {stdout} = await exec('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', cwd, ...args], {timeout: 5000, maxBuffer: 1024 * 1024, env: {...env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0'}});
      return args.includes('-z') ? stdout : stdout.trim();
    } catch { fail('GIT_UNAVAILABLE', 'Cannot inspect this checkout with Git; check its host-local root and Git availability.'); }
  }
  async status(project) {
    await this.root(project);
    const repositories = [];
    for (const repository of Object.keys(this.profile(project).repositories)) repositories.push(await this.repositoryStatus(project, repository));
    return {...this.evidence(project, null, 'git HEAD and working-tree status for each configured repository'), repositories, clean: repositories.every(r => r.clean)};
  }
  async repositoryStatus(project, repository) {
    const root = await this.repositoryRoot(project, repository);
    const top = await this.git(project, repository, ['rev-parse', '--show-toplevel']);
    if (await canonical(top) !== root) fail('NOT_PROJECT_ROOT', 'Each configured repository path must be its Git checkout root.');
    const [head, branch, status] = await Promise.all([
      this.git(project, repository, ['rev-parse', 'HEAD']), this.git(project, repository, ['symbolic-ref', '--short', '-q', 'HEAD']).catch(() => '(detached)'),
      this.git(project, repository, ['status', '--porcelain=v1', '-z', '--untracked-files=normal'])
    ]);
    const records = status ? status.split('\0').filter(Boolean) : [];
    let modified = 0, untracked = 0;
    for (let i = 0; i < records.length; i++) {
      const code = records[i].slice(0, 2);
      if (code === '??') untracked++; else modified++;
      if (/[RC]/.test(code)) i++;
    }
    return {repository, head, branch, modified_entries: modified, untracked_entries: untracked, clean: modified + untracked === 0};
  }
  scope(project, scope) {
    const s = this.profile(project).scopes[scope];
    if (!s) fail('SCOPE_UNAVAILABLE', 'Choose a scope from reserve_list_projects; API origins and tenant hosts must be configured locally.');
    return s;
  }
  async get(project, scope, path) {
    const s = this.scope(project, scope);
    const headers = {Accept: 'application/json'};
    if (s.host) headers.Host = s.host;
    if (s.tokenEnv) {
      const token = this.env[s.tokenEnv];
      if (!token || !/^[A-Za-z0-9._~-]{1,8192}$/.test(token)) fail('AUTH_UNAVAILABLE', 'Supply this scope’s token through its project-specific environment variable; never put tokens in chat or Git.');
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      // Node fetch may replace Host. The low-level client preserves tenant routing.
      return await new Promise((resolve, reject) => {
        const url = new URL(path, s.origin);
        const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {method: 'GET', headers}, response => {
          const stop = error => {response.destroy(); reject(error);};
          if (response.statusCode >= 300 && response.statusCode < 400) return stop(new DiagnosticError('API_UNAVAILABLE', 'API redirects are refused; configure the final development origin.'));
          if (response.statusCode < 200 || response.statusCode >= 300) return stop(new DiagnosticError('API_HTTP_ERROR', `Configured API returned HTTP ${response.statusCode}; check routing and authorization for this project/scope.`));
          if (!response.headers['content-type']?.includes('application/json')) return stop(new DiagnosticError('API_FORMAT', 'Expected JSON from the configured diagnostic endpoint.'));
          let size = 0; const chunks = [];
          response.on('data', chunk => {
            size += chunk.length;
            if (size > 262144) return stop(new DiagnosticError('API_TOO_LARGE', 'Diagnostic response exceeds 256 KiB; reduce the requested limit.'));
            chunks.push(chunk);
          });
          response.on('error', reject);
          response.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (error) { reject(error); } });
        });
        const timer = setTimeout(() => request.destroy(new Error('Timeout')), 5000);
        request.on('close', () => clearTimeout(timer));
        request.on('error', reject);
        request.end();
      });
    } catch (e) {
      if (e instanceof DiagnosticError) throw e;
      fail('API_UNAVAILABLE', 'Cannot read the configured API: check its development origin, tenant routing, timeout and JSON response. Redirects are refused.');
    }
  }
  async health(project, scope) {
    this.scope(project, scope);
    if (project !== 'alpenreserve') fail('HEALTH_UNSUPPORTED', 'NFCReserve has no verified general /api/healthz route; use checkout status or channel diagnostics.');
    const data = await this.get(project, scope, '/api/healthz');
    if (data?.status !== 'ok') fail('API_FORMAT', 'The health endpoint did not return the expected status.');
    const revision = typeof data.revision === 'string' && /^(?:[0-9a-f]{7,64}|unknown)$/i.test(data.revision) ? data.revision : 'unreported';
    const mode = ['single', 'multi', 'unknown'].includes(data.mode) ? data.mode : 'unreported';
    return {...this.evidence(project, scope, 'GET /api/healthz'), status: 'ok', revision, mode, coverage: 'API process only; does not prove tenant, database or worker health'};
  }
  async channelSync(project, scope, channelId, limit) {
    if (!Number.isSafeInteger(channelId) || channelId < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail('INVALID_ARGUMENT', 'Use a positive channel ID and limit from 1 to 100.');
    const data = await this.get(project, scope, `/api/channel/${channelId}/sync-logs?limit=${limit}`);
    if (!Array.isArray(data) || data.length > limit) fail('API_FORMAT', 'Expected a bounded list of channel sync records.');
    const statuses = ['running', 'success', 'partial', 'failed'];
    const logs = data.map(row => {
      if (!row || typeof row !== 'object' || row.channel_id !== channelId || !statuses.includes(row.status)) fail('API_FORMAT', 'A sync record has an unexpected channel or status.');
      const log = {status: row.status};
      for (const key of ['id', 'duration_ms', 'items_total', 'items_success', 'items_failed']) if (Number.isSafeInteger(row[key]) && row[key] >= 0) log[key] = row[key];
      for (const key of ['started_at', 'completed_at']) if (typeof row[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(row[key])) log[key] = row[key];
      if (['inbound', 'outbound'].includes(row.direction)) log.direction = row.direction;
      if (['ari', 'reservations', 'webhook', 'test'].includes(row.kind)) log.kind = row.kind;
      log.has_error = Boolean(row.error_message);
      return log;
    });
    return {...this.evidence(project, scope, 'GET /api/channel/:id/sync-logs'), channel_id: channelId, limit, returned: logs.length, counts: Object.fromEntries(statuses.map(s => [s, logs.filter(l => l.status === s).length])), logs, coverage: 'Recent records only; not total backlog or worker liveness. Raw messages, payloads, user IDs and credentials omitted.'};
  }
  async fileHash(project, area, path) {
    const root = await this.root(project);
    const base = await canonical(resolve(root, this.profile(project).areas[area]));
    const target = resolve(base, path);
    if (!contains(root, base) || !contains(base, target)) fail('PATH_ESCAPE', 'File must remain inside its project source area.');
    let actual;
    try { actual = await realpath(target); } catch (e) { if (e.code === 'ENOENT') return {exists: false}; throw e; }
    if (actual !== target || !contains(base, actual)) fail('PATH_ESCAPE', 'Symlinked source files are not compared.');
    const file = await open(actual, 'r');
    try {
      const info = await file.stat();
      if (!info.isFile() || info.size > 1024 * 1024) fail('FILE_UNSUPPORTED', 'Comparison supports regular source files up to 1 MiB.');
      const content = await file.readFile();
      if (content.length > 1024 * 1024) fail('FILE_UNSUPPORTED', 'File grew beyond the comparison limit.');
      return {exists: true, sha256: createHash('sha256').update(content).digest('hex')};
    } finally { await file.close(); }
  }
  async compare(sourceProject, targetProject, area, paths) {
    projectName.parse(sourceProject); projectName.parse(targetProject);
    if (sourceProject === targetProject) fail('INVALID_ARGUMENT', 'Choose two different projects explicitly.');
    if (!['backend', 'frontend'].includes(area) || !Array.isArray(paths) || !paths.length || paths.length > 32) fail('INVALID_ARGUMENT', 'Choose a source area and 1–32 relative source paths.');
    for (const path of paths) {
      localPath.parse(path);
      if (!/\.(?:[cm]?js|tsx?|html|s?css)$/.test(path) || path.split('/').some(s => s.startsWith('.') || /^(?:node_modules|dist|docs|out-tsc|config|secrets?)$/i.test(s))) fail('FILE_UNSUPPORTED', 'Use code/template/style paths; generated, dependency and private configuration files are excluded.');
    }
    const files = [];
    for (const path of paths) {
      const source = await this.fileHash(sourceProject, area, path), target = await this.fileHash(targetProject, area, path);
      files.push({path, source, target, comparison: !source.exists || !target.exists ? 'missing' : source.sha256 === target.sha256 ? 'identical' : 'different'});
    }
    return {source_project: sourceProject, target_project: targetProject, area, observed_at: new Date().toISOString(), files, coverage: 'Byte equality only; different implementations may provide the same feature. No files are synchronized.'};
  }
}
