import { ZodSchema } from 'zod';
import {
    componentPassportSchema,
    installationGuideSchema,
    knowledgeBaseIndexPayloadSchema,
    manifestSchema,
    normalizeKnowledgeBaseIndex,
    type ComponentPassport,
    type InstallationGuide,
    type KnowledgeBaseIndex,
    type KnowledgeBaseIndexItem,
    type Manifest,
    type ManifestSection,
} from './schemas.js';

export class ComponentNotFoundError extends Error {
    constructor(componentName: string, available: string[]) {
        super(`Component "${componentName}" not found. Available: ${available.join(', ')}`);
        this.name = 'ComponentNotFoundError';
    }
}

type SectionIndexContext = {
    section: ManifestSection;
    url: string;
    data: KnowledgeBaseIndex;
};

export class PlasmaKnowledgeBaseClient {
    private readonly manifestUrl: string;

    constructor(manifestUrl: string) {
        this.manifestUrl = manifestUrl;
    }

    async listComponents(): Promise<KnowledgeBaseIndexItem[]> {
        const context = await this.getComponentsIndexContext();
        return context.data;
    }

    async getComponent(componentName: string): Promise<ComponentPassport> {
        const { context, item } = await this.resolveComponentItem(componentName);
        return this.loadComponent(context.url, item);
    }

    async getComponentProps(componentName: string) {
        const component = await this.getComponent(componentName);
        return component.api.props;
    }

    async getComponentExamples(componentName: string) {
        const component = await this.getComponent(componentName);
        return component.examples;
    }

    async getInstallationGuide(): Promise<InstallationGuide> {
        const section = await this.getIntroSection();
        const indexUrl = new URL(section.href, this.manifestUrl).toString();
        const payload = await fetchJson(indexUrl, knowledgeBaseIndexPayloadSchema, `${section.name} index`);
        const items = normalizeKnowledgeBaseIndex(payload);
        const guideItem = items[0];

        if (!guideItem) {
            throw new Error('intro index: installation guide not found');
        }

        const guideUrl = new URL(guideItem.href, indexUrl).toString();
        return fetchJson(guideUrl, installationGuideSchema, 'installation guide');
    }

    private async getManifest(): Promise<Manifest> {
        return fetchJson(this.manifestUrl, manifestSchema, 'manifest');
    }

    private async getComponentsSection(): Promise<ManifestSection> {
        const manifest = await this.getManifest();

        for (const [rawName, href] of Object.entries(manifest.paths)) {
            if (!href) {
                continue;
            }

            const name = rawName === 'componentsIndex' ? 'components' : rawName;
            if (name === 'components') {
                return { name, href };
            }
        }

        throw new Error('manifest: components section not found');
    }

    private async getIntroSection(): Promise<ManifestSection> {
        const manifest = await this.getManifest();

        for (const [rawName, href] of Object.entries(manifest.paths)) {
            if (!href) {
                continue;
            }

            if (rawName === 'intro') {
                return { name: rawName, href };
            }
        }

        throw new Error('manifest: intro section not found');
    }

    private async getComponentsIndexContext(): Promise<SectionIndexContext> {
        const section = await this.getComponentsSection();
        const indexUrl = new URL(section.href, this.manifestUrl).toString();
        const payload = await fetchJson(indexUrl, knowledgeBaseIndexPayloadSchema, `${section.name} index`);
        const data = normalizeKnowledgeBaseIndex(payload);

        return {
            section,
            url: indexUrl,
            data,
        };
    }

    private async loadComponent(
        sectionIndexUrl: string,
        componentItem: KnowledgeBaseIndexItem,
    ): Promise<ComponentPassport> {
        const componentUrl = new URL(componentItem.href, sectionIndexUrl).toString();
        return fetchJson(componentUrl, componentPassportSchema, `component ${componentItem.name}`);
    }

    private async resolveComponentItem(
        requestedName: string,
    ): Promise<{ context: SectionIndexContext; item: KnowledgeBaseIndexItem }> {
        const context = await this.getComponentsIndexContext();

        const exact = context.data.find((item) => item.name === requestedName);
        if (exact) {
            return { context, item: exact };
        }

        const caseInsensitive = context.data.find(
            (item) => item.name.toLowerCase() === requestedName.toLowerCase(),
        );

        if (caseInsensitive) {
            return { context, item: caseInsensitive };
        }

        throw new ComponentNotFoundError(
            requestedName,
            context.data.map((entry) => entry.name),
        );
    }
}

async function fetchJson<T>(url: string, schema: ZodSchema<T>, label: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${label}: failed to fetch ${url} (${response.status})`);
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch {
        throw new Error(`${label}: invalid JSON at ${url}`);
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .slice(0, 5)
            .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
            .join('; ');

        throw new Error(`${label}: schema validation failed (${issues})`);
    }

    return parsed.data;
}
