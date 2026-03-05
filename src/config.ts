export const DEFAULT_MANIFEST_URL = 'https://salute-developers.github.io/plasma-mcp-docs/manifest.json';

export function getManifestUrl(): string {
    return process.env.PLASMA_MANIFEST_URL?.trim() || DEFAULT_MANIFEST_URL;
}
