# Présentation — conventions

> Ce document a été vidé le 2026-06-09. Il décrivait des composants et des
> conventions aujourd'hui périmés (composants pré-Hero supprimés, route
> `/lecture/` inexistante, table de tokens couleur désynchronisée de
> `themes.css`). Les sources de vérité vivantes sont désormais :

- **Règles de création de slide** : `.claude/rules/` (chargé à chaque session)
  - `slides.md` (règles visuelles intangibles), `themes.md` (tokens couleur),
    `typographie.md` (tokens de taille), `conventions.md` (contenu), `parcours.md`, `polls.md`.
- **Catalogue des layouts** (un exemple de props par composant vivant) :
  `src/content/presentations/template.mdx`.
- **Procédure pas-à-pas** pour ajouter un slide : skill `.claude/skills/creer-slide`.
- **Vue d'ensemble du repo** : `.claude/CLAUDE.md`.

## URL et structure (à jour)

| Type | Pattern | Source |
|------|---------|--------|
| Présentation (Reveal + lecture scroll) | `/p/<slug>/` | `src/content/presentations/<slug>.mdx` |
| Handout PDF (1up paysage / 2up / 3up notes) | `/p/<slug>/handout/<mode>/` | idem |
| PDF pré-buildés (R2) | `https://pdf.lausanne.marketing/<slug>-<mode>up.pdf` | workflow `Build & upload handouts` |
| Parcours | `/parcours/<slug>/` | `src/content/parcours/<slug>.mdx` |
| Vote sondage live | `/v/<token>/` | `src/pages/v/[token].astro` |
| Mode présentateur | `/presenter/` | `src/pages/presenter.astro` |

## Pipeline build PDF

À chaque push sur `main`, le workflow `.github/workflows/build-handouts.yml` détecte
les `.mdx` modifiés (rebuild ciblé) ou les fichiers globaux (rebuild complet),
génère les PDF via Puppeteer/Chrome, et les upload sur le bucket R2 `lm-handouts`.
La modale `PdfModal` du site tente R2 d'abord, puis retombe sur le worker `lm-pdf`
(génération à la volée) en cas de 404.
