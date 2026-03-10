# plasma-mcp-server

MCP server for Plasma component docs, working over stdio.

## Features

- Tools:
  - `list_components`
  - `get_installation_guide`
  - `get_nextjs_guide`
  - `get_functions`
  - `get_design_system_configuration`
  - `get_component`
  - `get_component_props`
  - `get_component_examples`

- Runtime validation of knowledge-base payloads with `zod`

## Data source

Default manifest URL:

`https://salute-developers.github.io/plasma-mcp-docs/manifest.json`

Override with environment variable:

`PLASMA_MANIFEST_URL`

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Inspect

```bash
npm run inspect
```

For local TypeScript run with inspector:

```bash
npm run inspect:dev
```
