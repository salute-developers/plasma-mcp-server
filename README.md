# plasma-mcp-server

MCP server for Plasma component docs, working over stdio.

## Features

- Tools:
  - `list_components`
  - `get_installation_guide`
  - `get_nextjs_guide`
  - `get_functions`
  - `get_design_system_configuration`
  - `get_form_guide`
  - `get_tokens`
  - `get_component`
  - `get_component_props`
  - `get_component_examples`

- Runtime validation of knowledge-base payloads with `zod`

## Data source

Manifest URL format:

`https://plasma.sberdevices.ru/mcp/<lib>/<version>/manifest.json`

Defaults:

- `lib`: `plasma-web`
- `version`: `latest`

Supported `lib` values:

- `plasma-web`
- `plasma-b2c`
- `plasma-giga`
- `sdds-finai`

If the requested `version` is not found, the server falls back to `latest`.

## Install

```bash
npx -y @salutejs/sdds-mcp@latest
```

## Install specific lib and version

```bash
npx -y @salutejs/sdds-mcp@latest --lib plasma-web --version latest
```
