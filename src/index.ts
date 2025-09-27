#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

// Server configuration
const PLASMA_SERVER_URL = process.env.PLASMA_SERVER_URL || "http://localhost:8080";
const NODE_ENV = process.env.NODE_ENV || "development";

console.error(`Plasma MCP Server starting in ${NODE_ENV} mode`);
console.error(`Using server URL: ${PLASMA_SERVER_URL}`);

// Component validation
let cachedComponents: string[] | null = null;

async function getValidComponentNames(): Promise<string[]> {
  if (cachedComponents) {
    return cachedComponents;
  }
  
  try {
    const components = await fetchComponents();
    cachedComponents = components;
    return components;
  } catch (error) {
    console.error("Failed to fetch components for validation:", error);
    // Return empty array if we can't fetch components
    return [];
  }
}

async function validateComponentName(componentName: string): Promise<boolean> {
  const validNames = await getValidComponentNames();
  return validNames.includes(componentName);
}

// HTTP fetching functions
async function fetchComponents(): Promise<any[]> {
  const response = await fetch(`${PLASMA_SERVER_URL}/components.json`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  const data = JSON.parse(text);
  
  // Handle the actual structure returned by your server
  if (data && Array.isArray(data.components)) {
    return data.components;
  }
  
  // Fallback: if data is already an array
  if (Array.isArray(data)) {
    return data;
  }
  
  throw new Error(`Unexpected data structure from server: ${typeof data}`);
}

async function fetchComponentAPI(componentName: string): Promise<any> {
  const response = await fetch(`${PLASMA_SERVER_URL}/components/${componentName}/${componentName}-api.txt`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  
  // Return the text content directly since it's markdown, not JSON
  return {
    componentName: componentName,
    content: text,
    contentType: "markdown"
  };
}

async function fetchComponentExamples(componentName: string): Promise<any> {
  const response = await fetch(`${PLASMA_SERVER_URL}/components/${componentName}/${componentName}-examples.txt`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  
  // Return the text content directly since it's markdown, not JSON
  return {
    componentName: componentName,
    content: text,
    contentType: "markdown"
  };
}


// Available themes (stub for now)
const THEMES = [
  {
    name: "Sber",
    description: "Sber brand theme with corporate colors and styling"
  },
  {
    name: "SberBox",
    description: "SberBox device theme with specific styling"
  },
  {
    name: "SberPortal",
    description: "SberPortal device theme with specific styling"
  }
];


// Create the MCP server
const server = new Server(
  {
    name: "plasma-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the tools
const tools: Tool[] = [
  {
    name: "getting_started",
    description: "Get getting started information for Plasma design system",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_components",
    description: "Get a complete list of all available Plasma components",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_component_api",
    description: "Get detailed props, types, and configuration options for any component",
    inputSchema: {
      type: "object",
      properties: {
        component_name: {
          type: "string",
          description: "Name of the component to get API documentation for",
        },
      },
      required: ["component_name"],
    },
  },
  {
    name: "get_component_example",
    description: "Retrieve code examples and usage patterns for any component",
    inputSchema: {
      type: "object",
      properties: {
        component_name: {
          type: "string",
          description: "Name of the component to get examples for",
        },
      },
      required: ["component_name"],
    },
  },
  {
    name: "list_themes",
    description: "List available themes (stub implementation)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_theme",
    description: "Get detailed design tokens for a theme (stub implementation)",
    inputSchema: {
      type: "object",
      properties: {
        theme_name: {
          type: "string",
          description: "Name of the theme to get design tokens for",
        },
      },
      required: ["theme_name"],
    },
  },
];

// Set up the tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "getting_started": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              title: "Plasma Design System - Getting Started",
              description: "Welcome to the Plasma design system! This MCP server provides access to component documentation, APIs, and examples.",
              quickStart: {
                steps: [
                  "1. Use 'list_components' to see all available components",
                  "2. Use 'get_component_api' to get detailed API documentation for any component",
                  "3. Use 'get_component_examples' to get code examples and usage patterns",
                  "4. Use 'list_themes' to see available themes (coming soon)",
                  "5. Use 'get_theme' to get design tokens for themes (coming soon)"
                ]
              },
              resources: {
                officialDocs: "https://plasma.sberdevices.ru/",
                github: "https://github.com/sberdevices/plasma",
                npm: "@sberdevices/plasma-ui"
              },
              note: "This server requires the Plasma documentation server to be running at localhost:8080 - no fallback data is provided"
            }, null, 2)
          },
        ],
      };
    }

    case "list_components": {
      const components = await fetchComponents();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              components: components,
              total: components.length
            }, null, 2)
          },
        ],
      };
    }

    case "get_component_api": {
      const componentName = args?.component_name as string;
      if (!componentName) {
        return {
          content: [
            {
              type: "text",
              text: "component_name parameter is required",
            },
          ],
          isError: true,
        };
      }

      // Validate component name
      const isValid = await validateComponentName(componentName);
      if (!isValid) {
        const validNames = await getValidComponentNames();
        return {
          content: [
            {
              type: "text",
              text: `Component "${componentName}" not found. Available components: ${validNames.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const apiData = await fetchComponentAPI(componentName);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(apiData, null, 2),
          },
        ],
      };
    }

    case "get_component_example": {
      const componentName = args?.component_name as string;
      if (!componentName) {
        return {
          content: [
            {
              type: "text",
              text: "component_name parameter is required",
            },
          ],
          isError: true,
        };
      }

      // Validate component name
      const isValid = await validateComponentName(componentName);
      if (!isValid) {
        const validNames = await getValidComponentNames();
        return {
          content: [
            {
              type: "text",
              text: `Component "${componentName}" not found. Available components: ${validNames.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const examples = await fetchComponentExamples(componentName);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(examples, null, 2),
          },
        ],
      };
    }

    case "list_themes": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              themes: THEMES,
              total: THEMES.length,
              note: "Theme functionality is currently a stub implementation"
            }, null, 2)
          },
        ],
      };
    }

    case "get_theme": {
      const themeName = args?.theme_name as string;
      if (!themeName) {
        return {
          content: [
            {
              type: "text",
              text: "theme_name parameter is required",
            },
          ],
          isError: true,
        };
      }
      const theme = THEMES.find(t => t.name.toLowerCase() === themeName.toLowerCase());
      
      if (!theme) {
        return {
          content: [
            {
              type: "text",
              text: `Theme "${themeName}" not found. Available themes: ${THEMES.map(t => t.name).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...theme,
              designTokens: {
                colors: ["Primary", "Secondary", "Accent"],
                typography: ["Heading", "Body", "Caption"],
                spacing: ["XS", "S", "M", "L", "XL"],
                note: "This is a stub implementation. Real design tokens would be fetched from the theme documentation."
              }
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Plasma MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
