const MANIFEST_BASE_URL = 'https://plasma.sberdevices.ru/mcp';

export const SUPPORTED_LIBS = [
    'plasma-web',
    'plasma-b2c',
    'plasma-giga',
    'sdds-finai',
    'sdds-cs',
    'sdds-netology',
    'sdds-platform-ai',
    'sdds-serv',
] as const;
export const DEFAULT_LIB = 'plasma-web';
export const DEFAULT_VERSION = 'latest';

export type SupportedLib = (typeof SUPPORTED_LIBS)[number];

export type ManifestConfig = {
    lib: SupportedLib;
    version: string;
    requestedVersion: string;
    manifestUrl: string;
    usedVersionFallback: boolean;
};

type ParsedArgs = {
    lib?: string;
    version?: string;
};

export async function getManifestConfig(argv = process.argv.slice(2)): Promise<ManifestConfig> {
    const args = parseCliArgs(argv);
    const lib = parseLib(args.lib ?? DEFAULT_LIB);
    const requestedVersion = parseVersion(args.version ?? DEFAULT_VERSION);
    const version = await resolveVersion(lib, requestedVersion);

    return {
        lib,
        version,
        requestedVersion,
        manifestUrl: buildManifestUrl(lib, version),
        usedVersionFallback: version !== requestedVersion,
    };
}

function parseCliArgs(argv: string[]): ParsedArgs {
    const parsed: ParsedArgs = {};

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (!arg) {
            continue;
        }

        if (arg.startsWith('--lib=')) {
            parsed.lib = arg.slice('--lib='.length);
            continue;
        }

        if (arg === '--lib') {
            const value = argv[index + 1];
            if (!value || value.startsWith('--')) {
                throw new Error('Flag --lib requires a value');
            }

            parsed.lib = value;
            index += 1;
            continue;
        }

        if (arg.startsWith('--version=')) {
            parsed.version = arg.slice('--version='.length);
            continue;
        }

        if (arg === '--version') {
            const value = argv[index + 1];
            if (!value || value.startsWith('--')) {
                throw new Error('Flag --version requires a value');
            }

            parsed.version = value;
            index += 1;
        }
    }

    return parsed;
}

function parseLib(lib: string): SupportedLib {
    if (isSupportedLib(lib)) {
        return lib;
    }

    throw new Error(`Unsupported lib "${lib}". Expected one of: ${SUPPORTED_LIBS.join(', ')}`);
}

function isSupportedLib(value: string): value is SupportedLib {
    return SUPPORTED_LIBS.includes(value as SupportedLib);
}

function parseVersion(version: string): string {
    if (version.length > 0) {
        return version;
    }

    throw new Error('Flag --version requires a non-empty value');
}

function buildManifestUrl(lib: SupportedLib, version: string): string {
    return `${MANIFEST_BASE_URL}/${encodeURIComponent(lib)}/${encodeURIComponent(version)}/manifest.json`;
}

async function resolveVersion(lib: SupportedLib, requestedVersion: string): Promise<string> {
    if (requestedVersion === DEFAULT_VERSION) {
        return DEFAULT_VERSION;
    }

    const requestedManifestUrl = buildManifestUrl(lib, requestedVersion);
    const response = await fetch(requestedManifestUrl);

    if (response.ok) {
        return requestedVersion;
    }

    if (response.status === 404) {
        return DEFAULT_VERSION;
    }

    throw new Error(
        `Failed to resolve manifest for ${lib}@${requestedVersion}: ${response.status} ${response.statusText}`,
    );
}
