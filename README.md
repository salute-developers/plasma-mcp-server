# Plasma MCP Server

An MCP (Model Context Protocol) server for the Plasma design system components. This server provides access to component documentation, API references, and code examples for all Plasma UI components.

## Features

- **getting_started**: Get getting started information and quick start guide
- **list_components**: Get a complete list of all available Plasma components (fetches from localhost:8080/components.json)
- **get_component_api**: Get detailed props, types, and configuration options for any component (fetches from localhost:8080/components/{name}/{name}-api.txt)
- **get_component_example**: Retrieve code examples and usage patterns for any component (fetches from localhost:8080/components/{name}/{name}-examples.txt)
- **list_themes**: List available themes (stub implementation)
- **get_theme**: Get detailed design tokens for a theme (stub implementation)

## Data Source

The server fetches live data from a Plasma documentation server. The server URL is configurable via environment variables.

### Environment Configuration

The server supports different environments:

- **Development**: Uses local server at `http://localhost:8080` (default)
- **Production**: Uses static server at `https://salute-developers.github.io/plasma-mcp-docs`

### Environment Files

- `.env` - Default environment (development)
- `.env.development` - Local development configuration
- `.env.production` - Production configuration

### Required Endpoints

Both servers must provide:
- `GET /components.json` - List of all components
- `GET /components/{componentName}/{componentName}-api.txt` - Component API documentation
- `GET /components/{componentName}/{componentName}-examples.txt` - Component examples

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

#### Development Mode (Local Server with Watch)
```bash
npm run start:dev
# or
NODE_ENV=development npx tsx src/index.ts
```

#### Production Mode (Static Server)
```bash
npm run start:prod
# or
NODE_ENV=production npm start
```

#### Default Mode
```bash
npm start
```

The server runs on stdio and can be used with MCP-compatible clients.

### Testing with MCP Inspector

For testing and debugging, you can use the MCP Inspector:

#### Development Mode (with Watch)
```bash
npm run inspect:dev
```

#### Production Mode
```bash
npm run inspect:prod
```

#### Default Mode
```bash
npm run inspect
```

This will start the MCP Inspector where you can:
- Test all available tools
- View tool schemas and parameters
- See real-time responses
- Debug HTTP requests to your documentation server
- Interact with the MCP server through a web interface

**Development Mode Benefits:**
- Automatic TypeScript compilation with `tsx`
- No need to manually rebuild after code changes
- Real-time development with instant feedback

To stop the inspector:
```bash
npm run inspect:stop
```

### Available Components

The server provides access to 70+ Plasma components including:

- **Layout**: Grid, ElasticGrid, ViewContainer
- **Navigation**: Breadcrumbs, Tabs, Steps, Pagination
- **Input**: TextField, TextArea, Select, Checkbox, RadioBox, Switch
- **Display**: Card, List, Table, Image, Avatar, Badge
- **Feedback**: Toast, Notification, Progress, Spinner, Skeleton
- **Overlay**: Modal, Popover, Tooltip, Drawer, Sheet
- **Media**: AudioPlayer, PreviewGallery, Upload components
- **And many more...**

### Example Usage

#### Get Getting Started Information
```json
{
  "tool": "getting_started",
  "arguments": {}
}
```

#### List All Components
```json
{
  "tool": "list_components",
  "arguments": {}
}
```

#### Get Component API
```json
{
  "tool": "get_component_api",
  "arguments": {
    "component_name": "Button"
  }
}
```

#### Get Component Examples
```json
{
  "tool": "get_component_example",
  "arguments": {
    "component_name": "Card"
  }
}
```

## Development

### Project Structure

```
src/
  index.ts          # Main server implementation
package.json        # Dependencies and scripts
tsconfig.json       # TypeScript configuration
README.md          # This file
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Component Data

The server currently uses mock data for component APIs and examples. In a production implementation, this data would be:

1. Scraped from the official Plasma documentation
2. Fetched from a component registry API
3. Generated from TypeScript definitions

## Themes

Theme functionality is currently implemented as stubs. Future versions will include:

- Real design token data
- Theme switching capabilities
- Color palette information
- Typography scales
- Spacing systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Links

- [Plasma Design System](https://plasma.sberdevices.ru/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)


