import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({name: 'reserve-smoke', version: '0.1.0'});
try {
  await client.connect(new StdioClientTransport({command: process.execPath, args: [new URL('./server.mjs', import.meta.url).pathname], env: process.env, stderr: 'inherit'}));
  const tools = (await client.listTools()).tools;
  console.log(JSON.stringify({handshake: 'PASS', tools: tools.map(t => t.name)}));
  const projects = await client.callTool({name: 'reserve_list_projects', arguments: {}});
  console.log(JSON.stringify(projects.structuredContent));
  for (const project of ['nfcreserve', 'alpenreserve']) {
    const result = await client.callTool({name: 'reserve_project_status', arguments: {project}});
    console.log(JSON.stringify(result.structuredContent));
  }
  const result = await client.callTool({name: 'reserve_compare_files', arguments: {source_project: 'nfcreserve', target_project: 'alpenreserve', area: 'backend', paths: ['routes/Channel.js']}});
  console.log(JSON.stringify(result.structuredContent));
} finally { await client.close(); }
