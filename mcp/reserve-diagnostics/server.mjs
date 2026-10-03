import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { Diagnostics, DiagnosticError, loadConfig, projectName, scopeName } from './diagnostics.mjs';

export function createServer(config, env = process.env) {
  const diagnostics = new Diagnostics(config, env);
  const server = new McpServer({name: 'reserve-diagnostics', version: '0.1.0'});
  const project = projectName.describe('Required independent project; never inferred from cwd or another project.');
  const scope = scopeName.describe('Required configured development scope/tenant; discover via reserve_list_projects.');
  const register = (name, description, schema, handler, network = false) => {
    server.registerTool(name, {description, inputSchema: schema, outputSchema: z.record(z.string(), z.unknown()), annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: network}}, async args => {
      try {
        const data = await handler(args);
        return {content: [{type: 'text', text: JSON.stringify(data)}], structuredContent: data};
      } catch (error) {
        const data = {error: {code: error instanceof DiagnosticError ? error.code : 'DIAGNOSTIC_FAILED', message: error instanceof DiagnosticError ? error.message : 'Diagnostic failed; check project configuration and filesystem access. Internal values are not echoed.'}, ...(args.project ? {project: args.project} : {}), ...(args.scope ? {scope: args.scope} : {})};
        return {isError: true, content: [{type: 'text', text: JSON.stringify(data)}], structuredContent: data};
      }
    });
  };
  register('reserve_list_projects', 'List independent project checkout availability and configured API scopes on this host.', z.object({}).strict(), () => diagnostics.listProjects());
  register('reserve_project_status', 'Read Git HEAD, branch and dirty counts for each repository of one explicit project. NFCReserve has separate frontend/backend repos; AlpenReserve is a monorepo. Does not change checkout.', z.object({project}).strict(), a => diagnostics.status(a.project));
  register('reserve_api_health', 'Read AlpenReserve process /api/healthz for an explicit scope. This is not a tenant/database/worker health check; NFCReserve route is unsupported.', z.object({project, scope}).strict(), a => diagnostics.health(a.project, a.scope), true);
  register('reserve_channel_sync', 'Summarize recent channel synchronization statuses and counts in one project/tenant. Raw payloads, error messages, credentials and user details are omitted. Never triggers sync.', z.object({project, scope, channel_id: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), limit: z.number().int().min(1).max(100).default(20)}).strict(), a => diagnostics.channelSync(a.project, a.scope, a.channel_id, a.limit), true);
  register('reserve_compare_files', 'Compare SHA-256 of explicit counterpart source files across NFCReserve and AlpenReserve, with their distinct layouts. Byte comparison assists manual feature transfer; does not prove behavioral equivalence.', z.object({source_project: project, target_project: project, area: z.enum(['backend', 'frontend']), paths: z.array(z.string().min(1).max(240)).min(1).max(32)}).strict(), a => diagnostics.compare(a.source_project, a.target_project, a.area, a.paths));
  return server;
}

if (process.argv[1]?.endsWith('/server.mjs')) {
  try {
    const path = process.env.RESERVE_DIAGNOSTICS_CONFIG;
    if (!path) throw new Error();
    const config = await loadConfig(path);
    await serveStdio(() => createServer(config));
  } catch {
    console.error('reserve-diagnostics: startup failed; set RESERVE_DIAGNOSTICS_CONFIG to a valid private host-local JSON configuration.');
    process.exitCode = 1;
  }
}
