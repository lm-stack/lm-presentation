# Refonte page parcours (filtre + thème) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doter la page parcours d'une barre de filtre (recherche + chips par jour), d'une liste éditoriale soignée et d'un sélecteur de thème LM/ExecEd, sans toucher aux fichiers de decks.

**Architecture:** Page Astro statique unique (`src/pages/parcours/[slug].astro`) réécrite pour consommer les tokens `themes.css` et poser `data-scheme` sur `<body>`. Le filtrage est client-side (script inline, `data-*`), sans framework. Un nouveau composant `ParcoursSchemeSwitcher.astro` gère le toggle (persistance localStorage par parcours, masquable par un flag). Le groupement par jour vient d'un champ `days` optionnel ajouté au schéma de la collection `parcours` (les decks restent intouchés).

**Tech Stack:** Astro 6 (statique), CSS scopé + tokens `src/styles/themes.css`, JS DOM vanilla. Vérification : `astro check` + `astro build` (pas de test runner dans le repo).

**Contraintes :** worktree isolé `.claude/worktrees/parcours` (branche `feat/parcours`). NE JAMAIS toucher `src/content/presentations/**`, `src/styles/themes.css`, `src/components/SchemeSwitcher.astro`, `src/layouts/**`, composants de slides. UTF-8 complet, pas d'em-dash, pas d'emojis, aucune couleur hex en dur hors chrome du widget de réglage.

---

## Task 0 : Préparer le worktree pour les builds

Le worktree n'a pas de `node_modules` (git ne checkoute que les fichiers suivis). On crée une jonction vers le `node_modules` du dossier principal (instantané, pas de réinstallation). Chaque worktree a son propre `.astro/` et `dist/`, donc pas de conflit de watcher.

**Files:** aucun fichier suivi (jonction locale, hors git).

- [ ] **Step 1 : créer la jonction node_modules**

Depuis le worktree (`C:\Users\trouaud\Github\lm-presentation\.claude\worktrees\parcours`), en PowerShell :

```powershell
if (-not (Test-Path node_modules)) { cmd /c mklink /J node_modules ..\..\..\node_modules }
```

- [ ] **Step 2 : vérifier que le build de base passe AVANT toute modif**

Run (PowerShell, dans le worktree) : `npm run build`
Expected : build Astro qui réussit, génère `dist/`. Sert de référence (état `0301540` propre). Ne PAS lancer `astro dev` en parallèle.

---

## Task 1 : Étendre le schéma de la collection `parcours`

Ajoute `scheme` et `days` au **seul** schéma `parcours`. La collection `presentations` n'est pas touchée.

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1 : ajouter les champs au schéma `parcours`**

Dans `src/content.config.ts`, dans le `z.object({ ... })` de `const parcours = defineCollection({...})`, après la ligne `decks: z.array(z.string()).min(1),`, ajouter :

```ts
    // Thème par défaut du parcours. Modifiable a tout moment (contrairement aux
    // decks, figes). Le selecteur (ParcoursSchemeSwitcher) peut le surcharger en preview.
    scheme: z.enum(['lm', 'execed']).default('lm'),
    // Groupement optionnel des decks par jour (active les chips de filtre).
    // Chaque slug doit appartenir a `decks` (valide au rendu dans [slug].astro).
    // Absent => barre de filtre en recherche seule (pas de chips).
    days: z
      .array(
        z.object({
          label: z.string(),
          decks: z.array(z.string()).min(1),
        })
      )
      .optional(),
```

- [ ] **Step 2 : vérifier les types**

Run : `npm run check`
Expected : pas d'erreur TypeScript liée à `content.config.ts`. (Des warnings préexistants ailleurs sont tolérés ; aucune NOUVELLE erreur.)

- [ ] **Step 3 : commit**

```bash
git add src/content.config.ts
git commit -m "feat(parcours): schema scheme + days (groupement par jour) sur la collection parcours"
```

---

## Task 2 : Renseigner le frontmatter des parcours

`crm-data-automation` reçoit son thème et son découpage en jours ; `template-parcours` reçoit juste `scheme` (pas de `days` → recherche seule). Aucun deck modifié.

**Files:**
- Modify: `src/content/parcours/crm-data-automation.mdx`
- Modify: `src/content/parcours/template-parcours.mdx`

- [ ] **Step 1 : crm-data-automation — ajouter `scheme` + `days`**

Dans `src/content/parcours/crm-data-automation.mdx`, le frontmatter complet devient (remplacer tout le bloc entre les `---`) :

```yaml
title: "CRM, Data & Automation"
short: "CRM, Data & Automation"
eyebrow: "Juin 2026"
highlight: "Automation"
description: "Parcours CRM, Data & Automation (HEC Lausanne Executive Education) : layouts ExecEd-style en charte Lausanne Marketing."
date: 2026-06-01
scheme: lm
decks:
  - introduction
  - collecte-donnees
  - qualite-donnees
  - architecture-donnees
  - segmentation-activation
  - marketing-automation
  - workflows
  - lead-nurturing
  - funnel-marketing
  - protection-donnees
  - workflows-avances
  - ia-automation
  - conclusion
days:
  - label: "Jour 1"
    decks: [collecte-donnees, qualite-donnees, architecture-donnees, segmentation-activation]
  - label: "Jour 2"
    decks: [protection-donnees, marketing-automation, workflows]
  - label: "Jour 3"
    decks: [lead-nurturing, funnel-marketing, workflows-avances, ia-automation]
```

(Le corps MDX sous le frontmatter reste inchangé. `introduction` et `conclusion` ne sont dans aucun jour : housekeeping, visibles sous « Tous » uniquement.)

- [ ] **Step 2 : template-parcours — ajouter `scheme`**

Dans `src/content/parcours/template-parcours.mdx`, ajouter la ligne `scheme: lm` dans le frontmatter, juste après `date: 2026-05-10`. Ne pas ajouter de `days`. Résultat du frontmatter :

```yaml
title: "Parcours modèle"
short: "Parcours modèle"
eyebrow: "Catalogue interne"
highlight: "modèle"
description: "Exemple de parcours qui agrège plusieurs présentations sous un thème commun. Démontre la structure éditoriale et la navigation portail."
date: 2026-05-10
scheme: lm
decks:
  - template
```

- [ ] **Step 3 : vérifier le build (l'ancienne page ignore encore `days`, doit passer)**

Run : `npm run build`
Expected : build OK. `days` est du frontmatter en plus, inutilisé par la page actuelle → aucune régression.

- [ ] **Step 4 : commit**

```bash
git add src/content/parcours/crm-data-automation.mdx src/content/parcours/template-parcours.mdx
git commit -m "feat(parcours): scheme + decoupage en jours pour crm-data-automation, scheme pour le template"
```

---

## Task 3 : Composant `ParcoursSchemeSwitcher.astro`

Widget fixe haut-droite, indépendant de `SchemeSwitcher.astro` (lié à un deck). Markup rendu côté serveur, câblé par un petit script `define:vars` (clé localStorage par parcours).

**Files:**
- Create: `src/components/ParcoursSchemeSwitcher.astro`

- [ ] **Step 1 : créer le composant**

Contenu complet de `src/components/ParcoursSchemeSwitcher.astro` :

```astro
---
// src/components/ParcoursSchemeSwitcher.astro
// Selecteur LM / ExecEd pour une page parcours. Pose data-scheme sur <body> et
// memorise par parcours (localStorage). Independant de SchemeSwitcher.astro (lie a
// un deck). Masquable : la page ne le rend pas si SHOW_SCHEME_SWITCHER est false,
// auquel cas le scheme du frontmatter fait loi (aucun script de preview).
interface Props {
  slug: string;
}
const { slug } = Astro.props;
const storageKey = `lm-parcours-scheme:${slug}`;
---
<div class="lm-parcours-scheme" role="group" aria-label="Choisir le thème">
  <span class="lm-parcours-scheme__label">Thème</span>
  <button type="button" data-scheme-opt="lm">LM</button>
  <button type="button" data-scheme-opt="execed">ExecEd</button>
</div>

<style>
  /* Chrome de widget de reglage : exception admise au "pas de hex en dur"
     (cf. .claude/rules/themes.md). Le reste suit les tokens. */
  .lm-parcours-scheme {
    position: fixed; top: 50%; right: 24px; transform: translateY(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 8px;
    padding: 12px 10px; background: color-mix(in srgb, var(--c-surface) 92%, transparent);
    border: 1px solid color-mix(in srgb, var(--c-ink) 8%, transparent); border-radius: 10px;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--c-ink) 12%, transparent);
    font-family: 'Hanken Grotesk', sans-serif;
  }
  .lm-parcours-scheme__label {
    padding: 0 2px 6px; font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.18em; color: var(--c-muted);
    border-bottom: 1px solid color-mix(in srgb, var(--c-ink) 6%, transparent);
  }
  .lm-parcours-scheme button {
    min-width: 64px; padding: 8px 10px;
    border: 2px solid color-mix(in srgb, var(--c-ink) 8%, transparent);
    border-radius: 6px; cursor: pointer; background: var(--c-surface); font-size: 12px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-ink);
    transition: border-color 0.18s ease, transform 0.18s ease;
  }
  .lm-parcours-scheme button:hover { transform: scale(1.04); }
  .lm-parcours-scheme button[data-scheme-opt="lm"].is-active {
    border-color: #FFD838; box-shadow: 0 0 0 2px rgba(255, 216, 56, 0.3);
  }
  .lm-parcours-scheme button[data-scheme-opt="execed"].is-active {
    border-color: #E73952; box-shadow: 0 0 0 2px rgba(231, 57, 82, 0.3);
  }
  @media (max-width: 768px) {
    .lm-parcours-scheme { right: 12px; padding: 8px 7px; }
    .lm-parcours-scheme button { min-width: 52px; padding: 6px 8px; }
  }
</style>

<script define:vars={{ storageKey }}>
  (function () {
    const schemes = ['lm', 'execed'];
    const widget = document.querySelector('.lm-parcours-scheme');
    if (!widget) return;
    const stored = localStorage.getItem(storageKey);
    const initial = stored && schemes.includes(stored)
      ? stored
      : (document.body.dataset.scheme || 'lm');
    document.body.dataset.scheme = initial;
    const buttons = Array.from(widget.querySelectorAll('button'));
    function sync(active) {
      buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.schemeOpt === active));
    }
    sync(initial);
    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        const s = b.dataset.schemeOpt;
        document.body.dataset.scheme = s;
        localStorage.setItem(storageKey, s);
        sync(s);
      });
    });
  })();
</script>
```

- [ ] **Step 2 : vérifier les types**

Run : `npm run check`
Expected : pas de nouvelle erreur. (Le composant n'est pas encore importé, c'est normal.)

- [ ] **Step 3 : commit**

```bash
git add src/components/ParcoursSchemeSwitcher.astro
git commit -m "feat(parcours): composant ParcoursSchemeSwitcher (toggle LM/ExecEd par parcours)"
```

---

## Task 4 : Réécrire la page parcours

Refonte complète : tokens partout, `data-scheme` sur `<body>`, calcul du mapping jour + validation, barre de filtre, liste éditoriale, filtrage JS, inclusion du sélecteur derrière un flag.

**Files:**
- Modify (réécriture complète): `src/pages/parcours/[slug].astro`

- [ ] **Step 1 : remplacer tout le fichier `src/pages/parcours/[slug].astro` par :**

```astro
---
// src/pages/parcours/[slug].astro
// Portail d'un parcours : hero + barre de filtre (recherche + chips par jour) +
// liste editoriale des decks, themable LM/ExecEd via les tokens themes.css.
// Acces direct par lien (pas d'index global volontaire).
import { getCollection, getEntry } from 'astro:content';
import '@/styles/global.css';
import '@/styles/themes.css';
import FontsPreload from '@/components/FontsPreload.astro';
import ParcoursSchemeSwitcher from '@/components/ParcoursSchemeSwitcher.astro';
import { splitHighlight } from '@/utils/highlight';

// Passer a false pour masquer le selecteur de theme (le scheme du frontmatter
// fait alors loi : aucun script de preview ne tourne).
const SHOW_SCHEME_SWITCHER = true;

export async function getStaticPaths() {
  const all = await getCollection('parcours');
  return all
    .filter((p) => !p.data.unlisted)
    .map((p) => ({
      params: { slug: p.id },
      props: { entry: p },
    }));
}

const { entry } = Astro.props;
const data = entry.data;
const parcoursSlug = entry.id;
const scheme = data.scheme;

const decksData = await Promise.all(
  data.decks.map(async (slug) => {
    const deck = await getEntry('presentations', slug);
    if (!deck) {
      throw new Error(
        `Parcours "${parcoursSlug}" reference le deck "${slug}" qui n'existe pas dans src/content/presentations/.`
      );
    }
    return { slug, ...deck.data };
  })
);

// Mapping slug -> label de jour (+ validation : chaque slug de `days` doit etre
// dans `decks`). Decks hors `days` (housekeeping) : pas de tag, visibles sous "Tous".
const deckSlugSet = new Set(data.decks);
const dayOf = new Map<string, string>();
const dayChips: { label: string; count: number }[] = [];
if (data.days) {
  for (const day of data.days) {
    let count = 0;
    for (const dslug of day.decks) {
      if (!deckSlugSet.has(dslug)) {
        throw new Error(
          `Parcours "${parcoursSlug}" : le jour "${day.label}" reference le deck "${dslug}" absent de la liste "decks".`
        );
      }
      dayOf.set(dslug, day.label);
      count++;
    }
    dayChips.push({ label: day.label, count });
  }
}
const hasDays = dayChips.length > 0;

const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const titleParts = splitHighlight(data.title, data.highlight);
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <FontsPreload />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />
    <link rel="shortcut icon" href="/favicon.png" />
    <title>{data.title} : Lausanne Marketing</title>
    {data.description && <meta name="description" content={data.description} />}
    <link rel="canonical" href={canonical} />
    <meta name="robots" content="noindex" />
    <meta property="og:title" content={data.title} />
    {data.description && <meta property="og:description" content={data.description} />}
    {data.cover && <meta property="og:image" content={new URL(data.cover, Astro.site).toString()} />}
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
  </head>
  <body class="parcours-body" data-scheme={scheme}>
    <header class="parcours-hero">
      <span class="parcours-hero__noise" aria-hidden="true"></span>
      <span class="parcours-hero__wash" aria-hidden="true"></span>

      <div class="parcours-hero__inner">
        <div class="parcours-hero__head">
          <p class="parcours-hero__eyebrow">{data.eyebrow ?? 'Parcours'}</p>
          <span class="parcours-hero__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
              <path d="M32 64 128 32l96 32-96 32z" />
              <path d="M32 64v72" />
              <path d="M64 80v52a64 64 0 0 0 128 0V80" />
            </svg>
          </span>
        </div>
        <h1 class="parcours-hero__title">
          {titleParts
            ? <>{titleParts.before}<span class="parcours-hero__mark">{titleParts.match}</span>{titleParts.after}</>
            : data.title}
        </h1>
        {data.description && <p class="parcours-hero__description">{data.description}</p>}
        <p class="parcours-hero__meta">
          <span class="parcours-hero__count">{decksData.length} {decksData.length > 1 ? 'modules' : 'module'}</span>
          {hasDays && (
            <>
              <span class="parcours-hero__sep" aria-hidden="true">·</span>
              <span>{dayChips.length} jours</span>
            </>
          )}
          {data.updated && (
            <>
              <span class="parcours-hero__sep" aria-hidden="true">·</span>
              <span>Mis à jour : {data.updated}</span>
            </>
          )}
        </p>
        <span class="parcours-hero__rule" aria-hidden="true"></span>
      </div>
    </header>

    <main class="parcours-main">
      <div class="parcours-filter" role="search">
        <div class="parcours-filter__search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M229.66 218.34 179.6 168.28a88.21 88.21 0 1 0-11.32 11.32l50.06 50.06a8 8 0 0 0 11.32-11.32ZM40 112a72 72 0 1 1 72 72 72.08 72.08 0 0 1-72-72Z" />
          </svg>
          <label class="sr-only" for="parcours-search">Rechercher un module</label>
          <input id="parcours-search" type="search" placeholder="Rechercher un module…" autocomplete="off" />
        </div>
        {hasDays && (
          <div class="parcours-filter__chips" role="group" aria-label="Filtrer par jour">
            <button type="button" class="parcours-chip is-active" data-day-chip="" aria-pressed="true">Tous</button>
            {dayChips.map((d) => (
              <button type="button" class="parcours-chip" data-day-chip={d.label} aria-pressed="false">
                {d.label}<span class="parcours-chip__count">{d.count}</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" id="parcours-reset" class="parcours-filter__reset" title="Réinitialiser">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224 128a96 96 0 0 1-94.71 96H128a95.38 95.38 0 0 1-65.9-26.2 8 8 0 0 1 11-11.63A80 80 0 1 0 71 75.5l-3.7 3.34H92a8 8 0 0 1 0 16H48a8 8 0 0 1-8-8V42.83a8 8 0 0 1 16 0v18.93l3.56-3.22A96 96 0 0 1 224 128Z" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      <p id="parcours-count" class="parcours-count" aria-live="polite">{decksData.length} {decksData.length > 1 ? 'modules' : 'module'}</p>

      <ol class="parcours-list">
        {decksData.map((deck, i) => {
          const num = String(i + 1).padStart(2, '0');
          const dayLabel = dayOf.get(deck.slug) ?? '';
          const desc = deck.description ?? deck.short ?? '';
          const searchBlob = `${deck.title} ${desc} ${deck.slug}`.toLowerCase();
          return (
            <li class="module-row" data-day={dayLabel} data-search={searchBlob} style={`--stagger-i: ${i}`}>
              <a class="module-row__link" href={`/p/${deck.slug}?from=${parcoursSlug}`}>
                <span class="module-row__num" aria-hidden="true">{num}</span>
                <span class="module-row__thumb">
                  {deck.cover ? (
                    <img src={deck.cover} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
                  ) : (
                    <span class="module-row__thumb-ph" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
                        <path d="M164.44 105.34 108.32 67.92A8 8 0 0 0 96 74.59v74.83a8 8 0 0 0 12.32 6.66l56.12-37.41a8 8 0 0 0 0-13.31Z" />
                        <path d="M232 32H24a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h208a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8m-8 144H32V48h192Z" />
                      </svg>
                    </span>
                  )}
                </span>
                <span class="module-row__body">
                  <span class="module-row__title">{deck.title}</span>
                  {desc && <span class="module-row__desc">{desc}</span>}
                </span>
                {dayLabel && <span class="module-row__day">{dayLabel}</span>}
                <span class="module-row__arrow" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                    <path d="m181.66 133.66-80 80a8 8 0 0 1-11.32-11.32L164.69 128 90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32Z" />
                  </svg>
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      <p id="parcours-empty" class="parcours-empty">Aucun module ne correspond à la recherche.</p>
    </main>

    <footer class="parcours-footer">
      <span class="parcours-footer__brand">Lausanne Marketing</span>
      <span class="parcours-footer__sep" aria-hidden="true">•</span>
      <span class="parcours-footer__short">{data.short ?? data.title}</span>
    </footer>

    {SHOW_SCHEME_SWITCHER && <ParcoursSchemeSwitcher slug={parcoursSlug} />}

    <style>
      .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }

      .parcours-body {
        margin: 0;
        font-family: 'Hanken Grotesk', sans-serif;
        background: var(--c-bg-start);
        color: var(--c-ink);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .parcours-hero { position: relative; overflow: hidden; padding: 56px 64px 40px; }
      .parcours-hero__noise {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.18; mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .parcours-hero__wash {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--c-accent) 32%, transparent) 0%, transparent 55%);
      }
      .parcours-hero__inner {
        position: relative; z-index: 1; max-width: 1152px; margin: 0 auto;
        animation: parcours-stagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .parcours-hero__head {
        display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px;
      }
      .parcours-hero__eyebrow {
        display: inline-block; font-family: 'Space Grotesk', monospace; font-size: 13px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.32em; color: var(--c-on-accent); margin: 0;
        padding: 6px 14px; background: var(--c-accent); border: 2px solid var(--c-ink); border-radius: 4px;
      }
      .parcours-hero__icon {
        display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
        border-radius: 50%; background: var(--c-ink); color: var(--c-accent); flex-shrink: 0;
      }
      .parcours-hero__title {
        font-family: 'Hanken Grotesk', sans-serif; font-weight: 800; font-size: clamp(40px, 5.5vw, 72px);
        line-height: 0.98; letter-spacing: -0.035em; color: var(--c-ink); margin: 0 0 16px; text-wrap: balance;
      }
      .parcours-hero__mark { position: relative; display: inline-block; white-space: nowrap; }
      .parcours-hero__mark::after {
        content: ''; position: absolute; left: -6px; right: -6px; bottom: 4px; height: 9px;
        background: var(--c-accent); z-index: -1; transform: rotate(-1.5deg);
      }
      .parcours-hero__description {
        font-size: 17px; font-weight: 500; line-height: 1.5; color: var(--c-muted);
        margin: 0 0 16px; max-width: 720px;
      }
      .parcours-hero__meta {
        display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
        font-family: 'Space Grotesk', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--c-faint); margin: 0;
      }
      .parcours-hero__count { color: var(--c-ink); }
      .parcours-hero__sep { color: color-mix(in srgb, var(--c-ink) 25%, transparent); }
      .parcours-hero__rule { display: block; width: 64px; height: 5px; background: var(--c-accent); margin-top: 24px; }

      .parcours-main {
        flex: 1; max-width: 1024px; width: 100%; margin: 0 auto; padding: 40px 64px 64px; box-sizing: border-box;
      }

      /* ---- Barre de filtre ---- */
      .parcours-filter {
        display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 16px;
      }
      .parcours-filter__search { position: relative; flex: 1 1 260px; min-width: 200px; }
      .parcours-filter__search svg {
        position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
        width: 16px; height: 16px; color: var(--c-faint); pointer-events: none;
      }
      .parcours-filter__search input {
        width: 100%; box-sizing: border-box; padding: 11px 16px 11px 40px;
        border: 1px solid color-mix(in srgb, var(--c-ink) 14%, transparent); border-radius: 999px;
        font-family: 'Hanken Grotesk', sans-serif; font-size: 14px; color: var(--c-ink);
        background: var(--c-surface); transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .parcours-filter__search input::placeholder { color: var(--c-faint); }
      .parcours-filter__search input:focus {
        outline: none; border-color: var(--c-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 25%, transparent);
      }
      .parcours-filter__chips { display: flex; gap: 8px; flex-wrap: wrap; }
      .parcours-chip {
        font-family: 'Space Grotesk', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
        padding: 8px 14px; border-radius: 999px; cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--c-ink) 14%, transparent);
        background: var(--c-surface); color: var(--c-ink);
        transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
      }
      .parcours-chip:hover { border-color: color-mix(in srgb, var(--c-ink) 32%, transparent); }
      .parcours-chip.is-active {
        background: var(--c-accent); color: var(--c-on-accent);
        border-color: var(--c-accent);
      }
      .parcours-chip__count { opacity: 0.55; margin-left: 5px; font-variant-numeric: tabular-nums; }
      .parcours-filter__reset {
        display: inline-flex; align-items: center; gap: 6px; font-family: 'Space Grotesk', monospace;
        font-size: 12px; font-weight: 700; padding: 9px 14px; border-radius: 999px; cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--c-ink) 14%, transparent);
        background: var(--c-surface); color: var(--c-muted);
        transition: color 0.18s ease, border-color 0.18s ease;
      }
      .parcours-filter__reset:hover { color: var(--c-ink); border-color: color-mix(in srgb, var(--c-ink) 32%, transparent); }
      .parcours-filter__reset svg { width: 14px; height: 14px; }

      .parcours-count {
        font-family: 'Space Grotesk', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--c-faint); margin: 0 0 16px;
      }

      /* ---- Liste editoriale ---- */
      .parcours-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .module-row {
        animation: parcours-row-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: calc(var(--stagger-i, 0) * 0.04s + 0.05s);
      }
      .module-row__link {
        display: flex; align-items: center; gap: 18px; text-decoration: none; color: inherit;
        background: var(--c-surface); border: 1px solid color-mix(in srgb, var(--c-ink) 8%, transparent);
        border-radius: 12px; padding: 14px 18px;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .module-row__link:hover {
        transform: translateX(3px);
        border-color: color-mix(in srgb, var(--c-accent) 60%, transparent);
        box-shadow: 0 12px 28px -16px color-mix(in srgb, var(--c-ink) 22%, transparent);
      }
      .module-row__num {
        font-family: 'Space Grotesk', monospace; font-weight: 800; font-variant-numeric: tabular-nums;
        font-size: 20px; color: var(--c-ink); width: 32px; text-align: center; flex-shrink: 0;
      }
      .module-row__thumb {
        position: relative; width: 88px; height: 56px; border-radius: 6px; overflow: hidden;
        flex-shrink: 0; background: var(--c-ink);
      }
      .module-row__thumb img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .module-row__link:hover .module-row__thumb img { transform: scale(1.05); }
      .module-row__thumb-ph {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        color: var(--c-accent);
      }
      .module-row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .module-row__title {
        font-weight: 800; font-size: 16.5px; line-height: 1.2; color: var(--c-ink);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .module-row__desc {
        font-size: 13px; line-height: 1.4; color: var(--c-muted);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .module-row__day {
        flex-shrink: 0; font-family: 'Space Grotesk', monospace; font-size: 11px; font-weight: 700;
        letter-spacing: 0.04em; padding: 4px 11px; border-radius: 999px;
        background: var(--c-accent); color: var(--c-on-accent);
      }
      .module-row__arrow {
        flex-shrink: 0; display: inline-flex; color: var(--c-faint); transition: transform 0.2s ease, color 0.2s ease;
      }
      .module-row__link:hover .module-row__arrow { transform: translateX(3px); color: var(--c-ink); }

      .parcours-empty {
        display: none; text-align: center; padding: 48px 20px; margin: 0;
        font-size: 15px; color: var(--c-muted);
      }

      .parcours-footer {
        display: flex; justify-content: center; align-items: center; gap: 12px; padding: 24px 32px 32px;
        font-family: 'Space Grotesk', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--c-faint);
        border-top: 1px solid color-mix(in srgb, var(--c-ink) 6%, transparent);
      }
      .parcours-footer__brand { color: var(--c-ink); }
      .parcours-footer__sep { color: color-mix(in srgb, var(--c-ink) 25%, transparent); }

      @keyframes parcours-stagger { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes parcours-row-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

      @media (max-width: 768px) {
        .parcours-hero { padding: 40px 24px 32px; }
        .parcours-hero__rule { width: 48px; margin-top: 16px; }
        .parcours-hero__icon { width: 48px; height: 48px; }
        .parcours-hero__icon svg { width: 28px; height: 28px; }
        .parcours-main { padding: 28px 20px 56px; }
        .module-row__link { gap: 12px; padding: 12px 14px; }
        .module-row__thumb { width: 64px; height: 42px; }
        .module-row__desc { display: none; }
      }
    </style>

    <script>
      (function () {
        const search = document.getElementById('parcours-search') as HTMLInputElement | null;
        const chips = Array.from(document.querySelectorAll<HTMLElement>('[data-day-chip]'));
        const reset = document.getElementById('parcours-reset');
        const count = document.getElementById('parcours-count');
        const empty = document.getElementById('parcours-empty');
        const items = Array.from(document.querySelectorAll<HTMLElement>('.module-row'));
        let activeDay = '';

        function apply() {
          const q = (search?.value || '').trim().toLowerCase();
          let shown = 0;
          items.forEach((li) => {
            const okQ = !q || (li.dataset.search || '').includes(q);
            const okD = !activeDay || li.dataset.day === activeDay;
            const visible = okQ && okD;
            li.style.display = visible ? '' : 'none';
            if (visible) shown++;
          });
          if (count) count.textContent = shown + (shown > 1 ? ' modules' : ' module');
          if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
        }

        search?.addEventListener('input', apply);
        chips.forEach((chip) => {
          chip.addEventListener('click', () => {
            activeDay = chip.dataset.dayChip || '';
            chips.forEach((c) => {
              const on = c === chip;
              c.classList.toggle('is-active', on);
              c.setAttribute('aria-pressed', String(on));
            });
            apply();
          });
        });
        reset?.addEventListener('click', () => {
          if (search) search.value = '';
          activeDay = '';
          chips.forEach((c) => {
            const on = (c.dataset.dayChip || '') === '';
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-pressed', String(on));
          });
          apply();
          search?.focus();
        });
      })();
    </script>
  </body>
</html>
```

- [ ] **Step 2 : type-check**

Run : `npm run check`
Expected : pas de nouvelle erreur de type sur `[slug].astro`.

- [ ] **Step 3 : build (valide getStaticPaths + validation jour/deck + rendu)**

Run : `npm run build`
Expected : build OK. Si une erreur « le jour "X" reference le deck "Y" absent de la liste decks » apparaît, corriger le mapping `days` dans `crm-data-automation.mdx`.

- [ ] **Step 4 : commit**

```bash
git add src/pages/parcours/[slug].astro
git commit -m "feat(parcours): refonte liste editoriale themee + barre de filtre recherche/jour + selecteur"
```

---

## Task 5 : Vérification visuelle et finalisation

**Files:** aucun (vérification).

- [ ] **Step 1 : preview local**

Run (dans le worktree, après avoir stoppé tout `astro dev`) : `npm run preview`
Ouvrir `/parcours/crm-data-automation`.

- [ ] **Step 2 : checklist manuelle**

Vérifier :
- [ ] 13 modules listés, dans l'ordre du frontmatter `decks`.
- [ ] Chips `Tous · Jour 1 · Jour 2 · Jour 3` avec compteurs `Jour 1 (4)`, `Jour 2 (3)`, `Jour 3 (4)`.
- [ ] Clic « Jour 2 » → seuls protection-donnees, marketing-automation, workflows visibles ; compteur « 3 modules ». `introduction`/`conclusion` masqués (housekeeping).
- [ ] Recherche « lead » → filtre par titre ; combiné avec un jour (ET logique).
- [ ] Reset → tout revient, focus sur la recherche.
- [ ] Recherche sans résultat → empty state affiché.
- [ ] Sélecteur haut-droite : bascule LM ↔ ExecEd (hero, eyebrow, chips actives, tags jour, surlignage du titre, icône). Rechargement → thème persisté.
- [ ] `/parcours/template-parcours` : pas de chips (1 deck, pas de `days`), barre en recherche seule, pas de régression.

- [ ] **Step 3 : nettoyer la jonction node_modules (optionnel, ne pas committer)**

La jonction `node_modules` est hors git (gitignored), rien à committer. Laisser en place pour de futurs builds, ou la retirer : `Remove-Item node_modules` (PowerShell, supprime seulement le lien).

- [ ] **Step 4 : finalisation**

Le travail est sur `feat/parcours` (worktree). Proposer à l'utilisateur : push + PR, ou rester local. NE PAS merger sans accord (d'autres branches en cours sur le repo).

---

## Self-review (couverture spec)

- Schéma `scheme` + `days` (parcours uniquement) → Task 1. ✓
- Mapping 13 modules / 3 jours + housekeeping → Task 2. ✓
- Liste éditoriale themée (tokens, data-scheme body) → Task 4. ✓
- Barre de filtre recherche + chips + reset + compteur + empty state → Task 4. ✓
- Filtrage client ET logique, aria-pressed, aria-live → Task 4 (script). ✓
- Sélecteur par parcours, localStorage `lm-parcours-scheme:<slug>`, masquable via `SHOW_SCHEME_SWITCHER` → Task 3 + Task 4. ✓
- Décès jamais touchés, themes.css/SchemeSwitcher.astro intouchés → respecté (aucune tâche ne les modifie). ✓
- Rétrocompat template (pas de `days` → recherche seule) → Task 2 + rendu conditionnel `hasDays` Task 4. ✓
- Hors-scope (sticky, réorg decks, thème pédagogique, themes.css) → non implémenté, conforme. ✓
