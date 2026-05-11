# Présentation — conventions

Document de référence pour créer / modifier des présentations dans `lm-presentation` (https://slides.lausanne.marketing).

## URL et structure

| Type | Pattern | Source |
|------|---------|--------|
| Présentation (mode Reveal) | `/p/<slug>/` | `src/content/presentations/<slug>.mdx` |
| Présentation (mode lecture scroll) | `/p/<slug>/lecture/` | idem |
| Handout PDF (1up paysage / 2up portrait / 3up notes) | `/p/<slug>/handout/<mode>/` | idem, généré dynamique |
| PDF pré-buildés (R2) | `https://pdf.lausanne.marketing/<slug>-<mode>up.pdf` | rebuild auto à chaque push (workflow `Build & upload handouts`) |
| Parcours (regroupe plusieurs decks sous un thème) | `/parcours/<slug>/` | `src/content/parcours/<slug>.mdx` |
| Racine `slides.lausanne.marketing/` | redirect 302 → `https://lausanne.marketing` | `public/_redirects` |

## Charte visuelle

### Couleurs
| Token | Valeur | Usage |
|-------|--------|-------|
| **Gold** | `#FFD838` | Couleur signature : cover bg, watermark, rule, bullets num, badge eyebrow |
| **Noir** | `#191919` | Texte principal, accent rotative, polaroid frame |
| **Gris texte** | `#6B6F84` | Subtitle, body texte, role |
| **Blanc** | `#FFFFFF` | Background slide standard, card |
| **Border gris** | `rgba(25, 25, 25, 0.06–0.10)` | Séparateurs cards / bullets |

### Typographie
| Font | Usage |
|------|-------|
| **Hanken Grotesk** (700–900) | Tous les titres (h1/h2/h3), nom monumental, texte body 22–32px |
| **Space Grotesk** (700, mono fallback) | Eyebrow uppercase, numéros (01, 02), labels uppercase, monospace UI |

Pas d'Inter, pas d'Arial, pas d'Open Sans : la charte exige des polices distinctives.

### Tailles (référence pour `<section>` 1920×1080)
| Élément | Font-size |
|---------|-----------|
| Title monumental (Cover, AboutMe) | `clamp(120–140px, 14–15vw, 260–280px)` |
| Section title | `clamp(80px, 9vw, 160px)` |
| Slide title (`<h2>`) | 56px |
| Subtitle slide | 24px |
| Watermark gigantesque (Cover) | 1100px |
| Watermark Section (latéral) | `clamp(420px, 60vw, 880px)` |
| Body texte / role | 28–36px |
| Card title | 30px |
| Card text | 22–26px |
| Eyebrow badge | 18–22px |
| Bullet number | 36–56px |

### Marqueur signature (highlight)
Tous les titres principaux (Cover, Section, AboutMe, Closing) supportent un prop `highlight` qui souligne un mot avec une **bande noire rotative -1.5°** placée derrière (`z-index: -1`). C'est notre élément de signature.

### Layout / padding
- Section : `padding: 96px 96px !important;`
- Wash gold radial bottom-left sur les slides à fond clair (`Section`, `AboutMe`)
- Watermark monumental gold ou noir 0.08 opacity sur les Cover / Section / AboutMe / Closing
- Animations : stagger `cubic-bezier(0.16, 1, 0.3, 1)` sur titre / contenu, `pop` `cubic-bezier(0.34, 1.56, 0.64, 1)` sur polaroid / éléments décoratifs

### Sections obligatoirement compatibles handout
Tout composant slide doit :
1. Être une `<section>` racine avec `data-layout="<slug>"` (utilisé par le centrage handout PDF)
2. Avoir `width: 100%; height: 100%; overflow: hidden`
3. Pouvoir être imprimé sans interaction JS (timers, iframe Spotify, etc. sont gated sur `Astro.url.pathname.includes('/handout/')`)

## Composants slide existants

| Composant | Usage | Props principaux |
|-----------|-------|------------------|
| `Cover` | Page de garde gold pleine | title, subtitle, eyebrow, image (polaroid), highlight, watermark |
| `Section` | Transition de section, fond blanc, watermark numérique gold latéral | number, title, subtitle, highlight, eyebrow |
| `AboutMe` | Slide intervenant, photo polaroid + 4 bullets numérotés | firstName, lastName, highlight, role, photo, watermark, bullets[] |
| `ImageGrid` | Grille 2 / 3 / 4 / 5 cards image + titre + texte | title, subtitle, highlight, images[] |
| `TableSlide` | Tableau structuré (calendrier, comparatif tarifaire, etc.) | title, subtitle, columns[], rows[] |
| `Calendar` | Variant de `TableSlide` pour les calendriers jour | day, sessions[] |
| `Statement` | Citation / phrase courte centrée gros | text, highlight, attribution |
| `Quote` | Quote avec auteur + role | quote, author, role |
| `BigImage` | Image plein écran + caption | image, caption |
| `NumberedCards` | 2–6 cards numérotées (workflows, étapes) | items[] |
| `NumberedCardWithDetail` | Card numéro + image illustrative + déclencheur/prérequis/actions | number, label, image, blocks[] |
| `Workshop` | Atelier (durée, objectif, sujet, attentes) | title, duration, items[] |
| `Timer` | Pause avec compte à rebours + Spotify optionnel (hors handout) | minutes, title, subtitle, spotify |
| `Closing` | Slide finale (Q&R, merci) | variant ('qa' \| 'thanks') |

## Conventions MDX

```mdx
---
title: "Titre complet"          # Affiché dans le head et la modale
subtitle: "Sous-titre court"
short: "Mot-clé"                # Pour le menu deck
date: 2026-05-08                # ISO
type: cours | atelier | commercial | workshop
unlisted: true                  # Cache la présentation des index publics
description: "Pour SEO + OpenGraph"
---

import Cover from '@/components/slides/Cover.astro';
import Section from '@/components/slides/Section.astro';
// ...

<Cover title="…" highlight="…" watermark="LM" />
<Section number="01" title="…" />
<ImageGrid title="…" images={[…]} />
```

Toutes les slides du MDX sont rendues comme `<section>` enfants directs du conteneur Reveal en mode présentation, et regroupées par 1/2/4 en mode handout selon `?mode=`.

## Règles d'écriture
- Pas de tirets cadratins (`—`) ni demi-cadratins (`–`) dans le contenu de slides : deux-points, virgules ou parenthèses à la place. Texte qui paraît plus humain, moins IA.
- Français suisse pour les nombres : `2'250 CHF`.
- Devise CHF par défaut.
- Pas d'emojis dans les slides.
- Nommage : composants en `PascalCase`, présentations / parcours en `kebab-case`.

## Pipeline build PDF

À chaque push sur `main` :
1. GitHub Action `Build & upload handouts` détecte les fichiers modifiés via `git diff`
2. Si un `.mdx` change → rebuild que les 3 PDFs de ce slug
3. Si un layout / composant slide / module / style commun / script change → rebuild **tous** les PDFs
4. Génération via Puppeteer sur Chrome local (CI Linux runner)
5. Upload sur R2 bucket `lm-handouts` via wrangler, cache `s-maxage=3600, max-age=300`
6. URL stable `https://pdf.lausanne.marketing/<slug>-<mode>up.pdf`

La modale `PdfModal` du site tente R2 d'abord (instantané si présent), fallback transparent sur le worker `lm-pdf` (génération à la volée) si 404.

## Pour ajouter une nouvelle slide custom
1. Créer `src/components/slides/<NomComposant>.astro`
2. Structure obligatoire : `<section class="<slug>" data-layout="<slug>">` + `width:100%; height:100%; overflow:hidden` + `padding: 96px 96px !important;`
3. CSS scoppé en interne, polices Hanken/Space Grotesk, palette gold/noir
4. Si interaction JS : gater sur `Astro.url.pathname.includes('/handout/')` pour ne pas casser le PDF
5. Importer + utiliser dans le MDX cible
6. Push → workflow CI regénère les PDFs

## Pour créer un parcours (regroupement de decks)
- `src/content/parcours/<slug>.mdx` avec frontmatter `title`, `subtitle`, `decks: [slug-deck-1, slug-deck-2]`
- Accessible à `/parcours/<slug>/`
- Pas d'index global volontairement : accès par lien direct.
