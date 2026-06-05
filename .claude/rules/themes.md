# Schémas de couleurs (tokens) : RÈGLE ABSOLUE

Deux schémas : **LM** (jaune/encre noire/pearl) et **ExecEd** (rouge/navy/clair).
Source de vérité : `src/styles/themes.css` (`:root` = LM, `[data-scheme="execed"]`).

## Règle pour tout composant de slide

- **Aucune couleur hex en dur.** Utiliser les tokens : `var(--c-ink)`, `--c-muted`,
  `--c-faint`, `--c-accent`, `--c-accent-soft`, `--c-on-accent`, `--c-secondary`,
  `--c-bg-start`, `--c-bg-end`, `--c-cream`, `--c-surface`.
- Teintes semi-transparentes : `color-mix(in srgb, var(--c-…) N%, transparent)`.
- **Texte/icône sur fond accent** : tout élément avec `background: var(--c-accent)`
  qui contient du texte ou une icône DOIT poser `color: var(--c-on-accent)` (encre
  en LM sur le jaune, blanc en ExecEd sur le rouge), sinon c'est illisible. Les
  carrés / barres / points décoratifs (sans texte) n'en ont pas besoin.
- **Titre avec partie en valeur** (`italicPart`) : utiliser le helper
  `splitHighlight(title, italicPart)` de `@/utils/highlight`, JAMAIS
  `title.split(italicPart)[0/1]` inline : ce dernier rend « undefined » sur la
  slide si `italicPart` n'est pas une sous-chaîne exacte du titre.
- Logo : classe en `…__brand-logo` (swap auto via `--logo-url` ; `content: url()`
  sur `<img>` = Chromium uniquement, OK présentation + PDF Browser Rendering, le
  `src=""` sert de fallback). Logo blanc sur fond sombre : ajouter le sélecteur
  dans le bloc logo blanc de `themes.css`.
- Exceptions littérales admises : le blanc « on-ink » (texte/icône blanc sur un
  élément `var(--c-ink)`), les couleurs réalistes (device mockup), les voiles
  blancs sur image, et le chrome des widgets de réglage.

Conséquence : un nouveau composant naît dans les deux schémas sans travail en plus.

## Schéma d'un deck

Frontmatter `scheme: "lm" | "execed"` (défaut `lm`). **Figé** une fois le deck
validé : on n'en change jamais. Le toggle n'existe que dans `template.mdx`.

Tout layout qui rend des decks doit poser `data-scheme={scheme}` sur le `<body>`
(cf. `Deck.astro`, `Handout.astro`), sinon un deck ExecEd s'affiche en LM : piège
rencontré sur l'export PDF du handout.

## Piège dev / build (rappel)

Ne jamais lancer `npm run build` pendant qu'`astro dev` tourne : boucle de reload
Vite (`Failed to load url astro:server-app.js`). Détaillé dans `.claude/CLAUDE.md`
(section « Ne JAMAIS ») ; garde-fou dans `astro.config.mjs` (`vite.server.watch`).
