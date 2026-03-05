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
            description: 'Return all components from the knowledge base index.',
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
            description: 'Return full component passport JSON.',
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
            description: 'Return only component props from its passport.',
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
            description: 'Return only component examples from its passport.',
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

    server.registerResource(
        'button-component-resource',
        'ds://components/Button',
        {
            title: 'Button Component Passport',
            description: 'Full Button component passport from Plasma knowledge base.',
            mimeType: 'application/json',
        },
        async (uri) => {
            const component = await kb.getComponent('Button');
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'application/json',
                        text: JSON.stringify(component, null, 2),
                    },
                ],
            };
        },
    );

    return {
        server,
        manifestUrl,
    };
}
