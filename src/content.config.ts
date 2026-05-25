// src/content.config.ts
// `z` est déprécié dans astro:content depuis Astro 5+ (et astro:schema l'est
// aussi en Astro 6, prévu pour suppression en Astro 7). Source officielle :
// `astro/zod`, qui expose l'instance Zod bundlée avec Astro (cf. node_modules/
// astro/client.d.ts -> declare module 'astro:schema' avec @deprecated).
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const presentations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/presentations' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    short: z.string().optional(),
    date: z.coerce.date(),
    updated: z.string().optional(),
    type: z.enum(['cours', 'commercial', 'workshop', 'evenement']),
    unlisted: z.boolean().default(false),
    cover: z.string().optional(),
    description: z.string().optional(),
  }),
});

// Parcours : portail qui regroupe plusieurs decks (presentations) sous un theme commun.
// Generique : peut servir pour un cours complet, une serie commerciale, un workshop
// decoupe en sessions, un programme de formation. Le portail n'est pas une presentation,
// c'est une page index qui liste les decks dans un ordre defini.
const parcours = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/parcours' }),
  schema: z.object({
    title: z.string(),
    short: z.string().optional(),
    eyebrow: z.string().optional(),
    description: z.string().optional(),
    highlight: z.string().optional(),
    cover: z.string().optional(),
    date: z.coerce.date().optional(),
    updated: z.string().optional(),
    unlisted: z.boolean().default(false),
    // Liste ordonnee des slugs de decks. Chaque entree doit correspondre a un fichier
    // existant dans src/content/presentations/<slug>.mdx (validation au build).
    decks: z.array(z.string()).min(1),
  }),
});

export const collections = { presentations, parcours };
