import { z } from 'zod';

export const manifestSchema = z.object({
    builtAt: z.string(),
    source: z
        .object({
            repo: z.string().url(),
        })
        .passthrough(),
    paths: z.object({
        componentsIndex: z.string().min(1),
    }),
});

export const componentIndexItemSchema = z.object({
    name: z.string().min(1),
    href: z.string().min(1),
    summary: z.string().optional(),
    category: z.string().optional(),
});

export const componentsIndexSchema = z.object({
    items: z.array(componentIndexItemSchema),
});

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

export const componentPassportSchema = z.object({
    name: z.string().min(1),
    package: z.string().optional(),
    category: z.string().optional(),
    summary: z.string().optional(),
    api: z.object({
        props: z.array(componentPropSchema),
    }),
    examples: z.array(componentExampleSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ComponentsIndex = z.infer<typeof componentsIndexSchema>;
export type ComponentIndexItem = z.infer<typeof componentIndexItemSchema>;
export type ComponentPassport = z.infer<typeof componentPassportSchema>;
