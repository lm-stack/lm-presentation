# CLAUDE.md - lm-presentation

> ⚠️ UTF-8 obligatoire (accents complets : é, è, à, ç...). Les règles détaillées sont découpées dans `.claude/rules/` (chargées automatiquement) : voir la table « Fichiers de règles » en bas.

## Contexte

Site `slides.lausanne.marketing` qui héberge les présentations Lausanne Marketing (cours, PPT commerciaux, workshops, événements). Astro statique + Reveal.js pour le mode plein écran.

Branding : Lausanne Marketing (charte calquée sur `lm/`). Pas de branding ExecEd même si le contenu d'origine venait de là.

Spec : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`

## Contexte par parcours

Pour chaque parcours, un fichier `docs/parcours/<slug>.md` qui contient : public cible, source brochure, philosophie pédagogique, historique des éditions, choix structurants. À consulter avant de toucher un deck d'un parcours.

Parcours documentés :

- [crm-data-automation](../docs/parcours/crm-data-automation.md) : HEC Lausanne ExecEd, juin 2026

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

## Commandes

- `npm run dev` : serveur local
- `npm run build` : build statique vers `dist/`
- `npm run preview` : preview du build

## Ne JAMAIS

- Ajouter Sveltia CMS (édition directe en code).
- Mettre des assets PPT/PDF/RAW dans le repo (toujours `source/` gitignored).
- Modifier les slides en mode présentation directement (toujours via MDX + composants).

## Fichiers de règles (`.claude/rules/`)

Chargés automatiquement à chaque session. À respecter pour tout travail sur les decks.

| Fichier | Contenu |
|---------|---------|
| `slides.md` | Règles visuelles INTANGIBLES : zone titre `SlideTitle`, centrage vertical (titre fixe en haut), safe area 48px, border-radius 4px, drop-shadows légères, header ExecEd, fond pearl uniforme, sous-titre `SubSectionHero` sur une ligne |
| `conventions.md` | UTF-8, pas d'em-dash dans les slides, nombres CHF suisses (`2'250 CHF`), pas d'emojis, nommage PascalCase / kebab-case |
| `polls.md` | Sondages live `<Poll>` / `<WordCloud>` : workflow présentateur, Cloudflare KV, variable `PUBLIC_LM_POLLS_URL` |
