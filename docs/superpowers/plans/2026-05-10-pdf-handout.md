# PDF Handout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une modale au bouton "Télécharger" de `Deck.astro` proposant 3 layouts d'export PDF (1up paysage, 2up portrait, 3up + lignes vierges portrait), via un nouveau worker Cloudflare générique `lm-pdf` partagé entre `lm-offres` (refacto) et `lm-presentation` (nouvelle feature).

**Architecture:** Trois phases sequentielles. Phase A crée et déploie un worker `lm-pdf` autonome dans son propre repo. Phase B migre `lm-offres` vers ce nouveau worker et nettoie `lm-signer` (qui ne fait plus de PDF). Phase C ajoute la modale et les routes handout côté `lm-presentation`. Les phases A et B stabilisent la plomberie partagée avant que la phase C n'ajoute les nouvelles fonctionnalités UX.

**Tech Stack:**
- Worker `lm-pdf` : Cloudflare Workers, `@cloudflare/puppeteer`, binding Browser Rendering, Vitest pour tests unitaires des helpers de validation
- `lm-offres` : Astro 6, MDX, Cloudflare Pages (refacto mineure d'un seul fichier)
- `lm-presentation` : Astro 6, MDX, Reveal.js 5, `<dialog>` HTML natif, Cloudflare Pages

**Repos concernés (paths absolus):**
- `lm-pdf` : `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/` (nouveau)
- `lm-offres` : `C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres/`
- `lm-presentation` : `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/`

**Spec source:** `lm-presentation/docs/superpowers/specs/2026-05-10-pdf-handout-design.md`

---

## File Structure récapitulative

### Phase A — `lm-pdf/` (nouveau repo)

```
lm-pdf/
├── .claude/
│   └── CLAUDE.md
├── src/
│   ├── index.js                 # entry point (handler fetch + routing)
│   ├── validation.js            # helpers : parseMargin, validateUrl, validateFormat, sanitizeFilename
│   └── validation.test.js       # tests unitaires Vitest
├── package.json
├── wrangler.toml
├── vitest.config.js
├── README.md
└── .gitignore
```

### Phase B — `lm-offres/` (modifications)

```
src/layouts/OffreLayout.astro    # remplacer SIGNER_URL_PDF par PUBLIC_LM_PDF_URL + nouveaux query params
workers/lm-signer/src/index.js   # retirer handlePdfRequest + import puppeteer
workers/lm-signer/wrangler.toml  # retirer [browser] binding
workers/lm-signer/package.json   # retirer dep @cloudflare/puppeteer
```

### Phase C — `lm-presentation/` (nouveaux fichiers + modifications)

```
src/components/deck/PdfModal.astro              # NEW : modale 3 cards
src/layouts/Handout.astro                       # NEW : layout handout (sans Reveal)
src/pages/p/[slug]/handout/[mode].astro         # NEW : route dynamique handout
src/styles/handout.css                          # NEW : styles print spécifiques
src/styles/slides.css                           # MODIFY : styles modale (pattern .deck-menu)
src/layouts/Deck.astro                          # MODIFY : remplacer le handler downloadBtn
```

---

## Phase A — Worker `lm-pdf`

### Task A.1 : Initialiser le repo `lm-pdf`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/.gitignore`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/package.json`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/wrangler.toml`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/README.md`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/.claude/CLAUDE.md`

- [ ] **Step 1 : Créer le dossier et initialiser git**

```bash
mkdir -p C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf
cd C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf
git init
git config user.name "Thomas Rouaud"
git config user.email "hello@lausanne.marketing"
git config windows.appendAtomically false
```

Note Windows OneDrive : `windows.appendAtomically false` est obligatoire (cf. CLAUDE.md root) sinon les commits échouent avec "unable to append to '.git/logs/HEAD'".

- [ ] **Step 2 : Créer `.gitignore`**

```
node_modules/
.wrangler/
.dev.vars
.env
*.log
.DS_Store
```

- [ ] **Step 3 : Créer `package.json`**

```json
{
  "name": "lm-pdf",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.js",
  "description": "Worker Cloudflare générique pour générer des PDF vectoriels via Browser Rendering. Consommé par lm-offres et lm-presentation.",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@cloudflare/puppeteer": "^1.1.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "wrangler": "^4.90.0"
  }
}
```

- [ ] **Step 4 : Créer `wrangler.toml`**

```toml
#:schema node_modules/wrangler/config-schema.json
name = "lm-pdf"
main = "src/index.js"
compatibility_date = "2026-01-01"
# nodejs_compat necessaire pour @cloudflare/puppeteer (importe node:buffer).
compatibility_flags = ["nodejs_compat"]
workers_dev = true

# Binding natif Cloudflare Browser Rendering.
[browser]
binding = "BROWSER"

[vars]
ALLOWED_HOSTS = "offre.lausanne.marketing,slides.lausanne.marketing,lm-offres.pages.dev,lm-presentation.pages.dev"
```

- [ ] **Step 5 : Créer `README.md`**

````markdown
# lm-pdf

Worker Cloudflare générique pour générer des PDF vectoriels via le binding natif Browser Rendering.

## API

```
GET /api/pdf?url=<encoded-url>&format=A4&orientation=portrait&margin=0&filename=<slug>
```

| Param         | Default    | Notes                                              |
| ------------- | ---------- | -------------------------------------------------- |
| `url`         | requis     | Absolue HTTPS, host dans `ALLOWED_HOSTS`           |
| `format`      | `A4`       | A0-A6, Letter, Legal, Tabloid, Ledger              |
| `orientation` | `portrait` | `portrait` ou `landscape`                          |
| `margin`      | `0`        | Ex: `0`, `10mm`, `10mm 15mm 10mm 15mm`            |
| `filename`    | auto       | Sanitized `[a-z0-9-]{1,80}`. Default = pathname slugifié |

Retourne un `application/pdf` en attachment.

## Whitelist

Modifiable via `[vars] ALLOWED_HOSTS` dans `wrangler.toml`. CSV de hostnames.

## Déploiement

```bash
npx wrangler deploy
```

URL : `https://lm-pdf.<account>.workers.dev`.

## Tests

```bash
npm test
```

Tests unitaires sur les helpers de validation (Vitest). Le runtime CF (binding `BROWSER`) ne se teste qu'en deployé.

## Consommateurs

- `lm-offres` (`src/layouts/OffreLayout.astro`)
- `lm-presentation` (modale `Deck.astro`)
````

- [ ] **Step 6 : Créer `.claude/CLAUDE.md`**

```markdown
# CLAUDE.md - lm-pdf

## Contexte

Worker Cloudflare générique pour générer des PDF vectoriels via Browser Rendering. Aucune logique métier, aucune connaissance des sites consommateurs : `goto + page.pdf()`. Tout le styling print vit dans les sites consommateurs (via `@media print` natif).

## Stack

- Cloudflare Workers + binding `[browser]` (Browser Rendering)
- `@cloudflare/puppeteer` pour l'API
- Vitest pour les tests des helpers de validation
- `wrangler` pour deploy et dev local

## Règles

- **Ne jamais ajouter de logique site-spécifique** (sélecteurs CSS, headers, etc.). Si un site a besoin de styling print, il l'ajoute via `@media print` chez lui.
- **Maintenir la whitelist `ALLOWED_HOSTS`** dans `wrangler.toml` quand un nouveau site consommateur arrive.
- **Tests unitaires obligatoires** sur les helpers de validation (parseMargin, sanitizeFilename, etc.). Le binding CF ne se teste qu'en deployé via `curl`.

## Conventions

- Langue : français (commits, commentaires, docs)
- Pas d'em dashes ni en dashes dans les textes humains
- Encodage UTF-8 obligatoire
```

- [ ] **Step 7 : Installer les dépendances**

```bash
npm install
```

Expected : crée `node_modules/` et `package-lock.json`.

- [ ] **Step 8 : Premier commit**

```bash
git add .gitignore package.json package-lock.json wrangler.toml README.md .claude/CLAUDE.md
git commit -m "chore: init lm-pdf worker scaffold"
```

---

### Task A.2 : Helpers de validation (TDD)

Avant d'écrire le handler `fetch`, on teste les helpers de validation isolés. Tous les tests passent en pur Node (pas besoin du runtime CF).

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/vitest.config.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/src/validation.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/src/validation.test.js`

- [ ] **Step 1 : Créer `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
  },
});
```

- [ ] **Step 2 : Écrire les tests en premier (TDD red phase)**

Créer `src/validation.test.js` :

```js
import { describe, it, expect } from 'vitest';
import {
  validateFormat,
  validateOrientation,
  parseMargin,
  validateUrl,
  sanitizeFilename,
  pathnameToSlug,
} from './validation.js';

describe('validateFormat', () => {
  it('accepts A0 to A6', () => {
    for (const f of ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']) {
      expect(validateFormat(f)).toBe(f);
    }
  });
  it('accepts Letter, Legal, Tabloid, Ledger', () => {
    expect(validateFormat('Letter')).toBe('Letter');
    expect(validateFormat('Legal')).toBe('Legal');
    expect(validateFormat('Tabloid')).toBe('Tabloid');
    expect(validateFormat('Ledger')).toBe('Ledger');
  });
  it('returns A4 default when undefined', () => {
    expect(validateFormat(undefined)).toBe('A4');
  });
  it('throws on unknown format', () => {
    expect(() => validateFormat('A7')).toThrow(/format/);
    expect(() => validateFormat('foo')).toThrow(/format/);
  });
});

describe('validateOrientation', () => {
  it('accepts portrait and landscape', () => {
    expect(validateOrientation('portrait')).toBe('portrait');
    expect(validateOrientation('landscape')).toBe('landscape');
  });
  it('returns portrait default when undefined', () => {
    expect(validateOrientation(undefined)).toBe('portrait');
  });
  it('throws on unknown orientation', () => {
    expect(() => validateOrientation('diagonal')).toThrow(/orientation/);
  });
});

describe('parseMargin', () => {
  it('parses 0 as zero margins all sides', () => {
    expect(parseMargin('0')).toEqual({ top: '0', right: '0', bottom: '0', left: '0' });
  });
  it('parses single value with unit as all sides', () => {
    expect(parseMargin('10mm')).toEqual({ top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' });
  });
  it('parses 4 values as top/right/bottom/left', () => {
    expect(parseMargin('10mm 15mm 10mm 15mm')).toEqual({
      top: '10mm', right: '15mm', bottom: '10mm', left: '15mm',
    });
  });
  it('returns zero margins when undefined', () => {
    expect(parseMargin(undefined)).toEqual({ top: '0', right: '0', bottom: '0', left: '0' });
  });
  it('throws on invalid unit', () => {
    expect(() => parseMargin('10foo')).toThrow(/margin/);
  });
  it('throws on 2 or 3 values (not supported)', () => {
    expect(() => parseMargin('10mm 15mm')).toThrow(/margin/);
    expect(() => parseMargin('10mm 15mm 20mm')).toThrow(/margin/);
  });
});

describe('validateUrl', () => {
  const allowed = new Set(['offre.lausanne.marketing', 'slides.lausanne.marketing']);
  it('accepts whitelisted https url', () => {
    const u = validateUrl('https://offre.lausanne.marketing/abc/', allowed);
    expect(u.hostname).toBe('offre.lausanne.marketing');
  });
  it('rejects http url', () => {
    expect(() => validateUrl('http://offre.lausanne.marketing/', allowed)).toThrow(/https/);
  });
  it('rejects non-whitelisted host', () => {
    expect(() => validateUrl('https://evil.example.com/', allowed)).toThrow(/forbidden/);
  });
  it('rejects malformed url', () => {
    expect(() => validateUrl('not-a-url', allowed)).toThrow(/invalid/);
  });
  it('rejects empty url', () => {
    expect(() => validateUrl('', allowed)).toThrow(/missing/);
    expect(() => validateUrl(undefined, allowed)).toThrow(/missing/);
  });
});

describe('sanitizeFilename', () => {
  it('keeps lowercase alphanum and dashes', () => {
    expect(sanitizeFilename('abc-123')).toBe('abc-123');
  });
  it('lowercases input', () => {
    expect(sanitizeFilename('ABC-Foo')).toBe('abc-foo');
  });
  it('replaces spaces and special chars with dashes', () => {
    expect(sanitizeFilename('Mon Fichier!.PDF')).toBe('mon-fichier-pdf');
  });
  it('collapses repeated dashes', () => {
    expect(sanitizeFilename('a---b')).toBe('a-b');
  });
  it('trims leading/trailing dashes', () => {
    expect(sanitizeFilename('-abc-')).toBe('abc');
  });
  it('truncates at 80 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeFilename(long).length).toBe(80);
  });
  it('returns "document" when input is empty after sanitization', () => {
    expect(sanitizeFilename('')).toBe('document');
    expect(sanitizeFilename('!!!')).toBe('document');
  });
});

describe('pathnameToSlug', () => {
  it('strips leading and trailing slashes', () => {
    expect(pathnameToSlug('/abc/def/')).toBe('abc-def');
  });
  it('returns "document" for root path', () => {
    expect(pathnameToSlug('/')).toBe('document');
    expect(pathnameToSlug('')).toBe('document');
  });
  it('joins multi-segment paths with dashes', () => {
    expect(pathnameToSlug('/p/crm-data-automation/handout/2/')).toBe('p-crm-data-automation-handout-2');
  });
});
```

- [ ] **Step 3 : Lancer les tests pour vérifier qu'ils échouent (red)**

```bash
npm test
```

Expected : tous les tests échouent avec "Cannot find module './validation.js'" ou similaire.

- [ ] **Step 4 : Créer `src/validation.js` avec l'implémentation minimale**

```js
// src/validation.js
// Helpers purs (sans I/O) pour la validation des params query du worker.
// Testables en pur Node via Vitest.

const VALID_FORMATS = new Set([
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  'Letter', 'Legal', 'Tabloid', 'Ledger',
]);

const VALID_ORIENTATIONS = new Set(['portrait', 'landscape']);

const MARGIN_VALUE_RE = /^\d+(\.\d+)?(mm|cm|in|px)?$/;

export function validateFormat(value) {
  if (value === undefined || value === null || value === '') return 'A4';
  if (!VALID_FORMATS.has(value)) {
    throw new Error(`invalid format: ${value}`);
  }
  return value;
}

export function validateOrientation(value) {
  if (value === undefined || value === null || value === '') return 'portrait';
  if (!VALID_ORIENTATIONS.has(value)) {
    throw new Error(`invalid orientation: ${value}`);
  }
  return value;
}

export function parseMargin(value) {
  if (value === undefined || value === null || value === '') {
    return { top: '0', right: '0', bottom: '0', left: '0' };
  }
  if (value === '0') {
    return { top: '0', right: '0', bottom: '0', left: '0' };
  }
  const parts = value.trim().split(/\s+/);
  for (const p of parts) {
    if (!MARGIN_VALUE_RE.test(p) && p !== '0') {
      throw new Error(`invalid margin value: ${p}`);
    }
  }
  if (parts.length === 1) {
    const v = parts[0];
    return { top: v, right: v, bottom: v, left: v };
  }
  if (parts.length === 4) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  }
  throw new Error(`invalid margin: must be 1 or 4 values, got ${parts.length}`);
}

export function validateUrl(rawUrl, allowedHosts) {
  if (!rawUrl) {
    throw new Error('missing url');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('invalid url');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('https required');
  }
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`forbidden host: ${parsed.hostname}`);
  }
  return parsed;
}

export function sanitizeFilename(raw) {
  if (!raw) return 'document';
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'document';
}

export function pathnameToSlug(pathname) {
  if (!pathname) return 'document';
  const cleaned = pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
  return cleaned || 'document';
}
```

- [ ] **Step 5 : Lancer les tests pour vérifier qu'ils passent (green)**

```bash
npm test
```

Expected : tous les tests passent.

- [ ] **Step 6 : Commit**

```bash
git add vitest.config.js src/validation.js src/validation.test.js
git commit -m "feat: validation helpers with Vitest unit tests"
```

---

### Task A.3 : Handler `fetch` du worker

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-pdf/src/index.js`

- [ ] **Step 1 : Créer `src/index.js`**

```js
/**
 * lm-pdf : Worker Cloudflare generique pour generer des PDF vectoriels
 * via le binding natif Browser Rendering.
 *
 * Aucune logique metier, aucune connaissance des sites consommateurs.
 * Tout le styling print vit dans les sites consommateurs (@media print).
 *
 * Endpoint :
 *   GET /api/pdf?url=<encoded>&format=A4&orientation=portrait&margin=0&filename=<slug>
 *
 * Bindings (declares dans wrangler.toml) :
 *   - BROWSER : binding Browser Rendering
 *
 * Vars (declares dans wrangler.toml) :
 *   - ALLOWED_HOSTS : CSV des hostnames autorises a etre imprimes
 */

import puppeteer from '@cloudflare/puppeteer';

import {
  validateFormat,
  validateOrientation,
  parseMargin,
  validateUrl,
  sanitizeFilename,
  pathnameToSlug,
} from './validation.js';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function parseAllowedHosts(env) {
  const csv = env.ALLOWED_HOSTS ?? '';
  return new Set(csv.split(',').map((s) => s.trim()).filter(Boolean));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname !== '/api/pdf' || request.method !== 'GET') {
      return jsonError('not found', 404);
    }

    const allowedHosts = parseAllowedHosts(env);
    const params = url.searchParams;

    let target, format, orientation, margin, filename;
    try {
      target = validateUrl(params.get('url'), allowedHosts);
      format = validateFormat(params.get('format') ?? undefined);
      orientation = validateOrientation(params.get('orientation') ?? undefined);
      margin = parseMargin(params.get('margin') ?? undefined);
      const rawFilename = params.get('filename');
      filename = rawFilename
        ? sanitizeFilename(rawFilename)
        : pathnameToSlug(target.pathname);
    } catch (err) {
      const msg = err.message ?? 'validation failed';
      // Host non whitelist  - 403, le reste 400.
      const status = msg.startsWith('forbidden') ? 403 : 400;
      return jsonError(msg, status);
    }

    if (!env.BROWSER) {
      return jsonError('browser binding not configured', 503);
    }

    let browser;
    try {
      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.goto(target.toString(), { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format,
        landscape: orientation === 'landscape',
        printBackground: true,
        margin,
      });
      return new Response(pdf, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${filename}.pdf"`,
          'cache-control': 'no-store',
        },
      });
    } catch (err) {
      console.error('browser rendering failed', err);
      return jsonError('rendering failed', 502);
    } finally {
      if (browser) await browser.close();
    }
  },
};
```

- [ ] **Step 2 : Re-lancer les tests pour vérifier qu'ils passent toujours (les helpers ne sont pas cassés)**

```bash
npm test
```

Expected : tous les tests passent.

- [ ] **Step 3 : Commit**

```bash
git add src/index.js
git commit -m "feat: worker fetch handler with Browser Rendering"
```

---

### Task A.4 : Déploiement et smoke test

- [ ] **Step 1 : Vérifier que Browser Rendering est activé sur le compte CF**

Dashboard CF → Browser Rendering. Si pas encore activé, l'activer (free tier OK, déjà actif si `lm-signer` fonctionne).

- [ ] **Step 2 : Login wrangler (si pas déjà fait)**

```bash
npx wrangler login
```

- [ ] **Step 3 : Déployer**

```bash
npx wrangler deploy
```

Expected output : `Deployed lm-pdf triggers` + URL `https://lm-pdf.<account>.workers.dev`. Noter cette URL pour la suite (variable `LM_PDF_URL` dans la suite du plan).

- [ ] **Step 4 : Smoke test : générer un PDF de la home lm-offres existante**

```bash
curl -L -o test.pdf "https://lm-pdf.<account>.workers.dev/api/pdf?url=https%3A%2F%2Foffre.lausanne.marketing%2F&format=A4&orientation=portrait"
```

Expected : `test.pdf` créé, ouvrir avec un viewer PDF, vérifier qu'il y a du contenu (peut être minimal car la home lm-offres est sobre, mais le PDF doit s'ouvrir sans erreur).

- [ ] **Step 5 : Smoke test : host non-whitelist doit retourner 403**

```bash
curl -i "https://lm-pdf.<account>.workers.dev/api/pdf?url=https%3A%2F%2Fexample.com%2F"
```

Expected : `HTTP/2 403`, body `{"error":"forbidden host: example.com"}`.

- [ ] **Step 6 : Smoke test : format invalide retourne 400**

```bash
curl -i "https://lm-pdf.<account>.workers.dev/api/pdf?url=https%3A%2F%2Foffre.lausanne.marketing%2F&format=A99"
```

Expected : `HTTP/2 400`, body `{"error":"invalid format: A99"}`.

- [ ] **Step 7 : Pousser sur le remote (créer le repo distant via gh CLI)**

```bash
gh repo create lm-stack/lm-pdf --private --source=. --remote=origin --push
```

(Ou créer manuellement le repo sur github.com/lm-stack/lm-pdf et `git remote add origin ... && git push -u origin main`.)

---

## Phase B — Migration `lm-offres`

### Task B.1 : Pointer le bouton PDF vers `lm-pdf`

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres/src/layouts/OffreLayout.astro:202-211`

- [ ] **Step 1 : `git pull` sur lm-offres**

```bash
cd C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres
git pull --rebase
```

- [ ] **Step 2 : Ouvrir `src/layouts/OffreLayout.astro` ligne 202-211**

Remplacer :

```ts
const downloadBtn = document.getElementById('offre-download-btn') as HTMLButtonElement | null;
const SIGNER_URL_PDF = import.meta.env.PUBLIC_SIGNER_URL || 'https://lm-signer.hello-cb2.workers.dev';
downloadBtn?.addEventListener('click', async () => {
  const offerNumber =
    document.querySelector<HTMLElement>('.bon-pour-accord')?.dataset.offerNumber ||
    document.querySelector<HTMLElement>('[data-offer-number]')?.dataset.offerNumber ||
    'offre';
  const filename = `offre-${offerNumber}.pdf`;
  const pdfUrl = `${SIGNER_URL_PDF}/api/pdf?url=${encodeURIComponent(window.location.href)}`;
```

Par :

```ts
const downloadBtn = document.getElementById('offre-download-btn') as HTMLButtonElement | null;
const LM_PDF_URL = import.meta.env.PUBLIC_LM_PDF_URL || 'https://lm-pdf.hello-cb2.workers.dev';
downloadBtn?.addEventListener('click', async () => {
  const offerNumber =
    document.querySelector<HTMLElement>('.bon-pour-accord')?.dataset.offerNumber ||
    document.querySelector<HTMLElement>('[data-offer-number]')?.dataset.offerNumber ||
    'offre';
  const filename = `offre-${offerNumber}.pdf`;
  const pdfUrl = `${LM_PDF_URL}/api/pdf?url=${encodeURIComponent(window.location.href)}&format=A4&orientation=portrait&filename=offre-${offerNumber}`;
```

Note : remplacer `lm-pdf.hello-cb2.workers.dev` par l'URL réellement déployée à Task A.4 Step 3 si le subdomain de compte est différent.

- [ ] **Step 3 : Lancer le dev server pour vérifier que le build ne casse pas**

```bash
npm run dev
```

Expected : serveur démarre sans erreur. (Le bouton PDF n'est pas testable en local car le worker ne whiteliste que les domaines prod et `*.pages.dev`.)

- [ ] **Step 4 : Commit**

```bash
git add src/layouts/OffreLayout.astro
git commit -m "refactor(pdf): pointer le bouton télécharger vers lm-pdf

Le worker dédié lm-pdf remplace l'endpoint /api/pdf de lm-signer.
Variable d'env PUBLIC_LM_PDF_URL (default lm-pdf.hello-cb2.workers.dev).
Query string explicite avec format=A4 et orientation=portrait."
```

---

### Task B.2 : Déployer lm-offres et vérifier en prod

- [ ] **Step 1 : Pousser sur main**

```bash
git push origin main
```

Cloudflare Pages détecte le push et déploie automatiquement.

- [ ] **Step 2 : Vérifier le déploiement Pages**

Dashboard CF → Pages → lm-offres → vérifier que le déploiement passe.

- [ ] **Step 3 : Tester le bouton PDF en production**

Ouvrir n'importe quelle offre publiée (ex : `https://offre.lausanne.marketing/<slug>/`), cliquer "Télécharger en PDF". Vérifier :
- Le fichier téléchargé s'appelle bien `offre-<offerNumber>.pdf`
- Le PDF s'ouvre correctement
- Le texte est sélectionnable (vectoriel)
- Le chrome (toolbar, barre signer, etc.) est masqué (le `print.css` existant le gère via `@media print`)
- Les marges sont correctes (équivalentes à avant la bascule)

- [ ] **Step 4 : Si problème, rollback**

```bash
git revert HEAD
git push origin main
```

(Le worker `lm-signer` a encore son endpoint PDF, donc le rollback fonctionne immédiatement.)

---

### Task B.3 : Cleanup `lm-signer`

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres/workers/lm-signer/src/index.js`
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres/workers/lm-signer/wrangler.toml`
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres/workers/lm-signer/package.json`

- [ ] **Step 1 : Retirer le bloc `[browser]` dans `workers/lm-signer/wrangler.toml`**

Supprimer les lignes :

```toml
# Binding natif Cloudflare Browser Rendering. Aucun token a gerer : le worker
# dialogue avec le service en RPC interne. Doit etre active sur le compte
# (Dashboard CF → Browser Rendering, plan free OK pour notre volume).
[browser]
binding = "BROWSER"
```

- [ ] **Step 2 : Retirer `handlePdfRequest` et son usage dans `src/index.js`**

Dans `workers/lm-signer/src/index.js` :

a) Retirer l'import (ligne 24) :

```js
import puppeteer from '@cloudflare/puppeteer';
```

b) Retirer la branche `/api/pdf` du fetch handler (lignes 122-124 environ) :

```js
// Endpoint PDF : utilise le binding natif Browser Rendering pour generer
// un PDF vectoriel (texte selectionnable, fonts conservees) de l'offre.
if (url.pathname === '/api/pdf' && request.method === 'GET') {
  return handlePdfRequest(request, env);
}
```

c) Retirer toute la fonction `handlePdfRequest` et ses constantes associées (lignes 190-270 environ) :

```js
/**
 * GET /api/pdf?url=<offer-url>
 * ...
 */
const ALLOWED_PDF_HOSTS = new Set([...]);
const PDF_HIDE_CHROME_CSS = [...].join(' ');
async function handlePdfRequest(request, env) { ... }
```

d) Mettre à jour le docstring du fichier en haut (ligne 9-21) pour retirer la mention de `/api/pdf` et du binding `BROWSER` :

Ancien :
```js
 * Endpoints :
 *   - GET  /api/sign?key=<offerNumber> : retourne la signature stockée (404 si absente)
 *   - POST /api/sign                    : valide, écrit en KV, notifie LM
 *   - GET  /api/pdf?url=<offer-url>     : genere un PDF vectoriel de l'offre
 *
 * Bindings (déclarés dans wrangler.toml) :
 *   - SIGNATURES        : KV namespace
 *   - SIGNATURE_NOTIFY  : send_email binding (destination = NOTIFY_TO_EMAIL)
 *   - BROWSER           : binding Browser Rendering (utilise par /api/pdf)
```

Nouveau :
```js
 * Endpoints :
 *   - GET  /api/sign?key=<offerNumber> : retourne la signature stockée (404 si absente)
 *   - POST /api/sign                    : valide, écrit en KV, notifie LM
 *
 * Bindings (déclarés dans wrangler.toml) :
 *   - SIGNATURES        : KV namespace
 *   - SIGNATURE_NOTIFY  : send_email binding (destination = NOTIFY_TO_EMAIL)
```

- [ ] **Step 3 : Retirer la dépendance `@cloudflare/puppeteer` du `package.json`**

Dans `workers/lm-signer/package.json`, retirer :

```json
  "dependencies": {
    "@cloudflare/puppeteer": "^1.1.0"
  },
```

Le bloc `dependencies` devient absent (ou vide) puisque c'était la seule dépendance. Le `package.json` final :

```json
{
  "name": "lm-signer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.js",
  "description": "Worker autonome pour signature d'offres LM (KV + email)",
  "devDependencies": {
    "wrangler": "^4.90.0"
  }
}
```

(Mettre aussi à jour la `description` pour retirer la mention "+ PDF Browser Rendering".)

- [ ] **Step 4 : Mettre à jour `package-lock.json`**

```bash
cd workers/lm-signer
rm -rf node_modules
npm install
```

Expected : `package-lock.json` régénéré sans `@cloudflare/puppeteer`.

- [ ] **Step 5 : Déployer le worker `lm-signer` nettoyé**

```bash
npx wrangler deploy
```

Expected : déploiement réussit, le binding `BROWSER` n'est plus listé.

- [ ] **Step 6 : Smoke test : signature toujours fonctionnelle**

Tester rapidement la signature sur une offre de test. Le bouton "Valider" appelle toujours `lm-signer/api/sign` qui doit fonctionner identiquement.

- [ ] **Step 7 : Smoke test : ancien endpoint PDF retourne 404**

```bash
curl -i "https://lm-signer.hello-cb2.workers.dev/api/pdf?url=https%3A%2F%2Foffre.lausanne.marketing%2F"
```

Expected : `HTTP/2 404` (l'endpoint a été retiré).

- [ ] **Step 8 : Commit**

```bash
cd C:/Users/weasy/OneDrive/Documents/GitHub/lm-offres
git add workers/lm-signer/src/index.js workers/lm-signer/wrangler.toml workers/lm-signer/package.json workers/lm-signer/package-lock.json
git commit -m "chore(signer): retirer endpoint /api/pdf et binding Browser Rendering

Migré vers le worker dédié lm-pdf. lm-signer redevient strictement
signature + notification email."
git push origin main
```

---

## Phase C — `lm-presentation` modale + handout

### Task C.1 : Composant `PdfModal.astro`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/components/deck/PdfModal.astro`

- [ ] **Step 1 : `git pull` sur lm-presentation**

```bash
cd C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation
git pull --rebase
```

- [ ] **Step 2 : Vérifier que le dossier `src/components/deck/` existe (sinon le créer)**

```bash
mkdir -p src/components/deck
```

- [ ] **Step 3 : Créer `src/components/deck/PdfModal.astro`**

```astro
---
// src/components/deck/PdfModal.astro
// Modale de choix de layout PDF, ouverte au clic sur le bouton
// "Télécharger" du Deck. Trois options : 1up paysage, 2up portrait,
// 3up + lignes portrait. Click sur une card -> fetch lm-pdf -> download.
---
<dialog id="pdf-modal" class="pdf-modal" aria-labelledby="pdf-modal-title">
  <div class="pdf-modal__inner">
    <h2 id="pdf-modal-title" class="pdf-modal__title">Télécharger en PDF</h2>
    <p class="pdf-modal__hint">Choisis la disposition</p>

    <div class="pdf-modal__cards">
      <button type="button" class="pdf-modal__card" data-mode="1">
        <svg class="pdf-modal__preview" viewBox="0 0 100 80" aria-hidden="true">
          <rect x="2" y="20" width="96" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="10" y="28" width="80" height="24" fill="currentColor" opacity="0.15"/>
        </svg>
        <span class="pdf-modal__card-title">1 slide / page</span>
        <span class="pdf-modal__card-sub">Paysage</span>
      </button>

      <button type="button" class="pdf-modal__card" data-mode="2">
        <svg class="pdf-modal__preview" viewBox="0 0 100 80" aria-hidden="true">
          <rect x="20" y="2" width="60" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="26" y="14" width="48" height="22" fill="currentColor" opacity="0.15"/>
          <rect x="26" y="44" width="48" height="22" fill="currentColor" opacity="0.15"/>
        </svg>
        <span class="pdf-modal__card-title">2 slides / page</span>
        <span class="pdf-modal__card-sub">Portrait</span>
      </button>

      <button type="button" class="pdf-modal__card" data-mode="3">
        <svg class="pdf-modal__preview" viewBox="0 0 100 80" aria-hidden="true">
          <rect x="20" y="2" width="60" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="24" y="10" width="28" height="14" fill="currentColor" opacity="0.15"/>
          <line x1="56" y1="13" x2="76" y2="13" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="17" x2="76" y2="17" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="21" x2="76" y2="21" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <rect x="24" y="32" width="28" height="14" fill="currentColor" opacity="0.15"/>
          <line x1="56" y1="35" x2="76" y2="35" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="39" x2="76" y2="39" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="43" x2="76" y2="43" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <rect x="24" y="54" width="28" height="14" fill="currentColor" opacity="0.15"/>
          <line x1="56" y1="57" x2="76" y2="57" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="61" x2="76" y2="61" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
          <line x1="56" y1="65" x2="76" y2="65" stroke="currentColor" stroke-width="0.5" opacity="0.5"/>
        </svg>
        <span class="pdf-modal__card-title">3 slides + lignes</span>
        <span class="pdf-modal__card-sub">Portrait</span>
      </button>
    </div>

    <p class="pdf-modal__error" id="pdf-modal-error" hidden role="alert"></p>

    <button type="button" class="pdf-modal__close" id="pdf-modal-close" aria-label="Fermer">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/>
      </svg>
    </button>
  </div>
</dialog>

<script>
  const LM_PDF_URL = import.meta.env.PUBLIC_LM_PDF_URL || 'https://lm-pdf.hello-cb2.workers.dev';

  const modal = document.getElementById('pdf-modal') as HTMLDialogElement | null;
  const closeBtn = document.getElementById('pdf-modal-close') as HTMLButtonElement | null;
  const errorEl = document.getElementById('pdf-modal-error') as HTMLParagraphElement | null;
  const cards = modal ? Array.from(modal.querySelectorAll<HTMLButtonElement>('.pdf-modal__card')) : [];

  function getSlugFromPath(): string {
    // `/p/<slug>/` -> `<slug>`. Fallback : last non-empty segment.
    const parts = window.location.pathname.split('/').filter(Boolean);
    const pIdx = parts.indexOf('p');
    if (pIdx >= 0 && parts[pIdx + 1]) return parts[pIdx + 1];
    return parts[parts.length - 1] || 'presentation';
  }

  function buildTargetUrl(mode: '1' | '2' | '3'): { url: string; orientation: 'portrait' | 'landscape' } {
    const origin = window.location.origin;
    const slug = getSlugFromPath();
    if (mode === '1') {
      return { url: `${origin}/p/${slug}/?print-pdf`, orientation: 'landscape' };
    }
    return { url: `${origin}/p/${slug}/handout/${mode}/`, orientation: 'portrait' };
  }

  function buildFilename(mode: '1' | '2' | '3'): string {
    const slug = getSlugFromPath();
    if (mode === '1') return `${slug}-1up`;
    if (mode === '2') return `${slug}-2up`;
    return `${slug}-3up-notes`;
  }

  function setLoading(card: HTMLButtonElement, loading: boolean) {
    if (loading) {
      card.classList.add('pdf-modal__card--loading');
      cards.forEach((c) => { c.disabled = true; });
    } else {
      card.classList.remove('pdf-modal__card--loading');
      cards.forEach((c) => { c.disabled = false; });
    }
  }

  function showError(msg: string) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  async function handleCardClick(card: HTMLButtonElement) {
    const mode = card.dataset.mode as '1' | '2' | '3' | undefined;
    if (!mode) return;
    clearError();
    setLoading(card, true);
    try {
      const { url: targetUrl, orientation } = buildTargetUrl(mode);
      const filename = buildFilename(mode);
      const pdfUrl = `${LM_PDF_URL}/api/pdf?url=${encodeURIComponent(targetUrl)}&format=A4&orientation=${orientation}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      modal?.close();
    } catch (err) {
      console.error('PDF generation failed', err);
      showError('La génération du PDF a échoué. Réessaie dans un instant.');
    } finally {
      setLoading(card, false);
    }
  }

  cards.forEach((card) => card.addEventListener('click', () => handleCardClick(card)));
  closeBtn?.addEventListener('click', () => modal?.close());

  // Expose une fonction pour ouvrir la modale depuis Deck.astro.
  (window as any).openPdfModal = () => {
    clearError();
    modal?.showModal();
    // Focus sur la premiere card apres ouverture (frame suivante).
    requestAnimationFrame(() => cards[0]?.focus());
  };
</script>
```

- [ ] **Step 4 : Commit**

```bash
git add src/components/deck/PdfModal.astro
git commit -m "feat(deck): composant PdfModal avec 3 cards d'export PDF"
```

---

### Task C.2 : Wire-up dans `Deck.astro` + styles modale

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/layouts/Deck.astro:175-179`
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/styles/slides.css` (ajouts en fin de fichier)

- [ ] **Step 1 : Importer `PdfModal` dans `Deck.astro`**

En haut de `src/layouts/Deck.astro`, après les autres imports (ligne 3 environ) :

```ts
import PdfModal from '@/components/deck/PdfModal.astro';
```

- [ ] **Step 2 : Insérer le composant `<PdfModal />` dans le markup, juste avant la fermeture `</body>` (après `</footer>` ligne 93 environ)**

```astro
    </footer>

    <PdfModal />

    <script>
```

- [ ] **Step 3 : Remplacer le handler `downloadBtn` (lignes 175-179)**

Ancien :

```ts
// Bouton téléchargement PDF : ouvre la vue print-pdf de Reveal dans un nouvel onglet
const downloadBtn = document.getElementById('deck-download-btn') as HTMLButtonElement | null;
downloadBtn?.addEventListener('click', () => {
  const printUrl = window.location.pathname + '?print-pdf';
  window.open(printUrl, '_blank', 'noopener');
});
```

Nouveau :

```ts
// Bouton telechargement PDF : ouvre la modale qui propose 3 layouts.
const downloadBtn = document.getElementById('deck-download-btn') as HTMLButtonElement | null;
downloadBtn?.addEventListener('click', () => {
  (window as any).openPdfModal?.();
});
```

- [ ] **Step 4 : Ajouter les styles modale en fin de `src/styles/slides.css`**

Append à la fin du fichier :

```css
/* ============================================================ */
/* PdfModal : modale de choix de layout PDF (pattern .deck-menu) */
/* ============================================================ */

.pdf-modal {
  border: none;
  border-radius: 12px;
  padding: 0;
  background: #FFFFFF;
  color: #191919;
  max-width: 720px;
  width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.pdf-modal::backdrop {
  background: rgba(0, 0, 0, 0.4);
}
.pdf-modal__inner {
  position: relative;
  padding: 32px 24px 24px;
}
.pdf-modal__title {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #191919;
}
.pdf-modal__hint {
  font-size: 14px;
  color: #6B6F84;
  margin: 0 0 20px;
}
.pdf-modal__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.pdf-modal__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  background: #FFFFFF;
  color: #191919;
  font-family: 'Hanken Grotesk', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.pdf-modal__card:hover:not(:disabled) {
  border-color: #191919;
}
.pdf-modal__card:focus-visible {
  outline: 2px solid #191919;
  outline-offset: 2px;
}
.pdf-modal__card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pdf-modal__card--loading {
  border-color: #191919;
}
.pdf-modal__card--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23191919' stroke-width='3' stroke-linecap='round'><circle cx='12' cy='12' r='9' opacity='0.25'/><path d='M21 12a9 9 0 0 0-9-9'><animateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='0.9s' repeatCount='indefinite'/></path></svg>");
  background-repeat: no-repeat;
  background-position: center;
}
.pdf-modal__card {
  position: relative;
}
.pdf-modal__preview {
  width: 80px;
  height: 64px;
  color: #6B6F84;
}
.pdf-modal__card-title {
  font-size: 14px;
  font-weight: 600;
}
.pdf-modal__card-sub {
  font-size: 12px;
  color: #6B6F84;
}
.pdf-modal__error {
  margin: 16px 0 0;
  padding: 8px 12px;
  background: #FEE2E2;
  color: #B91C1C;
  border-radius: 6px;
  font-size: 14px;
}
.pdf-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6B6F84;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdf-modal__close:hover {
  background: #F3F4F6;
}

@media (max-width: 600px) {
  .pdf-modal__cards {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5 : Lancer le dev server et vérifier le rendu**

```bash
npm run dev
```

Ouvrir une présentation (`http://localhost:4321/p/crm-data-automation/`), cliquer sur le bouton télécharger. Vérifier :
- La modale s'ouvre
- Les 3 cards affichent bien les vignettes SVG
- ESC ferme la modale
- Click sur backdrop ferme la modale
- Click sur "X" ferme la modale
- Tab navigue entre les cards (focus visible)

Note : le click sur une card va échouer en local (le worker `lm-pdf` ne whiteliste pas `localhost`). C'est attendu, on testera en prod après déploiement.

- [ ] **Step 6 : Commit**

```bash
git add src/layouts/Deck.astro src/styles/slides.css
git commit -m "feat(deck): brancher PdfModal sur le bouton télécharger"
```

---

### Task C.3 : Layout `Handout.astro` + CSS

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/layouts/Handout.astro`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/styles/handout.css`

- [ ] **Step 1 : Créer `src/styles/handout.css`**

```css
/* src/styles/handout.css */
/* Styles pour le mode handout : rendu HTML statique pagine pour impression A4 portrait. */
/* Pas de Reveal.js ; on prend les <section> slottees et on les arrange en grille print-paginated. */

@import 'reveal.js/dist/reveal.css';
@import './global.css';

/* ============================================================ */
/* Reset screen pour preview interactif                          */
/* ============================================================ */

body {
  margin: 0;
  background: #F5F5F5;
  font-family: 'Hanken Grotesk', sans-serif;
  color: #191919;
}

.handout-doc {
  padding: 24px 0;
}

/* ============================================================ */
/* Une page A4 portrait                                          */
/* ============================================================ */

.handout-page {
  width: 210mm;
  height: 297mm;
  background: #FFFFFF;
  margin: 0 auto 16px;
  padding: 10mm;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: grid;
  gap: 10mm;
  page-break-after: always;
  break-after: page;
}
.handout-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

/* Mode 2up : 2 lignes egales, slides centrees verticalement */
.handout-page--2up {
  grid-template-rows: 1fr 1fr;
  align-items: center;
}

/* Mode 3up : 3 lignes egales, 2 colonnes (slide 60% / lignes 40%) */
.handout-page--3up {
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 60% 40%;
  align-items: center;
}

/* ============================================================ */
/* Conteneur d'une slide dans le handout                         */
/* ============================================================ */

.handout-slide {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
}

/* La slide Reveal d'origine est dimensionnee 1920 x 1080. On la scale */
/* pour qu'elle tienne dans le slot du handout. Le scale est calcule en JS */
/* apres le mount (largeur du slot / 1920). */
.handout-slide__inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  transform-origin: top left;
}

/* ============================================================ */
/* Colonne lignes vierges (mode 3up uniquement)                  */
/* ============================================================ */

.handout-lines {
  height: 100%;
  padding: 4mm 6mm;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 6.9mm,
    #BBB 7mm,
    #BBB 7.1mm
  );
}

/* ============================================================ */
/* Header / footer subtils                                       */
/* ============================================================ */

.handout-header {
  position: absolute;
  top: 4mm;
  left: 10mm;
  right: 10mm;
  display: flex;
  justify-content: space-between;
  font-size: 9pt;
  color: #6B6F84;
}

/* ============================================================ */
/* @media print : c'est ce qui compte pour Puppeteer page.pdf()  */
/* ============================================================ */

@media print {
  *, *::before, *::after {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    background: #FFFFFF;
    margin: 0;
  }
  .handout-doc {
    padding: 0;
  }
  .handout-page {
    width: 210mm;
    height: 297mm;
    margin: 0;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
  }
  .handout-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
```

- [ ] **Step 2 : Créer `src/layouts/Handout.astro`**

```astro
---
// src/layouts/Handout.astro
// Layout handout sans Reveal.js. Recoit les <section> via <slot />,
// les groupe par paquets de 2 ou 3, et les arrange en pages A4 portrait
// imprimables. Le scale des slides Reveal (1920x1080) vers le slot
// est calcule en JS apres le mount.
import '@/styles/handout.css';

interface Props {
  title: string;
  mode: '2' | '3';
}

const { title, mode } = Astro.props;
const perPage = mode === '2' ? 2 : 3;
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} : handout {mode}up : Lausanne Marketing</title>
    <meta name="robots" content="noindex" />
  </head>
  <body>
    <main
      class="handout-doc"
      data-mode={mode}
      data-per-page={perPage}
    >
      <!-- Les sections du MDX sont injectees ici. Le script post-mount -->
      <!-- les regroupe en pages, scale les slides, et insere les zones lignes. -->
      <div id="handout-source" hidden>
        <slot />
      </div>
      <div id="handout-pages"></div>
    </main>

    <script define:vars={{ mode, perPage }}>
      // Post-mount : groupe les <section> sources par paquets, scale, pagine.
      const source = document.getElementById('handout-source');
      const target = document.getElementById('handout-pages');
      if (!source || !target) {
        // garde-fou : ne rien faire
      } else {
        const sections = Array.from(source.querySelectorAll(':scope > section'));
        // Largeur d'un slot : depend du mode.
        // 2up : largeur utile A4 = 190mm = ~ 718px @ 96dpi
        // 3up : 60% de 190mm = 114mm = ~ 431px @ 96dpi
        // Le scale est applique en CSS via une variable.
        const slotPxByMode = mode === '2' ? 718 : 431;
        const scale = slotPxByMode / 1920;

        const groups = [];
        for (let i = 0; i < sections.length; i += perPage) {
          groups.push(sections.slice(i, i + perPage));
        }

        for (const group of groups) {
          const page = document.createElement('div');
          page.className = `handout-page handout-page--${mode}up`;

          if (mode === '2') {
            for (const sec of group) {
              page.appendChild(makeSlideContainer(sec, scale));
            }
          } else {
            // mode 3 : pour chaque slide, 2 cells (slide + zone lignes)
            for (const sec of group) {
              page.appendChild(makeSlideContainer(sec, scale));
              const lines = document.createElement('div');
              lines.className = 'handout-lines';
              page.appendChild(lines);
            }
          }
          target.appendChild(page);
        }

        // Cleanup source apres extraction.
        source.remove();
      }

      function makeSlideContainer(section, scale) {
        const slot = document.createElement('div');
        slot.className = 'handout-slide';
        const inner = document.createElement('div');
        inner.className = 'handout-slide__inner';
        inner.style.transform = `scale(${scale})`;
        // Move la section originale dans le slot pour preserver les styles Reveal.
        inner.appendChild(section);
        slot.appendChild(inner);
        return slot;
      }
    </script>
  </body>
</html>
```

- [ ] **Step 3 : Commit**

```bash
git add src/layouts/Handout.astro src/styles/handout.css
git commit -m "feat(handout): layout Handout + CSS pour pages A4 portrait paginées"
```

---

### Task C.4 : Route dynamique `/p/[slug]/handout/[mode]/`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/pages/p/[slug]/handout/[mode].astro`

- [ ] **Step 1 : Créer le dossier de route**

```bash
mkdir -p src/pages/p/[slug]/handout
```

- [ ] **Step 2 : Créer `src/pages/p/[slug]/handout/[mode].astro`**

```astro
---
// src/pages/p/[slug]/handout/[mode].astro
// Route dynamique : produit cartesien presentations x [2, 3].
// Reutilise la collection presentations et le composant Content du MDX,
// mais avec le layout Handout au lieu de Deck.
import { getCollection, render } from 'astro:content';
import Handout from '@/layouts/Handout.astro';

export async function getStaticPaths() {
  const decks = await getCollection('presentations');
  const modes = ['2', '3'];
  const paths = [];
  for (const d of decks) {
    for (const mode of modes) {
      paths.push({
        params: { slug: d.id.replace('.mdx', ''), mode },
        props: { entry: d, mode },
      });
    }
  }
  return paths;
}

const { entry, mode } = Astro.props;
const { Content } = await render(entry);
---
<Handout title={entry.data.title} mode={mode as '2' | '3'}>
  <Content />
</Handout>
```

- [ ] **Step 3 : Lancer le dev server et vérifier le rendu**

```bash
npm run dev
```

Ouvrir `http://localhost:4321/p/crm-data-automation/handout/2/` :
- Vérifier que la page s'affiche
- Vérifier que les slides apparaissent groupées par 2 par "page" A4
- Vérifier que le ratio 16:9 est respecté (pas de stretch)
- Vérifier que les slides sont centrées verticalement avec espace blanc

Ouvrir `http://localhost:4321/p/crm-data-automation/handout/3/` :
- Vérifier que les slides apparaissent groupées par 3
- Vérifier la 2e colonne avec lignes vierges (espacement 7mm)
- Vérifier que les lignes sont bien tracées (couleur grise discrète)

- [ ] **Step 4 : Tester l'impression locale (Ctrl+P)**

Ouvrir l'URL handout/2/ → `Ctrl+P`. Dans l'aperçu navigateur :
- Format = A4 portrait
- Marges = 0 (le @page CSS le force)
- Vérifier que les slides 2 par page sont correctement paginées
- Idem pour handout/3/

Si le rendu local est correct, le rendu via le worker `lm-pdf` le sera aussi (Puppeteer respecte le `@media print`).

- [ ] **Step 5 : Build pour vérifier que les pages statiques sont générées**

```bash
npm run build
```

Expected : pas d'erreur, les fichiers `dist/p/<slug>/handout/2/index.html` et `dist/p/<slug>/handout/3/index.html` sont créés pour chaque présentation existante.

- [ ] **Step 6 : Commit**

```bash
git add src/pages/p/[slug]/handout/[mode].astro
git commit -m "feat(handout): route dynamique /p/[slug]/handout/[mode]/"
```

---

### Task C.5 : Tests prod et vérification finale

- [ ] **Step 1 : Pousser sur main**

```bash
git push origin main
```

Cloudflare Pages redéploie automatiquement.

- [ ] **Step 2 : Vérifier le déploiement Pages**

Dashboard CF → Pages → lm-presentation → vérifier que le déploiement passe.

- [ ] **Step 3 : Tester le layout 1up sur prod**

Ouvrir `https://slides.lausanne.marketing/p/crm-data-automation/`, cliquer le bouton télécharger, choisir "1 slide / page". Vérifier :
- Modale s'ouvre, spinner pendant 5-10s
- PDF téléchargé : nom `crm-data-automation-1up.pdf`
- PDF en A4 paysage, 1 slide par page
- Texte sélectionnable

- [ ] **Step 4 : Tester le layout 2up sur prod**

Même flow, choisir "2 slides / page". Vérifier :
- PDF nom `crm-data-automation-2up.pdf`
- A4 portrait, 2 slides 16:9 par page
- Pas de stretch, slides centrées verticalement
- Espace blanc en haut/milieu/bas

- [ ] **Step 5 : Tester le layout 3up + lignes sur prod**

Même flow, choisir "3 slides + lignes". Vérifier :
- PDF nom `crm-data-automation-3up-notes.pdf`
- A4 portrait, 3 slides + colonne lignes par page
- Lignes correctement tracées (espacement 7mm, couleur grise)

- [ ] **Step 6 : Tester sur mobile (iOS Safari, Android Chrome)**

Ouvrir l'URL d'une présentation sur mobile, cliquer Télécharger. Vérifier :
- Modale s'affiche en colonne (1 card par ligne)
- Cards lisibles, vignettes SVG visibles
- Téléchargement déclenché correctement

- [ ] **Step 7 : Vérifier les quotas Browser Rendering**

Dashboard CF → Browser Rendering → vérifier le nombre d'invocations consommées par les tests. Free tier = quelques milliers / mois, largement suffisant.

- [ ] **Step 8 : Vérifier que `lm-offres` continue de fonctionner**

Ouvrir une offre publiée, cliquer Télécharger en PDF, vérifier que ça fonctionne identiquement à avant la migration (régression check).

---

## Self-review (auteur du plan)

Je relis le plan vis-à-vis de la spec :

- Section spec 2.1 (worker `lm-pdf`) couvert par Phase A ✓
- Section spec 2.2 (modifications `lm-presentation`) couvert par Phase C ✓
- Section spec 2.3 (refacto `lm-offres`) couvert par Phase B ✓
- Section spec 3 (contrat API worker) couvert par Tasks A.2, A.3 ✓
- Section spec 4 (routes handout) couvert par Tasks C.3, C.4 ✓
- Section spec 5 (modale UX) couvert par Tasks C.1, C.2 ✓
- Section spec 6 (migration `lm-offres`) couvert par Phase B (note : la migration CSS prévue par la spec section 6.1 étape 1 est en réalité un no-op car `print.css` couvre déjà tous les sélecteurs ; cette divergence est documentée dans Task B.2 step 3) ✓
- Section spec 7 (plan de déploiement) ordre suivi : A → B → C ✓
- Section spec 8 (tests) couvert par Tasks A.4, B.2, C.5 ✓

Pas de placeholders détectés. Pas de TBD.

Type / property consistency : `data-mode` sur les cards (string `'1'`, `'2'`, `'3'`) cohérent entre `PdfModal.astro` et `[mode].astro` (param d'URL). Filename auto cohérent : `<slug>-1up.pdf` etc.

Granularité : la plupart des steps tiennent en 2-5 min. Les steps "créer fichier X" avec un gros bloc de code sont plus longs (5-10 min) mais incompressibles vu la taille du contenu.
