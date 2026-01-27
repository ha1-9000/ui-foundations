import fs from 'node:fs/promises';
import path from 'node:path';

const MCP_CONFIG_PATH = path.resolve('.mcp.json');
const DEFAULT_ENDPOINT = 'http://127.0.0.1:3845/mcp';

function nowIso() {
  return new Date().toISOString();
}

function readJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseSseData(text) {
  // Very small SSE parser: collect "data: ..." lines and parse JSON.
  const lines = text.split(/\r?\n/);
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6));
    }
  }
  for (const data of dataLines) {
    const parsed = readJsonSafely(data);
    if (parsed) return parsed;
  }
  return null;
}

async function mcpRequest({ url, sessionId, method, params }) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  const payload = parseSseData(text) || readJsonSafely(text);
  return { res, payload, text };
}

async function loadMcpEndpoint() {
  try {
    const raw = await fs.readFile(MCP_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const server = parsed?.mcpServers?.figma;
    if (server?.url) return server.url;
  } catch {
    // Ignore and fall back to default.
  }
  return DEFAULT_ENDPOINT;
}

function buildOutput({ endpoint, toolsUsed, data }) {
  return {
    _source: {
      type: 'figma-mcp',
      endpoint,
      exportedAt: nowIso()
    },
    toolsUsed,
    data
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n');
}

async function main() {
  const endpoint = await loadMcpEndpoint();
  const toolsUsed = [];

  let sessionId;
  try {
    const init = await mcpRequest({
      url: endpoint,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'ui-foundations', version: '0.1' }
      }
    });

    sessionId = init.res.headers.get('mcp-session-id');
    if (!sessionId) {
      throw new Error('Missing mcp-session-id header');
    }

    const toolList = await mcpRequest({
      url: endpoint,
      sessionId,
      method: 'tools/list'
    });

    toolsUsed.push('tools/list');

    const tools = toolList.payload?.result?.tools || [];
    const toolNames = new Set(tools.map((t) => t.name));

    let variablesPayload = null;
    if (toolNames.has('get_variable_defs')) {
      const vars = await mcpRequest({
        url: endpoint,
        sessionId,
        method: 'tools/call',
        params: {
          name: 'get_variable_defs',
          arguments: {
            clientLanguages: 'javascript',
            clientFrameworks: 'unknown'
          }
        }
      });
      toolsUsed.push('tools/call:get_variable_defs');
      variablesPayload = vars.payload;
    }

    const data = {
      toolsAvailable: tools.map((t) => t.name),
      variables: variablesPayload
    };

    const outputs = {
      'tokens/core/_from-mcp.json': buildOutput({ endpoint, toolsUsed, data }),
      'tokens/color/_from-mcp.light.json': buildOutput({ endpoint, toolsUsed, data }),
      'tokens/color/_from-mcp.dark.json': buildOutput({ endpoint, toolsUsed, data }),
      'tokens/semantics/_from-mcp.json': buildOutput({ endpoint, toolsUsed, data }),
      'tokens/components/_from-mcp.json': buildOutput({ endpoint, toolsUsed, data })
    };

    for (const [filePath, payload] of Object.entries(outputs)) {
      await writeJson(filePath, payload);
    }

    console.log('Files written:');
    for (const filePath of Object.keys(outputs)) {
      console.log(`- ${filePath}`);
    }

    if (!toolNames.has('get_variable_defs')) {
      console.log('Note: get_variable_defs is not available; exported only tool list.');
      console.log(`Tools used: ${toolsUsed.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to connect to Figma MCP server.');
    console.error('MCP handshake is required; ensure your editor is MCP-configured.');
    console.error(`Endpoint: ${endpoint}`);
    console.error(String(error?.message || error));
    process.exit(1);
  }
}

main();
