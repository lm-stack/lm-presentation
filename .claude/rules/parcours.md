# Conventions des parcours

Un parcours (`src/content/parcours/<slug>.mdx`) est un portail qui agrège plusieurs decks sous un thème commun. Page : `src/pages/parcours/[slug].astro`. Schéma : collection `parcours` dans `src/content.config.ts`.

## Dates précises (RÈGLE)

- **Toujours des dates précises, jamais un mois seul.**
- `eyebrow` affiche les dates exactes du parcours, ex. `25, 26, 27 juin 2026` (pas `Juin 2026`).
- `date` = date de début réelle du parcours, ex. `2026-06-25` (pas un 1er du mois générique).

## Découpage en jours (RÈGLE)

- Si le parcours définit `days`, **chaque deck de `decks` doit appartenir à un jour**, y compris `introduction` et `conclusion` (intro → premier jour, conclusion → dernier jour). Aucun deck orphelin.
- Garde-fou : un deck sans jour fait **échouer le build** (validation dans `[slug].astro`).
- Un parcours sans `days` (ex. `template-parcours`) garde la barre de filtre en **recherche seule** (cas de base, pas de chips).

## Thème et sélecteur

- `scheme: "lm" | "execed"` = thème par défaut du parcours. **Modifiable à tout moment** (contrairement aux decks, figés une fois validés).
- `switcher: true` affiche le sélecteur LM/ExecEd sur la page (preview). **Défaut `false`** (masqué, production). Quand masqué, aucun script de preview ne tourne : le `scheme` du frontmatter fait loi.
- `template-parcours` garde `switcher: true` (vitrine des thèmes). Les parcours clients sont en général masqués.
- Tokens de thème : `themes.css` est chargé via `global.css` (pas d'import par page), il suffit de poser `data-scheme` sur `<body>`. Voir `themes.md`.

## Agenda dynamique (RÈGLE)

L'agenda d'un deck d'introduction n'est **pas écrit à la main**. On utilise le composant `<Agenda parcours="<slug>" />` (`src/components/slides/Agenda.astro`), qui dérive l'agenda de la structure `days` du parcours au build.

- Chaque jour qui doit apparaître dans l'agenda porte `theme` (titre éditorial du jour, ex. « Les fondations data ») et `summary` (description courte). Ces deux champs sont optionnels au schéma mais **requis dès qu'un `<Agenda>` cible ce parcours** : un jour incomplet fait échouer le build avec un message explicite.
- L'agenda rend une ligne par jour, au format `<label> : <theme>` + `summary`. Le `brand` (titre du parcours) et le `brandSub` (institution selon `scheme`) sont dérivés automatiquement, comme pour les slides de fin.
- Prop `image` optionnelle pour l'illustration latérale (défaut : `cover` du parcours). Le composant de présentation sous-jacent `<Programme>` reste utilisable en manuel (items écrits à la main) pour les one-shots hors parcours.
- Conséquence : modifier l'ordre des jours, un `theme`, un `summary`, ou déplacer un deck d'un jour à l'autre dans le frontmatter du parcours régénère l'agenda au prochain build, sans toucher au deck.

## Pièges (gotchas)

- **Alignement hero ↔ contenu** : `.parcours-hero__inner` et `.parcours-main` doivent partager le MÊME modèle de boîte (même `max-width`, padding **à l'intérieur** de la boîte, `box-sizing: border-box`). Mélanger « padding sur le conteneur externe » et « padding interne » décale tout horizontalement de la valeur du padding.
- **« Trop de marge sur les côtés »** vient du `max-width` (espace latéral sur grand écran), pas du `padding` : pour élargir, augmenter `max-width`, pas réduire le padding.
