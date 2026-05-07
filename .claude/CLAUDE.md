# CLAUDE.md - lm-presentation

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

## Contexte

Site `slides.lausanne.marketing` qui héberge les présentations Lausanne Marketing (cours, PPT commerciaux, workshops, événements). Astro statique + Reveal.js pour le mode plein écran.

Branding : Lausanne Marketing (charte calquée sur `lm/`). Pas de branding ExecEd même si le contenu d'origine venait de là.

Spec : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`

## Stack

- Astro 6 (statique)
- Tailwind CSS v4 via `@tailwindcss/vite`
- MDX pour les fichiers de présentation
- Reveal.js 5 pour le mode plein écran
- astro-icon + Phosphor Icons
- Pagefind pour la recherche (mode lecture)
- Cloudflare Pages

## Structure

- `src/components/slides/` : layouts visuels génériques (Cover, Statement, TableSlide, etc.)
- `src/components/modules/` : modules de contenu réutilisables (StackPetiteStructure, FunnelTOFUMOFUBOFU, etc.)
- `src/content/presentations/` : fichiers MDX, un par présentation
- `src/layouts/Deck.astro` : mode présentation (Reveal init)
- `src/layouts/DeckReading.astro` : mode lecture (scroll)
- `src/pages/p/[slug].astro` : route présentation
- `src/pages/p/[slug]/lecture.astro` : route lecture
- `source/` : archive originaux (gitignored, jamais publié)

## Commandes

- `npm run dev` : serveur local
- `npm run build` : build statique vers `dist/`
- `npm run preview` : preview du build

## Conventions

- Pas de tirets cadratins ni demi-cadratins dans les contenus de slides (deux-points, virgules, parenthèses).
- Français suisse pour les nombres : `2'250 CHF`.
- Devise CHF par défaut.
- Pas d'emojis dans les slides.
- Nommage modules en PascalCase, présentations en kebab-case.

## Ne JAMAIS

- Ajouter Sveltia CMS (édition directe en code).
- Mettre des assets PPT/PDF/RAW dans le repo (toujours `source/` gitignored).
- Modifier les slides en mode présentation directement (toujours via MDX + composants).
