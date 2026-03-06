import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getManifestUrl } from './config.js';
import { ComponentNotFoundError, PlasmaKnowledgeBaseClient } from './knowledge-base.js';

function formatError(error: unknown): string {
    if (error instanceof ComponentNotFoundError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Unknown error';
}

function asTextResult(data: unknown) {
    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}

function asErrorResult(error: unknown) {
    return {
        content: [
            {
                type: 'text' as const,
                text: formatError(error),
            },
        ],
        isError: true,
    };
}

export function createServer() {
    const manifestUrl = getManifestUrl();
    const kb = new PlasmaKnowledgeBaseClient(manifestUrl);

    const server = new McpServer({
        name: 'plasma-mcp-server',
        version: '1.0.0',
    });

    server.registerTool(
        'list_components',
        {
            title: 'List Components',
            description: 'This tool retrieves the names of all available PLASMA components.',
            inputSchema: {},
        },
        async () => {
            try {
                const components = await kb.listComponents();
                return asTextResult({
                    components,
                    total: components.length,
                });
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_component',
        {
            title: 'Get Component',
            description:
                'This tool provides complete information about any Plasma component, including properties, design props (size, variant, etc.), attributes, configuration options, and practical implementation examples—from basic usage to advanced scenarios with complete code snippets.',
            inputSchema: {
                name: z.string().min(1),
            },
        },
        async ({ name }) => {
            try {
                const component = await kb.getComponent(name);
                return asTextResult(component);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_component_props',
        {
            title: 'Get Component Props',
            description:
                'This tool provides comprehensive details about a specific Plasma component, including its properties, design-related props (such as size and variant), attributes, and available configuration options.',
            inputSchema: {
                name: z.string().min(1),
            },
        },
        async ({ name }) => {
            try {
                const props = await kb.getComponentProps(name);
                return asTextResult(props);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_component_examples',
        {
            title: 'Get Component Examples',
            description:
                'This tool retrieves example code and usage patterns with complete code snippets. Access practical implementation examples for any Plasma component: from basic usage to advanced configurations and common use cases.',
            inputSchema: {
                name: z.string().min(1),
            },
        },
        async ({ name }) => {
            try {
                const examples = await kb.getComponentExamples(name);
                return asTextResult(examples);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    return {
        server,
        manifestUrl,
    };
}
