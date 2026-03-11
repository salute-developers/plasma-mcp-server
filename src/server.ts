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
                return asTextResult(components);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_installation_guide',
        {
            title: 'Installation Guide',
            description:
                'This tool retrieves the Plasma installation and setup guide. It describes how to hook a theme and tokens.',
            inputSchema: {},
        },
        async () => {
            try {
                const guide = await kb.getInstallationGuide();
                return asTextResult(guide);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_nextjs_guide',
        {
            title: 'Next.js Guide',
            description:
                'This tool retrieves the Plasma guide for connecting the library in a Next.js project.',
            inputSchema: {},
        },
        async () => {
            try {
                const guide = await kb.getNextJsGuide();
                return asTextResult(guide);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_functions',
        {
            title: 'Functions',
            description:
                'This tool retrieves the combined description of imported Plasma hocs, hooks, mixins, and utils from the functions section.',
            inputSchema: {},
        },
        async () => {
            try {
                const functions = await kb.getFunctions();
                return asTextResult(functions);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_design_system_configuration',
        {
            title: 'Design System Configuration',
            description:
                'This tool retrieves the combined Plasma design system configuration, including typography, colors, and spacing documentation.',
            inputSchema: {},
        },
        async () => {
            try {
                const configuration = await kb.getDesignSystemConfiguration();
                return asTextResult(configuration);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_form_guide',
        {
            title: 'Form Guide',
            description:
                'This tool retrieves the combined Plasma form guides for native HTML forms, React Hook Form, and component support in these forms.',
            inputSchema: {},
        },
        async () => {
            try {
                const guide = await kb.getFormGuide();
                return asTextResult(guide);
            } catch (error) {
                return asErrorResult(error);
            }
        },
    );

    server.registerTool(
        'get_tokens',
        {
            title: 'Tokens',
            description:
                'This tool retrieves the list of Plasma tokens that can be reused in custom components.',
            inputSchema: {},
        },
        async () => {
            try {
                const tokens = await kb.getTokens();
                return asTextResult(tokens);
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
