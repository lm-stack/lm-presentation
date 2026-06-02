# CLAUDE.md - lm-presentation

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

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

### Safe area top/bottom — RÈGLE ABSOLUE

⚠️ **Tout contenu d'une slide doit respecter un espace minimum entre :**
- le bord supérieur de la slide et le premier élément (header, titre, ligne de séparation, etc.)
- le dernier élément (image, texte, card, item, etc.) et le bord inférieur de la slide

**Minimum non négociable : 48px en haut ET en bas.**

Implémentation : le `padding-top` et `padding-bottom` du conteneur `<section>` racine de chaque composant slide doit être ≥ 48px. La convention LM établie utilise `padding: 64px 96px !important` pour les composants ExecEd-style (`CoverHero`, `SectionHero`, `QuoteImage`, `AboutHero`, `ImageGridHero`, etc.), et 80px pour les slides à SlideTitle (`Default`, `BigImage`, etc.).

Si un layout requiert plus d'air pour respirer, monter le padding (96px, 120px). **Ne jamais descendre sous 48px.**

Concrètement pour les nouvelles grilles ou listes : les items doivent être contraints (`max-height` sur les `.xxx__item` quand ils grandissent en `1fr` rows) pour ne jamais venir coller le bord supérieur ou inférieur de la `<section>` racine.

### Border-radius cards et images — RÈGLE ABSOLUE

⚠️ **Toutes les cards et toutes les images encadrées d'un slide doivent utiliser `border-radius: 4px`.**

Pas de 8px, 12px, 16px ou autre valeur arbitraire. Le 4px uniforme garantit un langage visuel cohérent à travers tous les composants : `InfoCardsGrid`, `PeopleCards`, `NumberedSplit`, `ImageGridHero`, `AboutHero` photo, `CoverHero` image-card, `SectionHero` image, `TitleSplitImage` image, etc.

Exception unique : les cercles décoratifs (rond jaune `QuoteImage`, `Conventions__disc`, pastilles de profil avatars circulaires) qui utilisent `border-radius: 50%`.

### Drop-shadow cards et images — RÈGLE ABSOLUE

⚠️ **Dropshadows légères uniquement** sur les cards et images : convention LM `0 4px 12px -4px rgba(25, 25, 25, 0.08)` (ou tout au plus `0 6px 16px -6px rgba(25, 25, 25, 0.10)`).

Pas de shadows monumentales `0 32px 64px -16px rgba(25, 25, 25, 0.18)` qui font « démo Webflow 2018 ». La hiérarchie visuelle vient des contrastes, pas de l'ombre.

### Header ExecEd-style — RÈGLE ABSOLUE

⚠️ **Le header ne change JAMAIS** entre les composants ExecEd-style. Format unique :

- **Brand text à gauche** : `brand` en CAPS 22px bold + `brandSub` optionnel en 14px medium gris
- **Logo LM cliquable à droite** : 48px de haut, lien `https://lausanne.marketing` `target="_blank"` `rel="noopener"` avec `aria-label="Lausanne Marketing"`
- **Border-bottom full width** : `1px solid rgba(25, 25, 25, 0.12)` qui traverse toute la largeur de la slide (même pour les layouts split type `NumberedSplit`, `SectionSplit`, `ProgrammeHero` : le header est full-width, les colonnes commencent EN DESSOUS)
- **Padding bottom** : 24px sous le brand + logo, avant la border
- **align-items: center** sur le header pour aligner logo et brand text verticalement

Vaut pour : `CoverHero`, `AboutHero`, `SectionHero`, `QuoteImage`, `BigImageHero`, `ClosingHero`, `NumberedSplit`, `SectionSplit`, `TitleSplitImage`, `InfoCardsGrid`, `PeopleCards`, `ImageGridHero`, `ProgrammeHero`, et tout futur composant ExecEd-style.

### Fond uniforme des slides à contenu — RÈGLE ABSOLUE

⚠️ **Toutes les slides à contenu ExecEd-style partagent le MÊME fond** : le dégradé pearl `linear-gradient(180deg, #FFFFFF 0%, #EFEFF2 100%)`. Aucun saut de fond d'une slide à l'autre.

Vaut pour : `ImageGridHero`, `NumberedSplit`, `SectionSplit`, `WorkshopHero`, `SectionHero`, `ListImageHero`, `InfoCardsGrid`, `PeopleCards`, `ProgrammeHero`, `AboutHero`, `QuoteImage`, et tout futur composant à contenu.

Seules exceptions admises : les slides **structurelles** plein cadre qui ont leur propre identité visuelle, `CoverHero` (thème `--ch-bg`) et `ClosingHero` (image + voile). Elles ne sont pas soumises à l'uniformité.

Incident 2026-06-02 : `InfoCardsGrid` était resté sur l'ancien fond crème `#FAF8F3`, créant un saut visible dans le deck `collecte-donnees-new`. Aligné sur le dégradé pearl.

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
