import { ZodSchema } from 'zod';
import {
    componentPassportSchema,
    componentsIndexSchema,
    manifestSchema,
    type ComponentIndexItem,
    type ComponentPassport,
    type ComponentsIndex,
    type Manifest,
} from './schemas.js';

export class ComponentNotFoundError extends Error {
    constructor(componentName: string, available: string[]) {
        super(`Component "${componentName}" not found. Available: ${available.join(', ')}`);
        this.name = 'ComponentNotFoundError';
    }
}

type ComponentsIndexContext = {
    url: string;
    data: ComponentsIndex;
};

export class PlasmaKnowledgeBaseClient {
    private readonly manifestUrl: string;
    private manifestPromise?: Promise<Manifest>;
    private componentsIndexContextPromise?: Promise<ComponentsIndexContext>;
    private componentCache = new Map<string, Promise<ComponentPassport>>();

    constructor(manifestUrl: string) {
        this.manifestUrl = manifestUrl;
    }

    async listComponents(): Promise<ComponentIndexItem[]> {
        const context = await this.getComponentsIndexContext();
        return context.data.items;
    }

    async getComponent(componentName: string): Promise<ComponentPassport> {
        const { context, item } = await this.resolveComponentItem(componentName);
        const cacheKey = item.name;
        const cached = this.componentCache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const loadPromise = this.loadComponent(context.url, item).catch((error) => {
            this.componentCache.delete(cacheKey);
            throw error;
        });

        this.componentCache.set(cacheKey, loadPromise);
        return loadPromise;
    }

    async getComponentProps(componentName: string) {
        const component = await this.getComponent(componentName);
        return component.api.props;
    }

    async getComponentExamples(componentName: string) {
        const component = await this.getComponent(componentName);
        return component.examples;
    }

    private async getManifest(): Promise<Manifest> {
        if (!this.manifestPromise) {
            this.manifestPromise = fetchJson(this.manifestUrl, manifestSchema, 'manifest');
        }

        return this.manifestPromise;
    }

    private async getComponentsIndexContext(): Promise<ComponentsIndexContext> {
        if (!this.componentsIndexContextPromise) {
            this.componentsIndexContextPromise = this.loadComponentsIndexContext();
        }

        return this.componentsIndexContextPromise;
    }

    private async loadComponentsIndexContext(): Promise<ComponentsIndexContext> {
        const manifest = await this.getManifest();
        const componentsIndexUrl = new URL(manifest.paths.componentsIndex, this.manifestUrl).toString();
        const data = await fetchJson(componentsIndexUrl, componentsIndexSchema, 'components index');

        return {
            url: componentsIndexUrl,
            data,
        };
    }

    private async loadComponent(
        componentsIndexUrl: string,
        componentItem: ComponentIndexItem,
    ): Promise<ComponentPassport> {
        const componentUrl = new URL(componentItem.href, componentsIndexUrl).toString();
        return fetchJson(componentUrl, componentPassportSchema, `component ${componentItem.name}`);
    }

    private async resolveComponentItem(
        requestedName: string,
    ): Promise<{ context: ComponentsIndexContext; item: ComponentIndexItem }> {
        const context = await this.getComponentsIndexContext();

        const exact = context.data.items.find((item) => item.name === requestedName);
        if (exact) {
            return { context, item: exact };
        }

        const caseInsensitive = context.data.items.find(
            (item) => item.name.toLowerCase() === requestedName.toLowerCase(),
        );

        if (caseInsensitive) {
            return { context, item: caseInsensitive };
        }

        throw new ComponentNotFoundError(
            requestedName,
            context.data.items.map((item) => item.name),
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
