# lm-presentation v1 : foundation + sample deck déployé

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en ligne un site Astro à `slides.lausanne.marketing` qui affiche au moins une présentation (CRM, Data & automation) en mode plein écran (Reveal.js) et en mode lecture (scroll), avec la charte LM appliquée et les fondations pour ajouter d'autres présentations.

**Architecture:** Astro 5/6 statique + Tailwind v4 (via `@tailwindcss/vite`) + MDX pour les présentations + Reveal.js pour le mode plein écran. Une content collection `presentations` typée Zod, deux routes par deck (`/p/[slug]` et `/p/[slug]/lecture`), une landing avec liste. Layouts de slides en `.astro`, modules de contenu pour plus tard. Calque sur l'écosystème `lm/` (mêmes polices, mêmes patterns Astro, hébergement Cloudflare Pages).

**Tech Stack:** Astro 6, Tailwind CSS v4, MDX, Reveal.js 5, `astro-icon` + Phosphor Icons, Pagefind (recherche en mode lecture), Cloudflare Pages, Hanken Grotesk + Space Grotesk self-hosted.

**Hors scope v1 (à traiter dans un plan v2 séparé) :** extraction des 12 modules de contenu depuis `source/2025/`, écriture complète du deck CRM Data Auto (3 jours), polish design avancé, plugins Reveal additionnels (timer, pointer), Cloudflare Access pour contenus privés.

---

## Phase 1 : Init repo et structure

### Task 1 : Initialiser git et créer la structure de dossiers

**Files :**
- Create : `lm-presentation/.gitignore`
- Create : `lm-presentation/.claude/CLAUDE.md`
- Create : `lm-presentation/README.md`
- Create : `lm-presentation/source/README.md`

- [ ] **Step 1 : git init + windows.appendAtomically (OneDrive)**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git init
git config windows.appendAtomically false
git config user.name "Thomas Rouaud"
git config user.email "hello@lausanne.marketing"
```

Ce dernier `git config windows.appendAtomically false` est obligatoire sur OneDrive (sinon `unable to append to .git/logs/HEAD`).

- [ ] **Step 2 : Créer `.gitignore`**

```
node_modules/
dist/
.astro/
.DS_Store
.env
.env.local

# OneDrive desktop.ini
desktop.ini

# Source archive (PDF, PPTX, RAW) - trop lourd pour git, conservé en local
source/**/*.pptx
source/**/*.pdf
source/**/*.arw
source/**/*.png
source/**/*.jpg

# Fichiers Cloudflare
.wrangler/
```

- [ ] **Step 3 : Créer `.claude/CLAUDE.md`**

```markdown
# CLAUDE.md - lm-presentation

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

## Contexte

Site `slides.lausanne.marketing` qui héberge les présentations Lausanne Marketing (cours, PPT commerciaux, workshops, événements). Astro statique + Reveal.js pour le mode plein écran.

Branding : Lausanne Marketing (charte calquée sur `lm/`). Pas de branding ExecEd même si le contenu d'origine venait de là.

Spec : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`

## Stack

- Astro 6 (statique)
- Tailwind CSS v4 via `@tailwindcss/vite`
- MDX pour les fichiers de présentation
- Reveal.js 5 pour le mode plein écran
- astro-icon + Phosphor Icons
- Pagefind pour la recherche (mode lecture)
- Cloudflare Pages

## Structure

- `src/components/slides/` : layouts visuels génériques (Cover, Statement, TableSlide, etc.)
- `src/components/modules/` : modules de contenu réutilisables (StackPetiteStructure, FunnelTOFUMOFUBOFU, etc.)
- `src/content/presentations/` : fichiers MDX, un par présentation
- `src/layouts/Deck.astro` : mode présentation (Reveal init)
- `src/layouts/DeckReading.astro` : mode lecture (scroll)
- `src/pages/p/[slug].astro` : route présentation
- `src/pages/p/[slug]/lecture.astro` : route lecture
- `source/` : archive originaux (gitignored, jamais publié)

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

## Ne JAMAIS

- Ajouter Sveltia CMS (édition directe en code).
- Mettre des assets PPT/PDF/RAW dans le repo (toujours `source/` gitignored).
- Modifier les slides en mode présentation directement (toujours via MDX + composants).
```

- [ ] **Step 4 : Créer `README.md`**

```markdown
# lm-presentation

Site web de présentations Lausanne Marketing : `slides.lausanne.marketing`.

Cours, PPT commerciaux, workshops, événements. Mode plein écran (Reveal.js) + mode lecture (scroll).

## Stack

Astro 6 + Tailwind v4 + MDX + Reveal.js 5. Hébergé sur Cloudflare Pages.

## Développement

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
```

## Documentation

- Spec : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`
- Plan v1 : `docs/superpowers/plans/2026-05-07-lm-presentation-v1.md`

## Contribution

Voir `.claude/CLAUDE.md` pour les conventions.
```

- [ ] **Step 5 : Créer `source/README.md`**

```markdown
# source/

Archive des originaux (PDF, PPTX, RAW). **Gitignored**, présent uniquement en local.

Contenu utilisé comme matière première pour extraire les modules de contenu et reconstruire les présentations en branding LM.

## 2025/

Cours Growth Marketing donné en 2025 à HEC Lausanne ExecEd. 9 chapitres :

- 23 - Marketing automation
- 24 - Workflow
- 30 - Lead nurturing
- 31 - Funnel marketing
- 32 - Protection des données
- 33 - Workflows avancés
- 34 - IA & Automatisation
- 35 - Conclusion
```

- [ ] **Step 6 : Premier commit**

```bash
git add .gitignore .claude/CLAUDE.md README.md source/README.md docs/
git commit -m "init: structure repo + spec + plan v1"
```

---

### Task 2 : Créer `package.json` avec les dépendances

**Files :**
- Create : `lm-presentation/package.json`

- [ ] **Step 1 : Écrire `package.json`**

```json
{
  "name": "lm-presentation",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "description": "Site de présentations Lausanne Marketing : slides.lausanne.marketing",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && npx pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.7.1",
    "@iconify-json/ph": "^1.2.0",
    "astro": "^6.0.8",
    "astro-icon": "^1.1.0",
    "reveal.js": "^5.1.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/reveal.js": "^5.0.0",
    "pagefind": "^1.4.0",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 2 : Installer les dépendances**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm install
```

Expected : pas d'erreur, dossier `node_modules/` créé.

- [ ] **Step 3 : Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: ajoute package.json et installe les dependances"
```

---

### Task 3 : Configurer `astro.config.mjs`

**Files :**
- Create : `lm-presentation/astro.config.mjs`

- [ ] **Step 1 : Écrire la config Astro**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://slides.lausanne.marketing',
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/lecture/'),
    }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
  build: {
    format: 'directory',
  },
});
```

Le filter sitemap exclut les routes lecture (duplication avec la route principale).

- [ ] **Step 2 : Commit**

```bash
git add astro.config.mjs
git commit -m "feat: configure astro avec mdx, tailwind, sitemap, icons"
```

---

### Task 4 : Configurer TypeScript et alias

**Files :**
- Create : `lm-presentation/tsconfig.json`

- [ ] **Step 1 : Écrire `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

L'alias `@/*` permet `import Cover from '@/components/slides/Cover.astro'` au lieu de chemins relatifs.

- [ ] **Step 2 : Commit**

```bash
git add tsconfig.json
git commit -m "feat: ajoute tsconfig avec alias @/*"
```

---

## Phase 2 : Tailwind et fondations CSS

### Task 5 : Configurer `tailwind.config.mjs` avec les tokens LM

**Files :**
- Create : `lm-presentation/tailwind.config.mjs`

- [ ] **Step 1 : Écrire la config Tailwind**

Tokens copiés de `lm/tailwind.config.mjs` pour cohérence visuelle.

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFD838',
        'primary-light': '#FEE487',
        secondary: '#191919',
        text: 'var(--color-text, #6B6F84)',
        bg: '#FFFFFF',
        shadow: 'rgba(26, 26, 26, 0.04)',
        'dark-bg': '#2C3049',
        'dark-text': 'rgba(255, 255, 255, 0.92)',
        'dark-border': 'rgba(255, 255, 255, 0.42)',
        'dark-shadow': '#373D61',
      },
      fontFamily: {
        primary: ['"Hanken Grotesk"', 'sans-serif'],
        secondary: ['"Space Grotesk"', 'monospace'],
      },
      spacing: {
        1: '0.4rem',
        2: '0.8rem',
        3: '1.2rem',
        4: '1.6rem',
        5: '2rem',
        6: '2.4rem',
        7: '2.8rem',
        8: '3.2rem',
        9: '3.6rem',
        10: '4rem',
        12: '4.8rem',
        14: '5.6rem',
        16: '6.4rem',
        20: '8rem',
        25: '10rem',
        container: '1536px',
      },
      borderRadius: {
        s: '12px',
        m: '16px',
        card: '20px',
      },
      boxShadow: {
        card: '0 12px 12px 0 rgba(26, 26, 26, 0.04)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2 : Commit**

```bash
git add tailwind.config.mjs
git commit -m "feat: tokens tailwind LM (couleurs, polices, spacing)"
```

---

### Task 6 : Self-host les polices

**Files :**
- Copy : `lm/public/fonts/*` vers `lm-presentation/public/fonts/`
- Create : `lm-presentation/src/styles/fonts.css`

- [ ] **Step 1 : Copier les polices depuis `lm/`**

```bash
mkdir -p "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/fonts"
cp "C:/Users/weasy/OneDrive/Documents/GitHub/lm/public/fonts/"*.woff2 "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/fonts/"
ls "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/fonts/"
```

Expected : les fichiers `.woff2` de Hanken Grotesk + Space Grotesk présents.

- [ ] **Step 2 : Créer `src/styles/fonts.css`**

Inspecter d'abord les noms exacts de fichiers présents dans `public/fonts/`, puis adapter les `@font-face` :

```css
/* Hanken Grotesk */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/HankenGrotesk-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/HankenGrotesk-Medium.woff2') format('woff2');
}
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/HankenGrotesk-Bold.woff2') format('woff2');
}

/* Space Grotesk */
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/SpaceGrotesk-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/SpaceGrotesk-Medium.woff2') format('woff2');
}
```

Si les noms de fichiers diffèrent dans `public/fonts/`, ajuster les chemins `src:` en conséquence. Copier également la police décorative Qwitcher Grypen si elle est utilisée dans `lm/`.

- [ ] **Step 3 : Commit**

```bash
git add public/fonts/ src/styles/fonts.css
git commit -m "feat: self-host polices Hanken Grotesk + Space Grotesk"
```

---

### Task 7 : Créer `src/styles/global.css`

**Files :**
- Create : `lm-presentation/src/styles/global.css`

- [ ] **Step 1 : Écrire `global.css`**

```css
@import 'tailwindcss';
@import './fonts.css';

@layer base {
  :root {
    /* Tokens fluides typo (calque sur lm/) */
    --text-xs: 1.2rem;
    --text-sm: 1.4rem;
    --text-base: 1.6rem;
    --text-md: 1.8rem;
    --text-lg: 2rem;
    --text-xl: 2.4rem;
    --text-2xl: 2.8rem;
    --text-3xl: clamp(2.6rem, 2.33rem + 0.68vw, 3.2rem);
    --text-4xl: clamp(2.8rem, 2.62rem + 0.45vw, 3.2rem);
    --text-5xl: clamp(3.6rem, 2.51rem + 2.73vw, 6rem);

    --color-text: #6B6F84;
  }

  html {
    font-size: 62.5%;
  }

  body {
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: var(--text-md);
    line-height: 1.6;
    color: var(--color-text);
    background: #FFFFFF;
  }

  h1, h2, h3, h4 {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 700;
    color: #191919;
    line-height: 1.2;
  }
}

/* Underline gold rotatif (signature LM, hors @layer pour battre Tailwind utility) */
.underline {
  position: relative;
  display: inline;
  text-decoration-line: none !important;
}
.underline::after {
  content: '';
  display: block;
  position: absolute;
  top: -5px;
  left: -5px;
  width: 100%;
  height: 100%;
  border-bottom: 10px solid #FFD838;
  transform: rotate(-3deg);
  pointer-events: none;
  background-color: transparent;
  z-index: -1;
}
@media (max-width: 767px) {
  .underline::after {
    border-bottom-width: 6px;
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/styles/global.css
git commit -m "feat: global.css avec tokens typo et signature underline gold"
```

---

### Task 8 : Créer `src/styles/slides.css` (theme Reveal LM)

**Files :**
- Create : `lm-presentation/src/styles/slides.css`

- [ ] **Step 1 : Écrire le theme Reveal LM**

```css
/* Theme LM pour Reveal.js : layout de Reveal + override visuels LM */
@import 'reveal.js/dist/reveal.css';
@import './global.css';

.reveal {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 28px;
  background: #FFFFFF;
  color: #6B6F84;
}

.reveal .slides {
  text-align: left;
}

.reveal section {
  padding: 80px 96px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.reveal h1, .reveal h2 {
  font-weight: 700;
  color: #191919;
  margin: 0;
  text-align: center;
}

.reveal h2 {
  font-size: 56px;
  margin-bottom: 8px;
}

.reveal h2 + .slide-subtitle {
  font-size: 24px;
  color: #6B6F84;
  text-align: center;
  margin-bottom: 8px;
}

.reveal .slide-divider {
  display: block;
  width: 80px;
  height: 3px;
  background: #FFD838;
  margin: 0 auto 48px;
}

.reveal .deck-pagenum {
  position: absolute;
  top: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #191919;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
}

/* Footer du deck (logo, titre court, slide n/total) inséré par Deck.astro */
.deck-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #191919;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  font-size: 14px;
  z-index: 10;
}

.deck-footer .deck-brand {
  font-weight: 700;
}

/* Mode lecture : reset Reveal, scroll vertical */
.deck-reading {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 32px;
}
.deck-reading section {
  display: block;
  margin-bottom: 80px;
  border-bottom: 1px solid rgba(25, 25, 25, 0.08);
  padding-bottom: 64px;
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/styles/slides.css
git commit -m "feat: theme LM pour reveal.js (slides.css)"
```

---

## Phase 3 : Content collection

### Task 9 : Définir le schema Zod de la collection `presentations`

**Files :**
- Create : `lm-presentation/src/content.config.ts`
- Create : `lm-presentation/src/content/presentations/.gitkeep`

- [ ] **Step 1 : Créer le schema**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const presentations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/presentations' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    short: z.string().optional(),
    date: z.coerce.date(),
    type: z.enum(['cours', 'commercial', 'workshop', 'evenement']),
    unlisted: z.boolean().default(false),
    cover: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { presentations };
```

- [ ] **Step 2 : Créer le placeholder pour la collection**

```bash
mkdir -p "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/content/presentations"
touch "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/content/presentations/.gitkeep"
```

- [ ] **Step 3 : Vérifier avec `astro check`**

```bash
npx astro check
```

Expected : 0 errors, 0 warnings (la collection est vide pour l'instant, c'est OK).

- [ ] **Step 4 : Commit**

```bash
git add src/content.config.ts src/content/presentations/.gitkeep
git commit -m "feat: schema zod de la collection presentations"
```

---

## Phase 4 : Layouts

### Task 10 : Créer `src/layouts/Site.astro` (layout du site)

**Files :**
- Create : `lm-presentation/src/layouts/Site.astro`

- [ ] **Step 1 : Écrire le layout du site**

```astro
---
// src/layouts/Site.astro
import '@/styles/global.css';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description, ogImage } = Astro.props;
const fullTitle = title === 'Lausanne Marketing : Présentations'
  ? title
  : `${title} : Lausanne Marketing`;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={fullTitle} />
    {description && <meta property="og:description" content={description} />}
    <meta property="og:url" content={canonical} />
    {ogImage && <meta property="og:image" content={new URL(ogImage, Astro.site).toString()} />}
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <main id="main-content">
      <slot />
    </main>
    <footer class="site-footer">
      <p>
        Fait avec passion par
        <a href="https://lausanne.marketing" target="_blank" rel="noopener">Lausanne Marketing</a>
      </p>
    </footer>
    <style>
      .site-footer {
        padding: 32px;
        text-align: center;
        font-size: 14px;
        opacity: 0.7;
      }
      .site-footer a {
        color: #191919;
      }
    </style>
  </body>
</html>
```

- [ ] **Step 2 : Commit**

```bash
git add src/layouts/Site.astro
git commit -m "feat: layout Site (head SEO, footer LM)"
```

---

### Task 11 : Créer `src/layouts/Deck.astro` (mode présentation, init Reveal)

**Files :**
- Create : `lm-presentation/src/layouts/Deck.astro`

- [ ] **Step 1 : Écrire le layout Deck**

```astro
---
// src/layouts/Deck.astro
import '@/styles/slides.css';

interface Props {
  title: string;
  subtitle?: string;
  short?: string;
  description?: string;
  cover?: string;
}

const { title, subtitle, short, description, cover } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} : Lausanne Marketing</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    {cover && <meta property="og:image" content={new URL(cover, Astro.site).toString()} />}
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="fr_FR" />
  </head>
  <body>
    <a class="mode-toggle" href={`${Astro.url.pathname}/lecture`} title="Mode lecture">Lecture</a>
    <div class="reveal">
      <div class="slides">
        <slot />
      </div>
    </div>
    <footer class="deck-footer">
      <span class="deck-brand">Lausanne Marketing</span>
      <span class="deck-title">{short ?? title}</span>
      <span class="deck-counter"><span class="reveal-current">1</span> / <span class="reveal-total">1</span></span>
    </footer>

    <style>
      .mode-toggle {
        position: fixed;
        top: 16px;
        right: 96px;
        z-index: 100;
        padding: 8px 16px;
        background: #FFD838;
        color: #191919;
        font-size: 14px;
        font-weight: 500;
        border-radius: 12px;
        text-decoration: none;
      }
      .mode-toggle:hover {
        background: #FEE487;
      }
    </style>

    <script>
      import Reveal from 'reveal.js';

      const deck = new Reveal({
        hash: true,
        slideNumber: false,
        transition: 'fade',
        controls: true,
        progress: true,
        center: false,
        width: 1920,
        height: 1080,
        margin: 0,
      });

      deck.initialize().then(() => {
        const total = deck.getTotalSlides();
        const totalEl = document.querySelector('.reveal-total');
        if (totalEl) totalEl.textContent = String(total);

        deck.on('slidechanged', (event) => {
          const current = deck.getSlidePastCount() + 1;
          const currentEl = document.querySelector('.reveal-current');
          if (currentEl) currentEl.textContent = String(current);
        });
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2 : Commit**

```bash
git add src/layouts/Deck.astro
git commit -m "feat: layout Deck (init reveal.js, footer slide n/total)"
```

---

### Task 12 : Créer `src/layouts/DeckReading.astro` (mode lecture, scroll)

**Files :**
- Create : `lm-presentation/src/layouts/DeckReading.astro`

- [ ] **Step 1 : Écrire le layout lecture**

```astro
---
// src/layouts/DeckReading.astro
import '@/styles/slides.css';

interface Props {
  title: string;
  subtitle?: string;
  description?: string;
  presentationPath: string;
}

const { title, subtitle, description, presentationPath } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} : lecture : Lausanne Marketing</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={canonical} />
  </head>
  <body class="deck-reading-body">
    <a class="mode-toggle" href={presentationPath} title="Mode présentation">Présentation</a>
    <header class="deck-reading-header">
      <h1>{title}</h1>
      {subtitle && <p class="deck-reading-subtitle">{subtitle}</p>}
    </header>
    <div class="deck-reading">
      <slot />
    </div>
    <footer class="site-footer">
      <p>
        Fait avec passion par
        <a href="https://lausanne.marketing" target="_blank" rel="noopener">Lausanne Marketing</a>
      </p>
    </footer>

    <style>
      .deck-reading-body {
        background: #FFFFFF;
        color: #6B6F84;
      }
      .mode-toggle {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100;
        padding: 8px 16px;
        background: #FFD838;
        color: #191919;
        font-size: 14px;
        font-weight: 500;
        border-radius: 12px;
        text-decoration: none;
      }
      .deck-reading-header {
        max-width: 1280px;
        margin: 0 auto;
        padding: 64px 32px 32px;
        text-align: center;
      }
      .deck-reading-header h1 {
        font-size: clamp(3.6rem, 2.51rem + 2.73vw, 6rem);
        margin: 0 0 8px;
      }
      .deck-reading-subtitle {
        font-size: 20px;
        color: #6B6F84;
      }
      .site-footer {
        padding: 32px;
        text-align: center;
        font-size: 14px;
        opacity: 0.7;
      }
    </style>
  </body>
</html>
```

- [ ] **Step 2 : Commit**

```bash
git add src/layouts/DeckReading.astro
git commit -m "feat: layout DeckReading (mode scroll vertical)"
```

---

## Phase 5 : Composants slide essentiels (kit v1)

### Task 13 : Créer `SlideTitle.astro` (helper transversal)

**Files :**
- Create : `lm-presentation/src/components/SlideTitle.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/SlideTitle.astro
interface Props {
  title: string;
  subtitle?: string;
  highlight?: string;
}
const { title, subtitle, highlight } = Astro.props;

function renderHighlight(text: string | undefined, mot: string | undefined) {
  if (!text || !mot) return text;
  const idx = text.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + mot.length);
  const after = text.slice(idx + mot.length);
  return { before, match, after };
}

const subtitleParts = renderHighlight(subtitle, highlight);
---
<div class="slide-title">
  <h2>{title}</h2>
  {subtitle && (
    typeof subtitleParts === 'string'
      ? <p class="slide-subtitle">{subtitleParts}</p>
      : <p class="slide-subtitle">
          {subtitleParts.before}<span class="underline">{subtitleParts.match}</span>{subtitleParts.after}
        </p>
  )}
  <span class="slide-divider"></span>
</div>

<style>
  .slide-title {
    text-align: center;
    margin-bottom: 32px;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/SlideTitle.astro
git commit -m "feat: composant SlideTitle avec highlight underline gold"
```

---

### Task 14 : Créer `slides/Cover.astro`

**Files :**
- Create : `lm-presentation/src/components/slides/Cover.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Cover.astro
interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image: string;
  highlight?: string;
}
const { title, subtitle, eyebrow, image, highlight } = Astro.props;

function splitHighlight(text: string, mot?: string) {
  if (!mot) return null;
  const idx = text.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + mot.length),
    after: text.slice(idx + mot.length),
  };
}

const titleParts = splitHighlight(title, highlight);
---
<section class="cover" data-layout="cover">
  <div class="cover__media">
    <img src={image} alt="" loading="eager" decoding="async" />
  </div>
  <div class="cover__text">
    {eyebrow && <p class="cover__eyebrow">{eyebrow}</p>}
    <h1>
      {titleParts
        ? <>{titleParts.before}<span class="underline">{titleParts.match}</span>{titleParts.after}</>
        : title}
    </h1>
    {subtitle && <p class="cover__subtitle">{subtitle}</p>}
  </div>
</section>

<style>
  .cover {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding: 0 !important;
    display: grid !important;
    grid-template-columns: 60% 40%;
  }
  .cover__media {
    position: relative;
    overflow: hidden;
  }
  .cover__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cover__text {
    padding: 80px 64px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: #FFFFFF;
  }
  .cover__eyebrow {
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6B6F84;
    margin: 0 0 16px;
  }
  .cover h1 {
    font-size: 64px;
    line-height: 1.1;
    color: #191919;
    margin: 0 0 16px;
    text-align: left;
  }
  .cover__subtitle {
    font-size: 24px;
    color: #6B6F84;
    margin: 0;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Cover.astro
git commit -m "feat: layout slide Cover (image gauche, titre droit)"
```

---

### Task 15 : Créer `slides/Title.astro` (transition de chapitre)

**Files :**
- Create : `lm-presentation/src/components/slides/Title.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Title.astro
interface Props {
  title: string;
  subtitle?: string;
  chapter?: string;
  highlight?: string;
}
const { title, subtitle, chapter, highlight } = Astro.props;

function splitHighlight(text: string, mot?: string) {
  if (!mot) return null;
  const idx = text.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + mot.length),
    after: text.slice(idx + mot.length),
  };
}

const titleParts = splitHighlight(title, highlight);
---
<section class="slide-title-chapter" data-layout="title">
  <div class="title-chapter__inner">
    {chapter && <p class="title-chapter__chapter">{chapter}</p>}
    <h1>
      {titleParts
        ? <>{titleParts.before}<span class="underline">{titleParts.match}</span>{titleParts.after}</>
        : title}
    </h1>
    {subtitle && <p class="title-chapter__subtitle">{subtitle}</p>}
  </div>
</section>

<style>
  .slide-title-chapter {
    align-items: center !important;
    justify-content: center !important;
    text-align: center;
    background: #FFFFFF;
  }
  .title-chapter__inner {
    max-width: 1280px;
  }
  .title-chapter__chapter {
    font-size: 24px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #FFD838;
    margin: 0 0 24px;
    font-weight: 500;
  }
  .slide-title-chapter h1 {
    font-size: 96px;
    line-height: 1.1;
    color: #191919;
    margin: 0 0 24px;
  }
  .title-chapter__subtitle {
    font-size: 28px;
    color: #6B6F84;
    margin: 0;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Title.astro
git commit -m "feat: layout slide Title (transition chapitre)"
```

---

### Task 16 : Créer `slides/Statement.astro`

**Files :**
- Create : `lm-presentation/src/components/slides/Statement.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Statement.astro
interface Props {
  highlight?: string;
  image?: string;
  title?: string;
  subtitle?: string;
}
const { highlight, image, title, subtitle } = Astro.props;
---
<section class="statement" data-layout="statement">
  {(title || subtitle) && (
    <div class="statement__title">
      {title && <h2>{title}</h2>}
      {subtitle && <p class="slide-subtitle">{subtitle}</p>}
      <span class="slide-divider"></span>
    </div>
  )}
  <div class="statement__body">
    <p class="statement__text">
      <slot />
    </p>
    {image && (
      <div class="statement__image">
        <img src={image} alt="" loading="lazy" decoding="async" />
      </div>
    )}
  </div>
</section>

<style>
  .statement {
    justify-content: center !important;
  }
  .statement__title {
    text-align: center;
    margin-bottom: 48px;
  }
  .statement__body {
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;
  }
  .statement__text {
    font-size: 36px;
    line-height: 1.4;
    color: #191919;
    margin: 0 0 48px;
  }
  .statement__image {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 12px 0 rgba(26, 26, 26, 0.04);
    max-height: 400px;
  }
  .statement__image img {
    width: 100%;
    height: 100%;
    max-height: 400px;
    object-fit: cover;
  }
</style>
```

Note : le `highlight` n'est pas appliqué automatiquement au slot (le slot peut contenir du HTML libre). Pour souligner un mot, l'auteur écrit `<span class="underline">mot</span>` directement dans le slot du MDX.

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Statement.astro
git commit -m "feat: layout slide Statement (phrase forte centree, image deco)"
```

---

### Task 17 : Créer `slides/TableSlide.astro`

**Files :**
- Create : `lm-presentation/src/components/slides/TableSlide.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/TableSlide.astro
import SlideTitle from '@/components/SlideTitle.astro';

interface Props {
  title: string;
  subtitle?: string;
  highlight?: string;
  intro?: string;
  headers: string[];
  rows: string[][];
  leftLabel?: string;
}
const { title, subtitle, highlight, intro, headers, rows, leftLabel } = Astro.props;
---
<section class="table-slide" data-layout="table">
  <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />
  {intro && <p class="table-slide__intro">{intro}</p>}
  <div class="table-slide__wrapper">
    {leftLabel && <span class="table-slide__left-label">{leftLabel}</span>}
    <table class="lm-table">
      <thead>
        <tr>
          {headers.map((h) => <th>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr>
            {row.map((cell) => <td>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

<style>
  .table-slide {
    justify-content: flex-start !important;
  }
  .table-slide__intro {
    font-size: 22px;
    color: #6B6F84;
    text-align: center;
    margin: 0 auto 32px;
    max-width: 1400px;
    line-height: 1.5;
  }
  .table-slide__wrapper {
    display: flex;
    align-items: center;
    gap: 24px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }
  .table-slide__left-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 18px;
    color: #6B6F84;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .lm-table {
    flex: 1;
    border-collapse: collapse;
    font-size: 22px;
    color: #191919;
  }
  .lm-table thead th {
    background: #191919;
    color: #FFFFFF;
    text-align: left;
    padding: 16px 24px;
    font-weight: 500;
  }
  .lm-table tbody tr:nth-child(odd) {
    background: rgba(25, 25, 25, 0.04);
  }
  .lm-table tbody tr:nth-child(even) {
    background: rgba(25, 25, 25, 0.02);
  }
  .lm-table tbody td {
    padding: 14px 24px;
    color: #6B6F84;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/TableSlide.astro
git commit -m "feat: layout slide TableSlide (header navy, rows alternees)"
```

---

### Task 18 : Créer `slides/Closing.astro`

**Files :**
- Create : `lm-presentation/src/components/slides/Closing.astro`

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Closing.astro
interface Props {
  variant?: 'qa' | 'thanks' | 'contact';
  title?: string;
  subtitle?: string;
  email?: string;
  url?: string;
}
const {
  variant = 'qa',
  title = variant === 'qa' ? 'Questions & Réponses' : variant === 'thanks' ? 'Merci' : 'Contact',
  subtitle = variant === 'qa' ? 'Échanges et discussions' : variant === 'thanks' ? 'Pour votre attention' : 'Pour aller plus loin',
  email,
  url,
} = Astro.props;
---
<section class="closing" data-layout={`closing-${variant}`}>
  <div class="closing__inner">
    <h1>{title}</h1>
    <p class="closing__subtitle">{subtitle}</p>
    {variant === 'contact' && (email || url) && (
      <ul class="closing__contact">
        {email && <li><a href={`mailto:${email}`}>{email}</a></li>}
        {url && <li><a href={url} target="_blank" rel="noopener">{url}</a></li>}
      </ul>
    )}
  </div>
</section>

<style>
  .closing {
    align-items: center !important;
    justify-content: center !important;
    text-align: center;
    background: #191919;
    color: #FFFFFF;
  }
  .closing h1 {
    font-size: 96px;
    color: #FFFFFF !important;
    margin: 0 0 24px;
  }
  .closing__subtitle {
    font-size: 28px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 32px;
  }
  .closing__contact {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 24px;
  }
  .closing__contact li {
    margin-bottom: 12px;
  }
  .closing__contact a {
    color: #FFD838;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Closing.astro
git commit -m "feat: layout slide Closing (qa, thanks, contact)"
```

---

## Phase 6 : Routes

### Task 19 : Créer la landing `src/pages/index.astro`

**Files :**
- Create : `lm-presentation/src/pages/index.astro`

- [ ] **Step 1 : Écrire la landing**

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import Site from '@/layouts/Site.astro';

const all = await getCollection('presentations');
const presentations = all
  .filter((p) => !p.data.unlisted)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const typeLabels: Record<string, string> = {
  cours: 'Cours',
  commercial: 'Présentation',
  workshop: 'Workshop',
  evenement: 'Événement',
};
---
<Site title="Lausanne Marketing : Présentations" description="Cours, présentations commerciales, workshops et événements de Lausanne Marketing.">
  <header class="hero">
    <h1>Présentations <span class="underline">Lausanne Marketing</span></h1>
    <p>Cours de formation continue, présentations commerciales, workshops et événements.</p>
  </header>
  <section class="presentations">
    {presentations.length === 0 && (
      <p class="empty">Aucune présentation publique pour l'instant.</p>
    )}
    <ul class="presentation-grid">
      {presentations.map((p) => (
        <li>
          <a href={`/p/${p.id.replace('.mdx', '')}`} class="presentation-card">
            <span class="presentation-card__type">{typeLabels[p.data.type] ?? p.data.type}</span>
            <h2>{p.data.title}</h2>
            {p.data.subtitle && <p class="presentation-card__subtitle">{p.data.subtitle}</p>}
            <time datetime={p.data.date.toISOString()}>
              {p.data.date.toLocaleDateString('fr-CH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </a>
        </li>
      ))}
    </ul>
  </section>

  <style>
    .hero {
      max-width: 1280px;
      margin: 0 auto;
      padding: 96px 32px 48px;
      text-align: center;
    }
    .hero h1 {
      font-size: clamp(3.6rem, 2.51rem + 2.73vw, 6rem);
      margin: 0 0 16px;
    }
    .hero p {
      font-size: 20px;
      color: #6B6F84;
      max-width: 720px;
      margin: 0 auto;
    }
    .presentations {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px;
    }
    .empty {
      text-align: center;
      color: #6B6F84;
      padding: 64px 0;
    }
    .presentation-grid {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .presentation-card {
      display: block;
      padding: 32px;
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 0 12px 12px 0 rgba(26, 26, 26, 0.04);
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s;
    }
    .presentation-card:hover {
      transform: translateY(-4px);
    }
    .presentation-card__type {
      display: inline-block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6B6F84;
      margin-bottom: 12px;
    }
    .presentation-card h2 {
      font-size: 24px;
      margin: 0 0 8px;
    }
    .presentation-card__subtitle {
      font-size: 16px;
      color: #6B6F84;
      margin: 0 0 16px;
    }
    .presentation-card time {
      font-size: 14px;
      color: #6B6F84;
    }
  </style>
</Site>
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: landing avec grille des presentations publiques"
```

---

### Task 20 : Créer la route mode présentation `src/pages/p/[slug].astro`

**Files :**
- Create : `lm-presentation/src/pages/p/[slug].astro`

- [ ] **Step 1 : Écrire la route**

```astro
---
// src/pages/p/[slug].astro
import { getCollection, render } from 'astro:content';
import Deck from '@/layouts/Deck.astro';

export async function getStaticPaths() {
  const decks = await getCollection('presentations');
  return decks.map((d) => ({
    params: { slug: d.id.replace('.mdx', '') },
    props: { entry: d },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<Deck
  title={entry.data.title}
  subtitle={entry.data.subtitle}
  short={entry.data.short}
  description={entry.data.description}
  cover={entry.data.cover}
>
  <Content />
</Deck>
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/p/[slug].astro
git commit -m "feat: route /p/[slug] mode presentation"
```

---

### Task 21 : Créer la route mode lecture `src/pages/p/[slug]/lecture.astro`

**Files :**
- Create : `lm-presentation/src/pages/p/[slug]/lecture.astro`

- [ ] **Step 1 : Écrire la route**

```astro
---
// src/pages/p/[slug]/lecture.astro
import { getCollection, render } from 'astro:content';
import DeckReading from '@/layouts/DeckReading.astro';

export async function getStaticPaths() {
  const decks = await getCollection('presentations');
  return decks.map((d) => ({
    params: { slug: d.id.replace('.mdx', '') },
    props: { entry: d },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const slug = entry.id.replace('.mdx', '');
---
<DeckReading
  title={entry.data.title}
  subtitle={entry.data.subtitle}
  description={entry.data.description}
  presentationPath={`/p/${slug}`}
>
  <Content />
</DeckReading>
```

Note : la route partage les mêmes composants slide MDX que le mode présentation. Les `<section>` se compilent normalement, ils sont juste affichés en flux vertical au lieu d'être pris en main par Reveal.

- [ ] **Step 2 : Commit**

```bash
git add src/pages/p/[slug]/lecture.astro
git commit -m "feat: route /p/[slug]/lecture mode scroll"
```

---

### Task 22 : Créer la 404

**Files :**
- Create : `lm-presentation/src/pages/404.astro`

- [ ] **Step 1 : Écrire la 404**

```astro
---
// src/pages/404.astro
import Site from '@/layouts/Site.astro';
---
<Site title="Page introuvable">
  <div class="not-found">
    <h1>Page <span class="underline">introuvable</span></h1>
    <p>Cette présentation n'existe pas (ou n'est pas publique).</p>
    <a href="/" class="back-home">Retour à la liste</a>
  </div>

  <style>
    .not-found {
      max-width: 720px;
      margin: 0 auto;
      padding: 128px 32px;
      text-align: center;
    }
    .not-found h1 {
      font-size: clamp(3.6rem, 2.51rem + 2.73vw, 6rem);
      margin: 0 0 24px;
    }
    .not-found p {
      font-size: 20px;
      color: #6B6F84;
      margin: 0 0 32px;
    }
    .back-home {
      display: inline-block;
      padding: 12px 24px;
      background: #FFD838;
      color: #191919;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</Site>
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: page 404 avec lien retour landing"
```

---

## Phase 7 : Sample deck CRM, Data & automation (minimal)

### Task 23 : Créer le deck minimal MDX

**Files :**
- Create : `lm-presentation/src/content/presentations/crm-data-automation.mdx`
- Create : `lm-presentation/public/assets/crm-data-automation/.gitkeep`

- [ ] **Step 1 : Créer le dossier d'assets**

```bash
mkdir -p "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/assets/crm-data-automation"
touch "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/assets/crm-data-automation/.gitkeep"
```

Pour le smoke test, on utilise une URL d'image générique (Unsplash via image direct). En production, Thomas remplacera par une vraie image cover dans `public/assets/crm-data-automation/cover.jpg`.

- [ ] **Step 2 : Écrire le MDX minimal**

```mdx
---
title: "CRM, Data & automation"
subtitle: "Formation continue HEC Lausanne"
short: "CRM, Data, Automation"
date: 2026-06-25
type: cours
unlisted: false
description: "Formation Executive Education sur la collecte de données, le choix d'un CRM et l'automatisation des parcours client avec IA et low-code."
---

import Cover from '@/components/slides/Cover.astro';
import Title from '@/components/slides/Title.astro';
import Statement from '@/components/slides/Statement.astro';
import TableSlide from '@/components/slides/TableSlide.astro';
import Closing from '@/components/slides/Closing.astro';

<Cover
  title="CRM, Data & automation"
  subtitle="Formation continue HEC Lausanne"
  eyebrow="Juin 2026"
  image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop"
/>

<Title
  chapter="Jour 1"
  title="Data"
  subtitle="Collecter, structurer, intégrer la donnée client"
/>

<Statement>
La donnée est la nouvelle <span class="underline">matière première</span> du marketing.
</Statement>

<TableSlide
  title="Stack pour petite structure"
  subtitle="Moins de 50 CHF par mois"
  highlight="50 CHF"
  intro="Les outils ne nécessitent pas un investissement élevé. Voici une proposition de stack digital pour les petites structures sans budget."
  headers={['Nom', 'Fonction', 'Prix']}
  rows={[
    ['Brevo', 'CRM, Landing page, Emailing, Calendly like', '13 CHF'],
    ['Airtable', 'Base de données', 'Gratuit'],
    ['Zapier', "Outil d'automatisation", 'Gratuit'],
    ['Infomaniak', 'Hébergement, nom de domaine', '11 CHF'],
    ['WordPress', 'Site web', 'Gratuit'],
    ['Bexio', 'Comptabilité et finance', '25 CHF'],
    ['Canva', 'Outil de design', 'Gratuit'],
    ['ChatGPT', 'IA générative', 'Gratuit'],
  ]}
/>

<Closing variant="qa" />
```

- [ ] **Step 3 : Commit**

```bash
git add src/content/presentations/crm-data-automation.mdx public/assets/crm-data-automation/.gitkeep
git commit -m "feat: deck minimal CRM Data Automation (5 slides smoke test)"
```

---

## Phase 8 : Vérification locale

### Task 24 : Vérifier le mode présentation en dev

- [ ] **Step 1 : Lancer le dev server**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run dev
```

Expected : `Local: http://localhost:4321/`.

- [ ] **Step 2 : Vérifier la landing**

Ouvrir http://localhost:4321/ dans le navigateur.

Expected :
- Titre "Présentations Lausanne Marketing" avec "Lausanne Marketing" souligné gold
- Une carte pour "CRM, Data & automation"
- Footer "Fait avec passion par Lausanne Marketing"

- [ ] **Step 3 : Vérifier le mode présentation**

Cliquer sur la carte (ou ouvrir http://localhost:4321/p/crm-data-automation).

Expected :
- Slide 1 : Cover avec image Unsplash à gauche, titre à droite
- Espace ou flèche droite : transition vers slide 2 (Title "Jour 1 - Data")
- Slide 3 : Statement avec phrase "matière première" soulignée
- Slide 4 : TableSlide avec stack outils
- Slide 5 : Closing Q&A
- Footer fixed bas : "Lausanne Marketing | CRM, Data, Automation | 1 / 5"
- Bouton "Lecture" haut-droit
- Touche `F` : passe en fullscreen vrai
- Touche `Esc` : vue d'ensemble (overview Reveal)
- Touche `S` : ouvre la vue présentateur (vide en notes pour le smoke test, normal)

- [ ] **Step 4 : Vérifier les deeplinks**

Ouvrir http://localhost:4321/p/crm-data-automation#/2.

Expected : arrive directement sur la slide 3 (Statement). Reveal utilise des indices 0-based dans le hash.

- [ ] **Step 5 : Pas de commit**

Pas de modification, juste vérification. Si quelque chose ne marche pas, fix et commit.

---

### Task 25 : Vérifier le mode lecture

- [ ] **Step 1 : Cliquer sur "Lecture"**

Depuis le mode présentation, cliquer sur le bouton "Lecture" haut-droit.

Expected : redirige vers `/p/crm-data-automation/lecture`.

- [ ] **Step 2 : Vérifier le scroll vertical**

Expected :
- Header avec "CRM, Data & automation" + sous-titre
- Toutes les 5 slides empilées verticalement, lisibles
- Bouton "Présentation" haut-droit pour revenir
- Footer LM

- [ ] **Step 3 : Pas de commit**

---

### Task 26 : Vérifier le build production

- [ ] **Step 1 : Stopper le dev server (Ctrl+C)**

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected :
- 0 errors
- `dist/` créé avec :
  - `dist/index.html`
  - `dist/p/crm-data-automation/index.html`
  - `dist/p/crm-data-automation/lecture/index.html`
  - `dist/404.html`
  - `dist/sitemap-index.xml`
  - `dist/_pagefind/` (index de recherche)

- [ ] **Step 3 : Preview**

```bash
npm run preview
```

Ouvrir l'URL affichée et refaire les vérifs Tasks 24 et 25 pour confirmer que le build statique fonctionne.

- [ ] **Step 4 : Commit éventuel**

Si modifications nécessaires pour faire passer le build, commit. Sinon rien à commit.

---

## Phase 9 : Déploiement Cloudflare Pages

### Task 27 : Créer `wrangler.toml`

**Files :**
- Create : `lm-presentation/wrangler.toml`

- [ ] **Step 1 : Écrire la config**

```toml
name = "lm-presentation"
pages_build_output_dir = "dist"
compatibility_date = "2026-05-07"
```

- [ ] **Step 2 : Commit**

```bash
git add wrangler.toml
git commit -m "feat: wrangler.toml pour cloudflare pages"
```

---

### Task 28 : Pousser sur GitHub

- [ ] **Step 1 : Créer le repo sur GitHub**

Action manuelle dans le navigateur :
1. Aller sur https://github.com/new
2. Owner : `lm-stack` (org principale, voir CLAUDE.md du workspace)
3. Repository name : `lm-presentation`
4. Description : "Site de présentations Lausanne Marketing : slides.lausanne.marketing"
5. Visibility : Public (ou Private si tu préfères pour les commerciaux ; voir Task 30 pour CF Pages avec repo privé)
6. **Ne pas** initialiser avec README, .gitignore ou license (déjà créés en local)
7. Click "Create repository"

- [ ] **Step 2 : Add remote et push**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git remote add origin https://github.com/lm-stack/lm-presentation.git
git branch -M main
git push -u origin main
```

Expected : push réussi, premier déploiement automatique CF Pages déclenché si déjà configuré (sinon Task 29).

---

### Task 29 : Configurer Cloudflare Pages

Action manuelle dans le dashboard Cloudflare.

- [ ] **Step 1 : Créer le projet Pages**

1. Aller sur https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Sélectionner le repo `lm-stack/lm-presentation`
3. Production branch : `main`

- [ ] **Step 2 : Configurer le build**

| Champ | Valeur |
|-------|--------|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` (variable d'environnement `NODE_VERSION=20`) |

- [ ] **Step 3 : Save and Deploy**

Cloudflare lance le premier build. Attendre que ça passe au vert.

URL de preview : `https://lm-presentation.pages.dev`.

- [ ] **Step 4 : Vérifier la preview**

Ouvrir `https://lm-presentation.pages.dev/` puis `https://lm-presentation.pages.dev/p/crm-data-automation`.

Expected : tout fonctionne comme en local.

---

### Task 30 : Configurer le custom domain `slides.lausanne.marketing`

Action manuelle dans le dashboard Cloudflare.

- [ ] **Step 1 : Ajouter le custom domain**

1. Dans le projet `lm-presentation` Pages → Custom domains → Set up a custom domain
2. Entrer `slides.lausanne.marketing`
3. Cloudflare reconnaît que la zone DNS `lausanne.marketing` est déjà gérée par CF
4. Confirmer la création du CNAME automatique

- [ ] **Step 2 : Vérifier le DNS**

Vérifier qu'un enregistrement CNAME a été créé :

| Type | Nom | Valeur | Proxy |
|------|-----|--------|-------|
| CNAME | `slides` | `lm-presentation.pages.dev` | Proxied |

- [ ] **Step 3 : Tester**

Ouvrir `https://slides.lausanne.marketing/` et `https://slides.lausanne.marketing/p/crm-data-automation`.

Expected :
- Le certificat HTTPS est valide (peut prendre quelques minutes pour Cloudflare de provisionner).
- Tout fonctionne comme sur l'URL pages.dev.

- [ ] **Step 4 : Mettre à jour le CLAUDE.md global**

Ajouter une ligne dans `C:/Users/weasy/OneDrive/Documents/GitHub/.claude/CLAUDE.md` table des repositories :

```markdown
| `lm-presentation/` | Site de présentations LM (cours, commercial, workshops) - slides.lausanne.marketing |
```

À la fois en local et faire un `sync` workspace pour propager dans claude-config.

---

## Récap : ce qu'on a livré en v1

À la fin de ce plan :

- Repo `lm-presentation` initialisé, sur GitHub `lm-stack/lm-presentation`
- Site déployé à `https://slides.lausanne.marketing`
- Une présentation visible : `CRM, Data & automation` (5 slides factices, smoke test)
- 5 layouts de slide implémentés (Cover, Title, Statement, TableSlide, Closing) + helper SlideTitle
- Mode présentation Reveal.js fonctionnel (clavier, fullscreen, fragments, presenter view, deeplinks)
- Mode lecture en scroll vertical
- Charte LM appliquée (couleurs, polices, signature underline gold)
- Build statique sur CF Pages

## Hors scope v1, à traiter dans plan v2

- 7 layouts restants (NumberedCards, NumberedCardWithDetail, BigImage, Workshop, Calendar, Quote, Custom)
- 12 modules réutilisables extraits de `source/2025/`
- Contenu complet du deck CRM Data Auto (3 jours, ~50-80 slides)
- Polish design (animations, transitions, optimisations images)
- Pagefind UI sur la landing pour rechercher dans les présentations
- Cloudflare Access si besoin de slides confidentielles
