# Schémas de couleurs LM / ExecEd : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à chaque deck d'être rendu dans l'un de deux schémas de couleurs (LM existant, ExecEd nouveau), via une couche de tokens CSS et un attribut `data-scheme`, avec un toggle dans le template et un logo qui change selon le schéma.

**Architecture:** Une couche de tokens sémantiques (`src/styles/themes.css`) définit la palette deux fois : `:root` = LM par défaut, `[data-scheme="execed"]` surcharge. Les composants de la famille Hero n'utilisent que `var(--c-…)` (couleurs pleines) et `color-mix(in srgb, var(--c-…) N%, transparent)` (teintes alpha). Le schéma est posé sur `<body>` par `Deck.astro` depuis le frontmatter `scheme`. Le logo est swappé en CSS global via `--logo-url`.

**Tech Stack:** Astro 6, MDX, Reveal.js, CSS custom properties + `color-mix()` (cible Chrome/Chromium : présentation + handout PDF Browser Rendering).

**Spec :** `docs/superpowers/specs/2026-06-04-theme-schemes-lm-execed-design.md`

---

## Structure des fichiers

- **Créer** `src/styles/themes.css` : tokens des deux schémas + règles globales de swap de logo. Unique source de vérité de la palette.
- **Créer** `src/components/SchemeSwitcher.astro` : widget toggle LM/ExecEd, template uniquement.
- **Créer** `.claude/rules/themes.md` : règle « tout composant utilise les tokens ».
- **Modifier** `src/styles/slides.css` : importer `themes.css` ; tokeniser `:root --slide-bg`, `body`, `.deck-stage`, `.underline`, `.slide-source` et tout hex global.
- **Modifier** `src/styles/global.css` : tokeniser les hex.
- **Modifier** `src/content.config.ts` : ajouter le champ `scheme`.
- **Modifier** `src/layouts/Deck.astro` : prop `scheme` + `data-scheme` sur `<body>`.
- **Modifier** `src/pages/p/[slug].astro` : passer `scheme` à `<Deck>`.
- **Modifier** `src/content/presentations/template.mdx` : importer + rendre `<SchemeSwitcher />`.
- **Modifier** les 28 composants Hero (liste en Tâches 5 à 9) : remplacer les hex par les tokens.
- **Modifier** `.claude/CLAUDE.md` (table des fichiers de règles) : ajouter `themes.md`.

## Recette de remplacement (RÉFÉRENCE — utilisée par les Tâches 5 à 10)

Dans chaque fichier visé, remplacer les couleurs **codées en dur** par les tokens. Remplacements directs (toujours valables) :

| Hex en dur | Remplacé par |
|---|---|
| `#191919` | `var(--c-ink)` |
| `#6B6F84` | `var(--c-muted)` |
| `#9A9DAD` | `var(--c-faint)` |
| `#FFD838` | `var(--c-accent)` |
| `#FEE487` | `var(--c-accent-soft)` |
| `#FAF8F3` | `var(--c-cream)` |
| `#F4F1E8` | `var(--c-cream)` |
| `#EFEFF2` | `var(--c-bg-end)` |

Teintes semi-transparentes (remplacer en gardant le pourcentage) :

| rgba en dur | Remplacé par |
|---|---|
| `rgba(25, 25, 25, 0.12)` | `color-mix(in srgb, var(--c-ink) 12%, transparent)` |
| `rgba(25, 25, 25, 0.1)` | `color-mix(in srgb, var(--c-ink) 10%, transparent)` |
| `rgba(25, 25, 25, 0.08)` | `color-mix(in srgb, var(--c-ink) 8%, transparent)` |
| `rgba(25, 25, 25, 0.06)` | `color-mix(in srgb, var(--c-ink) 6%, transparent)` |
| `rgba(25, 25, 25, 0.04)` | `color-mix(in srgb, var(--c-ink) 4%, transparent)` |
| `rgba(255, 216, 56, 0.30)` (et autres alpha du jaune) | `color-mix(in srgb, var(--c-accent) 30%, transparent)` |
| `rgba(254, 228, 135, …)` (gold clair) | `color-mix(in srgb, var(--c-accent-soft) …%, transparent)` |

**Cas demandant du jugement (lire l'occurrence avant de remplacer) :**

- `#FFFFFF` : si c'est le **fond d'une card / figure / surface** → `var(--c-surface)`. Si c'est le **début d'un dégradé de fond de slide** (`linear-gradient(180deg, #FFFFFF 0%, … var(--c-bg-end))`) → `var(--c-bg-start)`. Si c'est du **texte/icône blanc posé sur un élément sombre** (ex. `thead` ink de `TableHero`, voile sur image) → **laisser `#FFFFFF` littéral** (c'est du « on-ink », pas une couleur de schéma).
- Dégradés de fond pearl `linear-gradient(180deg, #FFFFFF 0%, #EFEFF2 100%)` → `linear-gradient(180deg, var(--c-bg-start) 0%, var(--c-bg-end) 100%)`.
- Halo doré radial `radial-gradient(…, #FEE487 …)` ou `rgba(255,216,56,…)` → token accent (`var(--c-accent-soft)` ou `color-mix` accent) : le halo devient rouge en ExecEd, c'est voulu.
- `height: 48px` du logo et autres **tailles/géométries** : NE PAS toucher (la recette ne concerne que les couleurs).

**Vérification de chaque tâche de refactor :** `npm run build` reste vert, et un diff visuel en LM doit être **identique à avant** (les tokens LM = anciennes valeurs).

---

## Tâche 1 : Couche de tokens `themes.css`

**Files:**
- Create: `src/styles/themes.css`
- Modify: `src/styles/slides.css:1-3` (ajout d'un `@import`)

- [ ] **Step 1 : Créer `src/styles/themes.css`**

```css
/* src/styles/themes.css
   Tokens de couleur des deux schémas. LM = défaut (:root). ExecEd via
   [data-scheme="execed"] posé sur <body> par Deck.astro (frontmatter `scheme`).
   Les composants de slide n'utilisent QUE ces tokens (jamais de hex en dur)
   et color-mix() pour les teintes semi-transparentes. */

:root,
[data-scheme="lm"] {
  --c-ink: #191919;
  --c-muted: #6B6F84;
  --c-faint: #9A9DAD;
  --c-accent: #FFD838;
  --c-accent-soft: #FEE487;
  --c-secondary: #191919;
  --c-bg-start: #FFFFFF;
  --c-bg-end: #EFEFF2;
  --c-cream: #FAF8F3;
  --c-surface: #FFFFFF;
  --logo-url: url("/assets/lm-logo.svg");
  --logo-url-white: url("/assets/lm-logo-white-letter.svg");
}

[data-scheme="execed"] {
  --c-ink: #1E2B3E;
  --c-muted: #5A6678;
  --c-faint: #97A0B0;
  --c-accent: #E73952;
  --c-accent-soft: #F8C9D0;
  --c-secondary: #3578B4;
  --c-bg-start: #FFFFFF;
  --c-bg-end: #ECEFF4;
  --c-cream: #F7F9FB;
  --c-surface: #FFFFFF;
  --logo-url: url("/assets/execed-logo.svg");
  --logo-url-white: url("/assets/execed-logo-white.svg");
}
```

- [ ] **Step 2 : Importer dans `slides.css`**

Dans `src/styles/slides.css`, après la ligne `@import './global.css';` (ligne 3), ajouter :

```css
@import './themes.css';
```

- [ ] **Step 3 : Build**

Run: `npm run build`
Expected: `Complete!`, aucune erreur. (Aucun changement visuel : aucun composant n'utilise encore les tokens.)

- [ ] **Step 4 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/styles/themes.css src/styles/slides.css
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "feat(themes): couche de tokens LM/ExecEd (themes.css)"
```

---

## Tâche 2 : Champ `scheme` + `data-scheme` sur `<body>`

**Files:**
- Modify: `src/content.config.ts:12-22` (schema presentations)
- Modify: `src/layouts/Deck.astro:7-16` (Props) et `:39` (`<body>`)
- Modify: `src/pages/p/[slug].astro:24-31` (props passées à `<Deck>`)

- [ ] **Step 1 : Ajouter `scheme` au schéma**

Dans `src/content.config.ts`, dans `schema: z.object({ … })` de `presentations`, ajouter après la ligne `description: z.string().optional(),` :

```ts
    scheme: z.enum(['lm', 'execed']).default('lm'),
```

- [ ] **Step 2 : Prop `scheme` dans `Deck.astro`**

Dans `src/layouts/Deck.astro`, étendre l'interface `Props` et la destructuration :

```astro
interface Props {
  title: string;
  subtitle?: string;
  short?: string;
  description?: string;
  cover?: string;
  updated?: string;
  scheme?: 'lm' | 'execed';
}

const { title, subtitle, short, description, cover, updated, scheme = 'lm' } = Astro.props;
```

Puis remplacer `<body>` (ligne 39) par :

```astro
  <body data-scheme={scheme}>
```

- [ ] **Step 3 : Passer `scheme` depuis `[slug].astro`**

Dans `src/pages/p/[slug].astro`, ajouter la prop dans `<Deck …>` (après `updated={updatedLabel}`) :

```astro
  scheme={entry.data.scheme}
```

- [ ] **Step 4 : Vérifier le câblage**

Run: `npm run build`
Expected: `Complete!`. Un deck sans `scheme:` rend `data-scheme="lm"` (défaut). Vérifier dans `dist/p/template/index.html` que `<body` contient `data-scheme="lm"`.

Run: `Select-String -Path "dist/p/template/index.html" -Pattern 'data-scheme'`
Expected: une ligne `<body data-scheme="lm" …>`.

- [ ] **Step 5 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/content.config.ts src/layouts/Deck.astro "src/pages/p/[slug].astro"
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "feat(themes): champ frontmatter scheme + data-scheme sur body"
```

---

## Tâche 3 : Swap de logo + taille ExecEd

**Files:**
- Modify: `src/styles/themes.css` (append)

- [ ] **Step 1 : Ajouter les règles de logo à la fin de `themes.css`**

```css
/* ---- Logo : suit le schéma. Le src="" du markup sert de fallback. ---- */
[class$="__brand-logo"] { content: var(--logo-url); }

/* Composants à logo blanc (colonnes image / fonds sombres) : variante blanche.
   Placé APRÈS la règle générale (spécificité égale → gagne par ordre source). */
.list-image-hero__brand-logo,
.numbered-split__brand-logo,
.programme-hero__brand-logo { content: var(--logo-url-white); }

/* Le wordmark ExecEd est large (ratio ~6.8:1) : on réduit sa hauteur dans le
   header (le logo LM reste à 48px via le style scopé des composants).
   !important pour battre la spécificité du style scopé Astro. */
[data-scheme="execed"] [class$="__brand-logo"] { height: 34px !important; }
```

- [ ] **Step 2 : Build**

Run: `npm run build`
Expected: `Complete!`.

- [ ] **Step 3 : Vérification visuelle**

`npm run dev`, ouvrir `http://localhost:4321/p/template/`. (Le toggle n'existe pas encore : pour tester, éditer temporairement `<body>` via les devtools en `data-scheme="execed"`.) Attendu : tous les logos passent au logo ExecEd (wordmark navy + dégradé), les slides à colonne image (NumberedSplit, ListImageHero, ProgrammeHero) montrent le logo ExecEd blanc, hauteur réduite.

- [ ] **Step 4 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/styles/themes.css
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "feat(themes): swap de logo par schema + taille ExecEd"
```

---

## Tâche 4 : Tokeniser les styles globaux

**Files:**
- Modify: `src/styles/slides.css` (`:root --slide-bg`, `body`, `.deck-stage`, `.underline`, `.slide-source`, et tout hex)
- Modify: `src/styles/global.css` (tout hex)

- [ ] **Step 1 : Appliquer la recette à `slides.css`**

Lire `src/styles/slides.css` en entier. Appliquer la **Recette de remplacement** (section de référence ci-dessus) à toutes les occurrences de couleur. Points spécifiques :
- `--slide-bg: #FAF8F3;` → `--slide-bg: var(--c-cream);`
- `.deck-stage { … border: 1px solid rgba(25,25,25,0.1); box-shadow: … rgba(25,25,25,0.04); }` → `color-mix` ink 10% / 4%.
- `.underline` (soulignement jaune de `italicPart`) : son `#FFD838` (ou `rgba(255,216,56,…)`) → `var(--c-accent)` / `color-mix` accent.
- `.slide-source` : `#9A9DAD` → `var(--c-faint)` ; hover `#191919` → `var(--c-ink)`.

- [ ] **Step 2 : Appliquer la recette à `global.css`**

Lire `src/styles/global.css`. Remplacer ses ~6 occurrences de hex selon la recette.

- [ ] **Step 3 : Build + non-régression LM**

Run: `npm run build`
Expected: `Complete!`. En dev, `/p/template/` en LM doit être **identique** à avant (l'underline reste jaune, fonds pearl inchangés).

- [ ] **Step 4 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/styles/slides.css src/styles/global.css
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser les styles globaux (slides.css, global.css)"
```

---

## Tâches 5 à 9 : Refactor des composants Hero (recette → tokens)

Pour **chacune** des tâches ci-dessous : appliquer la **Recette de remplacement** (section de référence) à chaque fichier listé, puis `npm run build` (vert + LM identique en visuel), puis commit. Aucune nouvelle couleur, aucune géométrie touchée.

### Tâche 5 : Heroes « média / déclaration »

**Files (Modify) :** `src/components/slides/MediaHero.astro`, `StatementHero.astro`, `DemoHero.astro`, `WorkshopHero.astro`, `BigImageHero.astro`, `QuoteImage.astro`

- [ ] Step 1 : Appliquer la recette aux 6 fichiers.
- [ ] Step 2 : `npm run build` → `Complete!`, LM identique.
- [ ] Step 3 : Commit
```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/slides/MediaHero.astro src/components/slides/StatementHero.astro src/components/slides/DemoHero.astro src/components/slides/WorkshopHero.astro src/components/slides/BigImageHero.astro src/components/slides/QuoteImage.astro
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser heroes media/declaration"
```

### Tâche 6 : Heroes « grilles / cards »

**Files (Modify) :** `InfoCardsGrid.astro`, `ImageGridHero.astro`, `PeopleCards.astro`, `NumberedSplit.astro`, `ListImageHero.astro`, `CompareColumnsHero.astro`

- [ ] Step 1 : Appliquer la recette. Note : `CompareColumnsHero` colonne droite « accent » → `var(--c-accent)` ; `NumberedSplit`/`ListImageHero` ont aussi le logo blanc (géré en Tâche 3, ne pas re-toucher).
- [ ] Step 2 : `npm run build` → vert, LM identique.
- [ ] Step 3 : Commit
```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/slides/InfoCardsGrid.astro src/components/slides/ImageGridHero.astro src/components/slides/PeopleCards.astro src/components/slides/NumberedSplit.astro src/components/slides/ListImageHero.astro src/components/slides/CompareColumnsHero.astro
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser heroes grilles/cards"
```

### Tâche 7 : Heroes « sections / couverture / clôture »

**Files (Modify) :** `CoverHero.astro`, `SectionHero.astro`, `SubSectionHero.astro`, `SectionSplit.astro`, `ClosingHero.astro`, `TitleSplitImage.astro`, `ProgrammeHero.astro`, `AboutHero.astro`

- [ ] Step 1 : Appliquer la recette. Note : `CoverHero` thème `halo-gold` et `SubSectionHero` halo radial → token accent-soft / accent (halo rouge en ExecEd, voulu). `ProgrammeHero` a le logo blanc (géré Tâche 3).
- [ ] Step 2 : `npm run build` → vert, LM identique.
- [ ] Step 3 : Commit
```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/slides/CoverHero.astro src/components/slides/SectionHero.astro src/components/slides/SubSectionHero.astro src/components/slides/SectionSplit.astro src/components/slides/ClosingHero.astro src/components/slides/TitleSplitImage.astro src/components/slides/ProgrammeHero.astro src/components/slides/AboutHero.astro
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser heroes sections/cover/closing"
```

### Tâche 8 : Heroes « interactif / charts / média spécial »

**Files (Modify) :** `PollHero.astro`, `WordCloudHero.astro`, `BarChartHero.astro`, `MockupHero.astro`, `FormHero.astro`, `PauseHero.astro`, `TimerControl.astro`

- [ ] Step 1 : Appliquer la recette. Note : `BarChartHero` barres → `var(--c-accent)` (barre `emphasis`) et `var(--c-muted)`/ink pour les autres ; `PollHero`/`WordCloudHero` boutons et barres → accent.
- [ ] Step 2 : `npm run build` → vert, LM identique.
- [ ] Step 3 : Commit
```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/slides/PollHero.astro src/components/slides/WordCloudHero.astro src/components/slides/BarChartHero.astro src/components/slides/MockupHero.astro src/components/slides/FormHero.astro src/components/slides/PauseHero.astro src/components/slides/TimerControl.astro
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser heroes interactif/charts"
```

### Tâche 9 : Composants ajoutés cette session (`ExchangeHero`, `TableHero`)

**Files (Modify) :** `ExchangeHero.astro`, `TableHero.astro`

- [ ] Step 1 : Appliquer la recette. Note `TableHero` : le `thead` `background: #191919; color: #FFFFFF` → `background: var(--c-ink); color: #FFFFFF` (le blanc est du « on-ink », il reste littéral) ; zébrage `rgba(25,25,25,0.025)` → `color-mix(in srgb, var(--c-ink) 2.5%, transparent)`. `ExchangeHero` : halo doré → `var(--c-accent-soft)`, carré eyebrow + marks → `var(--c-accent)`.
- [ ] Step 2 : `npm run build` → vert, LM identique.
- [ ] Step 3 : Commit
```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/slides/ExchangeHero.astro src/components/slides/TableHero.astro
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "refactor(themes): tokeniser ExchangeHero et TableHero"
```

---

## Tâche 10 : `SchemeSwitcher` + intégration au template

**Files:**
- Create: `src/components/SchemeSwitcher.astro`
- Modify: `src/content/presentations/template.mdx` (import + rendu)

- [ ] **Step 1 : Créer `src/components/SchemeSwitcher.astro`**

```astro
---
// src/components/SchemeSwitcher.astro
// Toggle LM / ExecEd, inséré dans template.mdx UNIQUEMENT. Pose data-scheme sur
// <body> et mémorise en localStorage. Sans effet sur les vrais decks (figés par
// frontmatter). Calqué sur ThemeSwitcher (toggle de fond).
---
<style is:global>
  .lm-scheme-switcher {
    position: fixed; top: 50%; right: 72px; transform: translateY(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 8px;
    padding: 12px 10px; background: rgba(255,255,255,0.92);
    border: 1px solid rgba(25,25,25,0.08); border-radius: 10px;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px rgba(25,25,25,0.12); font-family: 'Hanken Grotesk', sans-serif;
  }
  .lm-scheme-switcher__label {
    padding: 0 2px 6px; font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.18em; color: #6B6F84; border-bottom: 1px solid rgba(25,25,25,0.06);
  }
  .lm-scheme-switcher button {
    min-width: 64px; padding: 8px 10px; border: 2px solid rgba(25,25,25,0.08);
    border-radius: 6px; cursor: pointer; background: #fff; font-size: 12px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #191919;
    transition: border-color .18s ease, transform .18s ease;
  }
  .lm-scheme-switcher button:hover { transform: scale(1.04); }
  .lm-scheme-switcher button[data-scheme-opt="lm"].is-active {
    border-color: #FFD838; box-shadow: 0 0 0 2px rgba(255,216,56,.3);
  }
  .lm-scheme-switcher button[data-scheme-opt="execed"].is-active {
    border-color: #E73952; box-shadow: 0 0 0 2px rgba(231,57,82,.3);
  }
</style>
<script>
  const schemes = ['lm', 'execed'] as const;
  type Scheme = typeof schemes[number];
  const storageKey = 'lm-template-scheme';
  function init() {
    if (document.querySelector('.lm-scheme-switcher')) return;
    const stored = localStorage.getItem(storageKey) as Scheme | null;
    const initial: Scheme = (stored && schemes.includes(stored))
      ? stored
      : ((document.body.dataset.scheme as Scheme) || 'lm');
    document.body.dataset.scheme = initial;
    const widget = document.createElement('div');
    widget.className = 'lm-scheme-switcher';
    widget.setAttribute('role', 'group');
    widget.setAttribute('aria-label', 'Choisir le schéma de couleurs');
    const label = document.createElement('span');
    label.className = 'lm-scheme-switcher__label';
    label.textContent = 'Schéma';
    widget.appendChild(label);
    const names: Record<Scheme, string> = { lm: 'LM', execed: 'ExecEd' };
    schemes.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.schemeOpt = s;
      btn.textContent = names[s];
      if (s === initial) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        document.body.dataset.scheme = s;
        localStorage.setItem(storageKey, s);
        widget.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
      widget.appendChild(btn);
    });
    document.body.appendChild(widget);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
</script>
```

- [ ] **Step 2 : Importer et rendre dans `template.mdx`**

Dans `src/content/presentations/template.mdx`, ajouter à la fin du bloc d'imports (après la dernière ligne `import … MockupHero …`) :

```mdx
import SchemeSwitcher from '@/components/SchemeSwitcher.astro';
```

Puis, juste avant le premier `<CoverHero …>`, ajouter :

```mdx
<SchemeSwitcher />
```

- [ ] **Step 3 : Build + vérif toggle**

Run: `npm run build`
Expected: `Complete!`.
`npm run dev` → `http://localhost:4321/p/template/` : un widget « Schéma : LM / ExecEd » apparaît. Cliquer ExecEd → toute la présentation passe en navy/rouge + logo ExecEd, sans rechargement. Recharger : le choix persiste. Les autres decks (`/p/collecte-donnees-new/`) restent en LM.

- [ ] **Step 4 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add src/components/SchemeSwitcher.astro src/content/presentations/template.mdx
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "feat(themes): SchemeSwitcher LM/ExecEd dans le template"
```

---

## Tâche 11 : Documenter la règle

**Files:**
- Create: `.claude/rules/themes.md`
- Modify: `.claude/CLAUDE.md` (table « Fichiers de règles »)

- [ ] **Step 1 : Créer `.claude/rules/themes.md`**

```markdown
# Schémas de couleurs (tokens) : RÈGLE ABSOLUE

Deux schémas : **LM** (jaune/encre noire/pearl) et **ExecEd** (rouge/navy/clair).
Source de vérité : `src/styles/themes.css` (`:root` = LM, `[data-scheme="execed"]`).

## Règle pour tout composant de slide

- **Aucune couleur hex en dur.** Utiliser les tokens : `var(--c-ink)`, `--c-muted`,
  `--c-faint`, `--c-accent`, `--c-accent-soft`, `--c-secondary`, `--c-bg-start`,
  `--c-bg-end`, `--c-cream`, `--c-surface`.
- Teintes semi-transparentes : `color-mix(in srgb, var(--c-…) N%, transparent)`.
- Logo : classe en `…__brand-logo` (swap auto via `--logo-url`). Logo blanc sur
  fond sombre : ajouter le sélecteur dans le bloc logo blanc de `themes.css`.
- Exceptions littérales admises : le blanc « on-ink » (texte/icône blanc sur un
  élément `var(--c-ink)`), et le chrome des widgets de réglage.

Conséquence : un nouveau composant naît dans les deux schémas sans travail en plus.

## Schéma d'un deck

Frontmatter `scheme: "lm" | "execed"` (défaut `lm`). **Figé** une fois le deck
validé : on n'en change jamais. Le toggle n'existe que dans `template.mdx`.
```

- [ ] **Step 2 : Référencer dans `.claude/CLAUDE.md`**

Dans la table « Fichiers de règles » de `.claude/CLAUDE.md`, ajouter une ligne :

```markdown
| `themes.md` | Tokens de couleur (schémas LM / ExecEd), règle « pas de hex en dur », frontmatter `scheme` |
```

- [ ] **Step 3 : Commit**

```bash
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" add .claude/rules/themes.md .claude/CLAUDE.md
git -C "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" commit -m "docs(themes): regle tokens + frontmatter scheme"
```

---

## Tâche 12 : Vérification finale

- [ ] **Step 1 : Build complet**

Run: `npm run build`
Expected: `Complete!`, 115+ pages, aucune erreur.

- [ ] **Step 2 : Vérif visuelle des deux schémas**

`npm run dev` :
- `/p/template/` : toggle LM ↔ ExecEd. En ExecEd : header logo ExecEd + texte navy + border ; accent **rouge** sur underline/eyebrow/divider/halo/index ; sous-titres navy désaturé ; fonds clairs (pas de pearl/gold). En LM : strictement identique à avant.
- Mettre temporairement `scheme: "execed"` sur un deck réel (ex. `architecture-donnees-new.mdx`), `npm run build`, vérifier le rendu, puis **retirer** (les decks restent LM tant que l'utilisateur ne décide pas).

- [ ] **Step 3 : Vérif handout PDF**

Ouvrir `/p/template/handout/1/` (ou via le bouton PDF) en `data-scheme="execed"` : couleurs + logo corrects (Browser Rendering = Chromium, supporte `color-mix` et `content:url()`).

- [ ] **Step 4 : Non-régression**

Confirmer qu'un deck sans `scheme:` rend exactement comme avant l'implémentation (LM). Si un écart apparaît, c'est qu'un hex LM a été mal mappé : comparer le token à l'ancienne valeur.

---

## Notes d'implémentation

- **`color-mix` / `content:url()`** : valides syntaxiquement (le build ne vérifie pas le support). Cible = Chrome (Reveal) + Chromium (handout PDF) : OK. Pas de souci de support.
- **Spécificité du logo blanc** : la règle blanche est après la règle générale (même spécificité → ordre source gagne). Ne pas réordonner `themes.css`.
- **`height: 34px !important`** du logo ExecEd : seul `!important` du système, pour battre le `height: 48px` scopé des composants. Calibrer la valeur à l'œil si besoin.
- **`source/_execed_unzip/`** présent dans l'arbo : ne pas committer (dossier `source/` = archives, doit rester gitignored ; vérifier le `.gitignore` au passage).
