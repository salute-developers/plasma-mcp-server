#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
    const { server, manifestUrl } = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);
    console.error(`plasma-mcp-server running on stdio (manifest: ${manifestUrl})`);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`plasma-mcp-server failed: ${message}`);
    process.exit(1);
});
