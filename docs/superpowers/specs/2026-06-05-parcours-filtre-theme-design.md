# Refonte de la page parcours : barre de filtre + thème commutable

> Spec validée le 2026-06-05. Branche `feat/parcours` (worktree isolé `.claude/worktrees/parcours`).

## Contexte

La page parcours (`src/pages/parcours/[slug].astro`) est un portail qui agrège plusieurs decks sous un thème commun (accès par lien direct, pas d'index global). Aujourd'hui : un hero + une grille de cartes (3 colonnes), couleurs Lausanne Marketing **codées en dur**, aucune possibilité de filtrer les modules ni de changer de thème.

Objectifs :

1. Mettre en place une **barre de filtre** inspirée de l'onglet *slides* du hub (`lm-hub`) : recherche + filtres rapides + reset + compteur.
2. Proposer un **design plus soigné** pour présenter les modules (13 sur le parcours `crm-data-automation`).
3. Permettre de **choisir le thème** (LM / ExecEd) comme pour les slides, via un sélecteur visible pour l'instant, masquable plus tard. Le thème d'un parcours est modifiable à tout moment (contrairement aux decks, figés).

## Contraintes

- **Interdiction absolue de toucher aux fichiers de decks** (`src/content/presentations/**`), en particulier `collecte-donnees.mdx` et `marketing-automation.mdx`, travaillés par d'autres agents.
- Travail **isolé dans un worktree** (`.claude/worktrees/parcours`) pour ne pas perturber le working dir partagé (agent `feat/collecte-donnees`) ni le worktree `worktree-deck-marketing-automation`.
- Respecter les conventions du repo : UTF-8 complet, pas d'em-dash dans le contenu, nombres CHF suisses, pas d'emojis, **aucune couleur hex en dur** (tokens `themes.css`).
- Ne pas modifier `src/styles/themes.css` ni le composant partagé `SchemeSwitcher.astro` (importé par un deck).

## Modèle de contenu (collection `parcours`)

`src/content.config.ts` — ajouts au **seul** schéma `parcours` (collection `presentations` intouchée) :

```ts
scheme: z.enum(['lm', 'execed']).default('lm'),
days: z
  .array(z.object({
    label: z.string(),          // "Jour 1" (texte de la chip)
    decks: z.array(z.string()).min(1),
  }))
  .optional(),
```

- `decks` (existant) reste la **liste ordonnée canonique**, validée au build (chaque slug existe dans `presentations/`). Inchangé.
- `days` est **optionnel** :
  - présent → la barre affiche les chips (`Tous` + une par jour) ;
  - absent → barre en **recherche seule** (rétrocompatibilité : `template-parcours` n'a pas de `days`).
- Validation supplémentaire (au rendu, dans la page) : tout slug listé dans `days[].decks` doit appartenir à `decks`, sinon erreur de build explicite. Un deck absent de tout `days` (ex. `introduction`, `conclusion`) n'a pas de tag jour et n'apparaît que sous « Tous ».

### Mapping retenu pour `crm-data-automation`

D'après `docs/parcours/crm-data-automation.md` (syllabus officiel) :

| Jour | Modules |
|------|---------|
| Jour 1 | `collecte-donnees`, `qualite-donnees`, `architecture-donnees`, `segmentation-activation` |
| Jour 2 | `protection-donnees`, `marketing-automation`, `workflows` |
| Jour 3 | `lead-nurturing`, `funnel-marketing`, `workflows-avances`, `ia-automation` |
| Housekeeping (hors jour) | `introduction`, `conclusion` |

L'ordre d'affichage suit `decks` (inchangé). `funnel-marketing` est hors brochure (héritage Growth Marketing) mais rattaché à Jour 3 par défaut ; déplaçable plus tard en éditant le frontmatter.

## Mise en page (direction « liste éditoriale / syllabus »)

Tout est rendu via les tokens `themes.css` (`var(--c-ink)`, `--c-accent`, `--c-on-accent`, `--c-muted`, `--c-faint`, `--c-bg-start`, `--c-bg-end`, `--c-surface`…) et `color-mix()` pour les teintes : la page bascule LM ↔ ExecEd sans duplication.

- **Hero** : eyebrow (badge accent), titre avec surlignage via `splitHighlight(title, highlight)` (token accent), description, méta (`{n} modules`, `· {nb jours} jours` si `days`, `· Mis à jour : …` si présent).
- **Barre de filtre** (sous le hero) :
  - champ recherche en pilule (icône loupe, placeholder « Rechercher un module… ») ;
  - chips `Tous · Jour 1 · Jour 2 · Jour 3` (boutons pilule, état actif inversé accent) — uniquement si `days` ;
  - bouton **reset** ;
  - compteur live (« 13 modules ») en `aria-live="polite"`.
  - Style inspiré du hub : pilules `border-radius: 999px`, focus ring `box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 25%, transparent)`. Non sticky (v1).
- **Liste des modules** (`<ol>`), une ligne par module :
  - numéro d'ordre (`01`…, Space Grotesk, tabular-nums) ;
  - vignette `cover` (ratio fixe, `border-radius: 4px`, fallback placeholder si absente) ;
  - titre + description courte (`short`/`description` du deck) ;
  - tag jour (badge accent) si le module est dans un `days` ;
  - flèche d'ouverture.
  - Lien inchangé : `/p/<slug>?from=<parcoursSlug>`.
- **Empty state** : message quand aucun module ne matche les filtres.
- **Footer** : inchangé, themé.

Conserver les `loading="eager"` pour les vignettes au-dessus du fold (anti-CLS, audit Astro) et l'animation d'entrée en stagger.

## Filtrage (client, sans framework)

Chaque `<li>` porte :

- `data-day="Jour 1"` (vide si housekeeping) ;
- `data-search` = `title + description + slug` en minuscules.

Script inline (IIFE, calqué sur `lm-hub/src/pages/slides.astro`) :

- recherche : substring sur `data-search` ;
- jour : égalité avec la chip active (`Tous` = pas de filtre) ;
- **ET** logique entre les deux ;
- `display:none` sur les lignes masquées, maj du compteur et de l'empty state ;
- reset : vide la recherche, réactive `Tous`, refocus la recherche.
- Chips = `<button aria-pressed>`, accessibles au clavier.

## Thème (sélecteur)

- La page pose `data-scheme={data.scheme}` sur `<body>` **au build** → premier paint conforme au défaut du frontmatter.
- Nouveau composant **`src/components/ParcoursSchemeSwitcher.astro`** (indépendant de `SchemeSwitcher.astro`, qui est lié à un deck) :
  - widget fixe en haut à droite, boutons `LM` / `ExecEd`, calqué visuellement sur l'existant (chrome de widget de réglage, exception admise aux tokens) ;
  - persistance **par parcours** : `localStorage['lm-parcours-scheme:<slug>']` ;
  - au chargement, si une valeur est stockée, elle écrase le défaut (preview) ;
  - clic → maj `data-scheme` sur `<body>` + localStorage.
- **Masquage ultérieur** : constante en tête de page `const SHOW_SCHEME_SWITCHER = true;` (commentée « passer à false pour masquer »). Quand `false` : le composant n'est pas rendu, **aucun script de preview** ne tourne → le `scheme` du frontmatter fait loi.
- Défaut retenu : **LM** (règle de charte du repo : branding Lausanne Marketing, pas d'ExecEd même quand le contenu en vient).

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/content.config.ts` | + `scheme`, `days` sur la collection `parcours` uniquement |
| `src/pages/parcours/[slug].astro` | refonte : liste éditoriale themée, barre de filtre, sélecteur, filtrage JS |
| `src/components/ParcoursSchemeSwitcher.astro` | **nouveau** composant sélecteur |
| `src/content/parcours/crm-data-automation.mdx` | + `scheme: lm`, + `days` (mapping ci-dessus) |
| `src/content/parcours/template-parcours.mdx` | + `scheme: lm` (pas de `days`) |
| `docs/superpowers/specs/2026-06-05-parcours-filtre-theme-design.md` | cette spec |

**Jamais touchés** : `src/content/presentations/**` (tous les decks), `src/styles/themes.css`, `src/components/SchemeSwitcher.astro`, `src/layouts/Deck.astro`, composants de slides.

## Hors-scope (YAGNI)

- Barre de filtre **sticky** au scroll (ajoutable plus tard).
- Réorganisation de l'ordre des `decks` existants.
- Filtre par **thème pédagogique** (Data / Automation / IA) plutôt que par jour : on part sur **par jour**.
- Index global des parcours, pagination, tri.
- Modification de `themes.css` ou du sélecteur des slides.

## Validation

- `npm run build` passe (le worktree a son propre `.astro/` ; ne pas lancer `dev` et `build` en parallèle).
- Page parcours `crm-data-automation` :
  - 13 modules listés, ordre = `decks` ;
  - chips `Tous / Jour 1 / Jour 2 / Jour 3`, compteurs cohérents ;
  - recherche + chip se combinent (ET) ; reset rétablit tout ;
  - empty state quand aucun match ;
  - bascule LM ↔ ExecEd via le sélecteur (couleurs, logo, badges) ;
  - rechargement → thème persisté par parcours.
- Page `template-parcours` (1 deck, pas de `days`) : barre en recherche seule, pas de chips, pas de régression.
- Aucune couleur hex en dur ajoutée hors chrome du widget.
