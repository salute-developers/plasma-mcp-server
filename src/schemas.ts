import { z } from 'zod';

const manifestPathsSchema = z
    .object({
        components: z.string().min(1).optional(),
        componentsIndex: z.string().min(1).optional(),
    })
    .catchall(z.string().min(1))
    .refine((paths) => Boolean(paths.components ?? paths.componentsIndex), {
        message: 'paths must include components or componentsIndex',
    });

export const manifestSchema = z.object({
    builtAt: z.string(),
    source: z
        .object({
            repo: z.string().url(),
        })
        .passthrough(),
    paths: manifestPathsSchema,
});

export const knowledgeBaseIndexItemSchema = z.object({
    name: z.string().min(1),
    href: z.string().min(1),
    summary: z.string().optional(),
    category: z.string().optional(),
});

export const knowledgeBaseIndexPayloadSchema = z.union([
    z.array(knowledgeBaseIndexItemSchema),
    z.object({
        items: z.array(knowledgeBaseIndexItemSchema),
    }),
]);

export const componentPropSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
    description: z.string().optional(),
});

export const componentExampleSchema = z.object({
    title: z.string().min(1),
    snippet: z.string().min(1),
});

export const componentPassportSchema = z
    .object({
        name: z.string().min(1),
        package: z.string().optional(),
        category: z.string().optional(),
        summary: z.string().optional(),
        api: z.object({
            props: z.array(componentPropSchema),
        }),
        examples: z.array(componentExampleSchema),
    })
    .passthrough();

export const installationGuideSchema = z
    .object({
        name: z.string().min(1),
        package: z.string().optional(),
        category: z.string().optional(),
        summary: z.string().optional(),
    })
    .passthrough();

export const manifestSectionSchema = z.object({
    name: z.string().min(1),
    href: z.string().min(1),
});

export function normalizeKnowledgeBaseIndex(
    value: KnowledgeBaseIndexPayload,
): KnowledgeBaseIndexItem[] {
    return Array.isArray(value) ? value : value.items;
}

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestSection = z.infer<typeof manifestSectionSchema>;
export type KnowledgeBaseIndexPayload = z.infer<typeof knowledgeBaseIndexPayloadSchema>;
export type KnowledgeBaseIndex = KnowledgeBaseIndexItem[];
export type KnowledgeBaseIndexItem = z.infer<typeof knowledgeBaseIndexItemSchema>;
export type ComponentPassport = z.infer<typeof componentPassportSchema>;
export type InstallationGuide = z.infer<typeof installationGuideSchema>;
