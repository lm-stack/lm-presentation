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
- Reveal.js 6 pour le mode plein écran (types embarqués, pas de @types/reveal.js)
- astro-icon + Phosphor Icons
- Cloudflare Pages

## Structure

- `src/components/slides/` : layouts visuels génériques (Cover, Statement, TableSlide, etc.)
- `src/components/SlideTitle.astro` : composant titre unifié, utilisé par tous les slides à contenu
- `src/content/presentations/` : fichiers MDX, un par présentation
- `src/layouts/Deck.astro` : mode présentation (Reveal init)
- `src/layouts/Handout.astro` : mode handout (PDF 1up/2up/3up)
- `src/pages/p/[slug].astro` : route présentation
- `src/pages/p/[slug]/handout/[mode].astro` : route handout
- `source/` : archive originaux (gitignored, jamais publié)

## Règles visuelles INTANGIBLES

### Zone titre d'une slide à contenu

Composant : `src/components/SlideTitle.astro`. Toujours rendu dans cet ordre exact, RIEN d'autre entre ces trois éléments :

1. `<h2>` — le titre
2. `<p class="slide-subtitle">` — le sous-titre (optionnel)
3. `<span class="slide-divider"></span>` — la barre jaune

Rythme imposé dans `src/styles/slides.css` :
- 4px entre `h2` et `.slide-subtitle`
- 32px entre `.slide-subtitle` et `.slide-divider`
- 48px sous `.slide-divider` (espace avant le contenu)

**Aucun `eyebrow`, badge, intro, ou autre élément ne doit s'insérer entre le titre et la bordure jaune.** Si un composant viole ça (eyebrow rendu avant le SlideTitle par exemple), retirer l'élément du composant ET de tous les appels MDX.

Cas particuliers admis (slides "structurelles" avec leur propre identité visuelle, qui n'utilisent PAS SlideTitle) :
- `Cover` : page de garde, h1 monumental + watermark, peut avoir un eyebrow
- `Section` : transition de section, gros numéro + h2 + rule
- `Closing` : fin de deck, watermark glyph + h1
- `AboutMe`, `AboutMeBullets` : présentations de l'intervenant
- `Timer` : pause avec compte à rebours
- `Statement`, `Quote` : citations / déclarations fortes

### Centrage vertical du contenu

Toutes les slides centrent leur contenu sur la hauteur par défaut (`.reveal section { justify-content: center }`). Si une slide laisse un blanc en bas, c'est qu'un composant override avec `justify-content: flex-start !important` — à retirer (sauf cas explicite type `Custom.astro` qui propose 3 variantes top/center/bottom).

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
