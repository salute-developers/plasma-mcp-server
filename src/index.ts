#!/usr/bin/env node

// Отключаем проверку сертов, т.к. в сигме возникают проблемы с самоподписными сертами.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
    const { server, manifestConfig } = await createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    if (manifestConfig.usedVersionFallback) {
        console.error(
            `Requested ${manifestConfig.lib}@${manifestConfig.requestedVersion} was not found, falling back to ${manifestConfig.lib}@${manifestConfig.version}`,
        );
    }

    console.error(
        `mcp-server running on stdio (lib: ${manifestConfig.lib}, version: ${manifestConfig.version}, manifest: ${manifestConfig.manifestUrl})`,
    );
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`mcp-server failed: ${message}`);
    process.exit(1);
});
