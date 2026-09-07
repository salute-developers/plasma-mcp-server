import { iconManifestSchema } from './schemas.js';
import type { IconManifest } from './icon-search.js';

const ICONS_MANIFEST_URL = 'https://plasma.sberdevices.ru/mcp/sdds-icons/manifest.json';

export class IconManifestClient {
    private manifestPromise: Promise<IconManifest> | undefined;

    async getManifest(): Promise<IconManifest> {
        if (!this.manifestPromise) {
            this.manifestPromise = this.fetchManifest();
        }

        try {
            return await this.manifestPromise;
        } catch (error) {
            // Повторный вызов должен снова попробовать скачать манифест после временной ошибки.
            this.manifestPromise = undefined;
            throw error;
        }
    }

    private async fetchManifest(): Promise<IconManifest> {
        const response = await fetch(ICONS_MANIFEST_URL);

        if (!response.ok) {
            throw new Error(`Icons manifest: failed to fetch ${ICONS_MANIFEST_URL} (${response.status})`);
        }

        return iconManifestSchema.parse(await response.json());
    }
}
