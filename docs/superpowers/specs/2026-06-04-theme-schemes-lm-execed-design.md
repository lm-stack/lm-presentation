# Schémas de couleurs (LM / ExecEd) — Design

Date : 2026-06-04
Statut : design validé sur l'approche + les valeurs de tokens (couleurs + logo) ; polices hors scope confirmées.

## 1. Contexte et objectif

Les decks de `lm-presentation` partagent une seule identité visuelle (charte Lausanne Marketing) : fond pearl/cream, encre `#191919`, accent jaune `#FFD838`. Aujourd'hui ces couleurs sont **codées en dur** dans chaque composant (597 occurrences sur 69 fichiers, dont ~28 composants de la famille « Hero » qui constituent le template courant). Il n'existe aucune couche de tokens.

Objectif : pouvoir produire un deck dans l'un de **deux schémas de couleurs** :

- **LM** (existant) : fond clair pearl, encre `#191919`, accent jaune `#FFD838`, logo Lausanne Marketing.
- **ExecEd** (nouveau) : fond clair, encre navy `#1E2B3E`, accent rouge `#E73952`, couleur secondaire bleu `#3578B4`, logo Executive Education HEC Lausanne.

Contraintes posées par l'utilisateur :

1. Le **même template** (mêmes layouts), seules les couleurs et le logo changent.
2. À la création d'un deck, on **choisit librement** le schéma. Une fois un deck validé, **son schéma ne change jamais**.
3. Un **toggle dans le template** permet de basculer LM ↔ ExecEd pour comparer.
4. Tout **nouveau modèle de slide naît automatiquement dans les deux schémas**.
5. Le **logo change** avec le schéma.

## 2. Décisions validées

- **Look ExecEd** : fond clair, encre navy, accent rouge, bleu en secondaire (transposition directe du LM clair : jaune→rouge, noir→navy). Couleurs issues de la charte ExecEd 2024 (article Knowledge 13909).
- **Approche** : tokens CSS sémantiques + sélecteur `[data-scheme]`, **scopée à la famille Hero** + les styles globaux qu'elle utilise. Les anciens composants non-Hero (`Cover`, `Section`, `Statement`…) restent en LM figé (legacy, tous les decks ont leur version `-new`).
- **Polices : hors scope** pour cette itération (la charte ExecEd impose ES Peak + Cormorant Infant, licences/fichiers à gérer séparément). Le schéma = couleurs + logo uniquement.

## 3. Architecture

### 3.1 Couche de tokens

Nouveau fichier `src/styles/themes.css`, importé en tête de `src/styles/slides.css` (avant les composants). Il définit la palette sémantique deux fois :

```css
/* LM = défaut */
:root, [data-scheme="lm"] {
  --c-ink: #191919;
  --c-muted: #6B6F84;
  --c-faint: #9A9DAD;
  --c-accent: #FFD838;
  --c-accent-soft: #FEE487;
  --c-secondary: #191919;     /* LM n'a pas de 3e couleur : neutre = ink */
  --c-bg-start: #FFFFFF;
  --c-bg-end: #EFEFF2;
  --c-cream: #FAF8F3;
  --c-surface: #FFFFFF;
  --logo-url: url("/assets/lm-logo.svg");
  --logo-url-white: url("/assets/lm-logo-white-letter.svg");
}

[data-scheme="execed"] {
  --c-ink: #1E2B3E;
  --c-muted: #5A6678;          /* navy désaturé */
  --c-faint: #97A0B0;
  --c-accent: #E73952;
  --c-accent-soft: #F8C9D0;    /* rouge clair pour washes/halos pleins */
  --c-secondary: #3578B4;
  --c-bg-start: #FFFFFF;
  --c-bg-end: #ECEFF4;         /* léger tint froid */
  --c-cream: #F7F9FB;
  --c-surface: #FFFFFF;
  --logo-url: url("/assets/execed-logo.svg");
  --logo-url-white: url("/assets/execed-logo-white.svg");
}
```

### 3.2 Couleurs à alpha : `color-mix`

Les teintes semi-transparentes actuelles (hairlines `rgba(25,25,25,.12/.08/.06)`, halos `rgba(255,216,56,.25)`, ombres) ne peuvent pas se paramétrer via une simple variable hex. On les dérive des tokens avec `color-mix` (supporté par Chrome, moteur de rendu de Reveal) :

- hairline : `color-mix(in srgb, var(--c-ink) 12%, transparent)`
- hairline douce : `color-mix(in srgb, var(--c-ink) 8%, transparent)`
- halo accent : `color-mix(in srgb, var(--c-accent) 25%, transparent)`
- ombre : `color-mix(in srgb, var(--c-ink) 8%, transparent)`

Ainsi un hairline devient navy en ExecEd, un halo devient rouge, sans token supplémentaire. Single source of truth = les ~9 tokens de §3.1.

### 3.3 Application du schéma

- Le schéma est porté par `data-scheme` sur le `<body>` de la page du deck, posé par `src/layouts/Deck.astro` à partir du frontmatter. `<body>` couvre les slides comme le chrome et reprend la convention du `ThemeSwitcher` existant (`body[data-template-theme]`). Le toggle du template bascule `document.body.dataset.scheme`.
- Défaut : `lm` (si le frontmatter ne précise rien, tout reste identique à aujourd'hui : `:root` porte déjà les valeurs LM).

### 3.4 Logo

Swap global, sans toucher au markup de chaque composant. Tous les logos de marque portent une classe en `…__brand-logo`. Règle globale dans `themes.css` :

```css
[class$="__brand-logo"] { content: var(--logo-url); }
```

`content: url()` sur un `<img>` remplace l'image rendue (supporté Chrome/Firefox/Safari). Le `src="/assets/lm-logo.svg"` du markup sert de fallback. Les composants à logo blanc (sur image/fond sombre, ex. `ClosingHero`) utilisent `--logo-url-white`.

Assets ajoutés (récupérés depuis execed.unil.ch, rendus auto-suffisants par un `<style>` interne) :

- `public/assets/execed-logo.svg` : wordmark navy `#1E2B3E` + monogramme en dégradé signature rouge→bleu (`#e73a52`→`#3479b5`).
- `public/assets/execed-logo-white.svg` : version blanche pleine (fonds sombres / images).

viewBox `0 0 116 17` (wordmark large, ratio ~6.8:1). À 48px de haut le logo fait ~327px de large : prévoir un ajustement de taille spécifique ExecEd (voir §7).

## 4. Tableau des tokens

| Token | Rôle | LM | ExecEd |
|---|---|---|---|
| `--c-ink` | titres + texte fort | `#191919` | `#1E2B3E` |
| `--c-muted` | sous-titres, texte secondaire | `#6B6F84` | `#5A6678` |
| `--c-faint` | sources, légendes ténues | `#9A9DAD` | `#97A0B0` |
| `--c-accent` | underline, carré eyebrow, divider, index, halo | `#FFD838` | `#E73952` |
| `--c-accent-soft` | washes / halos pleins | `#FEE487` | `#F8C9D0` |
| `--c-secondary` | détails, liens, puces secondaires | `#191919` | `#3578B4` |
| `--c-bg-start` → `--c-bg-end` | dégradé de fond des slides | `#FFFFFF`→`#EFEFF2` | `#FFFFFF`→`#ECEFF4` |
| `--c-cream` | fond cream alternatif | `#FAF8F3` | `#F7F9FB` |
| `--c-surface` | cards | `#FFFFFF` | `#FFFFFF` |
| `--logo-url` / `--logo-url-white` | logo | LM | ExecEd |

Teintes alpha (hairlines, halos, ombres) : dérivées via `color-mix` (§3.2), pas de token dédié.

## 5. Schéma figé par deck (frontmatter)

- Ajouter au schéma de la collection `presentations` (`src/content.config.ts` ou équivalent) un champ optionnel : `scheme: z.enum(["lm", "execed"]).default("lm")`.
- Chaque `.mdx` déclare `scheme: "execed"` ou `scheme: "lm"` (ou rien → `lm`).
- « Figé » = simple convention : une fois écrit dans un deck validé, on n'y touche plus. Pas de verrou technique (YAGNI).

## 6. Toggle dans le template

- Un widget **SchemeSwitcher** (calqué sur le `ThemeSwitcher` de fond existant) inséré uniquement dans `template.mdx` : deux boutons « LM » / « ExecEd » qui posent `data-scheme` sur la racine et mémorisent en `localStorage`.
- **Template uniquement** : aucun effet sur les vrais decks (figés par frontmatter). Le `ThemeSwitcher` de fond actuel (4 variantes pearl/cream/gold) reste, orthogonal ; il sera tokenisé pour rester cohérent sous chaque schéma (les fonds gold n'ont de sens qu'en LM).
- Le `template.mdx` montrera les deux schémas via le toggle ; il peut afficher une paire de slides témoins si utile.

## 7. Règle « nouveau composant » et refactor

### Règle à documenter (`.claude/rules/slides.md` ou nouveau `themes.md`)

> Tout composant de slide utilise les tokens `var(--c-…)` pour les couleurs, et `color-mix(in srgb, var(--c-…) N%, transparent)` pour les teintes. **Aucune couleur hex en dur** (hors cas exceptionnel documenté). Le logo passe par `--logo-url`. Conséquence : un nouveau composant naît dans les deux schémas sans travail supplémentaire.

### Périmètre du refactor (mécanique : hex → token)

Famille Hero + globaux : `CoverHero, AboutHero, ProgrammeHero, ImageGridHero, SectionHero, QuoteImage, BigImageHero, ClosingHero, NumberedSplit, ListImageHero, WorkshopHero, DemoHero, StatementHero, FormHero, CompareColumnsHero, SubSectionHero, PauseHero, InfoCardsGrid, PeopleCards, SectionSplit, TitleSplitImage, PollHero, WordCloudHero, BarChartHero, MediaHero, MockupHero, ExchangeHero, TableHero, TimerControl` + `src/styles/slides.css` (`.underline`, `.slide-source`, `--slide-bg`) + `src/styles/global.css`.

Mapping de remplacement (identique partout) :

| Hex / rgba en dur | Remplacé par |
|---|---|
| `#191919` | `var(--c-ink)` |
| `#6B6F84` | `var(--c-muted)` |
| `#9A9DAD` | `var(--c-faint)` |
| `#FFD838` | `var(--c-accent)` |
| `#FEE487` | `var(--c-accent-soft)` |
| `#FAF8F3` | `var(--c-cream)` |
| `#FFFFFF` (card) | `var(--c-surface)` |
| `#FFFFFF`→`#EFEFF2` (fond) | `var(--c-bg-start)`→`var(--c-bg-end)` |
| `#F4F1E8` (fin halo-gold) | `var(--c-cream)` (ou token dédié si besoin) |
| `rgba(25,25,25,.12 / .08 / .06)` | `color-mix(in srgb, var(--c-ink) 12/8/6%, transparent)` |
| `rgba(255,216,56,.X)` | `color-mix(in srgb, var(--c-accent) X%, transparent)` |

Le `theme="halo-gold"` de `CoverHero` et les fonds du `ThemeSwitcher` : leurs gradients référencent les tokens (le halo `--c-accent-soft`), donc s'adaptent au schéma.

## 8. Hors scope

- **Polices** par schéma (ES Peak / Cormorant) : itération ultérieure (licences + fichiers).
- **Anciens composants non-Hero** : restent LM figé.
- Pas de verrou technique sur le schéma d'un deck (convention seulement).
- Pas de nouvel axe de fond : on garde le `ThemeSwitcher` existant tel quel (juste tokenisé).

## 9. Points ouverts / risques

- **Taille du logo ExecEd** : wordmark large (ratio ~6.8:1). Sous ExecEd, la hauteur 48px donne ~327px de large. Prévoir une règle de taille spécifique (ex. token `--logo-height`, ou `[data-scheme="execed"] [class$="__brand-logo"] { height: 34px }`) pour l'équilibre visuel du header. À calibrer visuellement.
- **`content: url()` sur `<img>`** : bien supporté par les navigateurs cibles (présentation = Chrome) ; le `src` reste en fallback. À vérifier en build + handout PDF (Browser Rendering).
- **`color-mix`** : OK Chrome/Edge/Safari récents. Reveal tourne en Chrome ; le handout PDF passe par Browser Rendering (Chromium) : OK.
- **Couleur tertiaire bleue** : peu/pas utilisée par les composants actuels ; token disponible pour des touches ExecEd (liens, puces secondaires) sans usage imposé.

## 10. Vérification

- `npm run build` vert (115+ pages).
- Deck témoin en `scheme: "execed"` : header (logo ExecEd + navy + border), accent rouge sur underline/eyebrow/divider/halo, fonds clairs, sous-titres navy désaturé.
- Toggle dans `/p/template/` : bascule LM ↔ ExecEd sans rechargement, persistée.
- Un deck sans `scheme` rend exactement comme aujourd'hui (non-régression LM).
- Handout PDF d'un deck ExecEd : couleurs + logo corrects.
