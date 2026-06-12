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
    scheme: z.enum(['lm', 'execed']).default('lm'),
    // Slide de fin auto-injecté par la route (Questions dans un parcours
    // non terminal, Merci pour un one-shot ou le dernier deck du parcours).
    // `false` => la route n'ajoute rien (le deck gère sa propre fin, ex. le
    // template qui en fait la vitrine manuelle).
    autoClosing: z.boolean().default(true),
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
    // Theme par defaut du parcours. Modifiable a tout moment (contrairement aux
    // decks, figes). Le selecteur (ParcoursSchemeSwitcher) peut le surcharger en preview.
    scheme: z.enum(['lm', 'execed']).default('lm'),
    // Affiche le selecteur de theme LM/ExecEd sur la page (preview). Masque par
    // defaut (production) : le `scheme` du frontmatter fait alors loi.
    switcher: z.boolean().default(false),
    // Groupement optionnel des decks par jour (active les chips de filtre).
    // Chaque slug doit appartenir a `decks` (valide au rendu dans [slug].astro).
    // Absent => barre de filtre en recherche seule (pas de chips).
    days: z
      .array(
        z.object({
          label: z.string(),
          decks: z.array(z.string()).min(1),
        })
      )
      .optional(),
  }),
});

export const collections = { presentations, parcours };
