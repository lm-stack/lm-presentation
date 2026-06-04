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
  élément `var(--c-ink)`), les couleurs réalistes (device mockup), les voiles
  blancs sur image, et le chrome des widgets de réglage.

Conséquence : un nouveau composant naît dans les deux schémas sans travail en plus.

## Schéma d'un deck

Frontmatter `scheme: "lm" | "execed"` (défaut `lm`). **Figé** une fois le deck
validé : on n'en change jamais. Le toggle n'existe que dans `template.mdx`.
