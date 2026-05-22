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

### Centrage vertical du contenu — RÈGLE ABSOLUE (lis attentivement, Claude)

⚠️ **Le titre d'une slide reste TOUJOURS fixe en haut**, à la même position spatiale sur toutes les slides. Le contenu sous le titre est centré dans l'**espace restant** (entre le bas du titre et le bas de la slide). Il NE FAUT PAS centrer tout (titre + contenu) comme un bloc — sinon le titre dérive vers le milieu selon la hauteur du contenu, ce que Thomas a déjà signalé une dizaine de fois.

**Comment c'est implémenté** (`src/styles/slides.css`) :

```css
.reveal section {
  padding: 80px 96px;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  /* PAS de justify-content: center ! Le titre reste en haut (flex-start par défaut). */
}

.reveal section > .slide-title + * {
  flex: 1 1 auto !important;   /* le body prend tout l'espace restant */
  min-height: 0 !important;
}
```

**Chaque composant slide** ajoute son centrage interne dans son `.xxx-slide__body` :
- Si le body est `display: grid` → ajouter `align-content: center`
- Si le body est `display: flex; flex-direction: column` → ajouter `justify-content: center`
- Si le body est `display: flex; flex-direction: row` → ajouter `align-items: center`

**Slides "structurelles"** (Cover, Section, Closing, AboutMe, AboutMeBullets, Statement, Quote, Timer, BigImage, ImageGrid, Title) — n'utilisent PAS SlideTitle, elles ont leur propre layout avec `justify-content: center !important` sur la section (h1 monumental, watermark, etc.). Leur règle override la nôtre, c'est intentionnel.

**Ne jamais** :
- Ajouter `justify-content: center` sur `.reveal section` global → casse la position du titre
- Oublier `align-content: center` (grid) ou `justify-content: center` (flex) sur le body d'une nouvelle slide → contenu collé sous le titre, blanc en bas
- Centrer un titre par lui-même (genre `text-align` ou marges magiques) → utiliser SlideTitle

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

## Sondages live

Deux composants slides : `<Poll>` (QCM) et `<WordCloud>` (nuage de mots).

```mdx
<Poll
  id="vote-clarte"
  question="Cette session t'a paru ?"
  options={["Très claire", "Claire", "Confuse"]}
/>

<WordCloud
  id="mots-cles"
  question="Un mot pour résumer ?"
/>
```

Le présentateur clique "Démarrer le sondage" sur la slide, un QR + URL courte apparaissent. Les participants scannent et votent. Le graphique se rafraîchit toutes les 1.5s (max ~1.7s de latence).

Boutons sur la slide :
- **Démarrer** : initialise une session (génère token court 6 chars)
- **Figer** : verrouille les votes, snapshot persistant dans Cloudflare KV
- **Reset** : remet à zéro sans changer le token

Workflow détaillé et architecture : `docs/superpowers/specs/2026-05-21-live-polls-design.md`.

Variable d'env requise : `PUBLIC_LM_POLLS_URL` (URL du worker `lm-polls`), à configurer dans `.env.local` et dans Cloudflare Pages env vars.

## Ne JAMAIS

- Ajouter Sveltia CMS (édition directe en code).
- Mettre des assets PPT/PDF/RAW dans le repo (toujours `source/` gitignored).
- Modifier les slides en mode présentation directement (toujours via MDX + composants).
