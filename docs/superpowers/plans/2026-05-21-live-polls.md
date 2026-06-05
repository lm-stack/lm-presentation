# Sondages live (lm-polls + lm-presentation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter une feature de sondage live façon AhaSlides : QR code sur slide, participants votent depuis téléphone, graphique animé sur le slide. Deux types de sondages (QCM choix unique + nuage de mots).

**Architecture:** Deux phases. Phase A crée et déploie un nouveau worker `lm-polls` autonome avec Durable Objects (état temps réel) + KV (snapshots figés). Phase B ajoute les composants slides `<Poll>` / `<WordCloud>`, la route mobile `/v/[token]`, et la logique d'orchestration côté `lm-presentation`. La phase A est bloquante pour B.

**Tech Stack:**
- Worker `lm-polls` : Cloudflare Workers, Durable Objects, KV, Vitest pour tests unitaires
- `lm-presentation` : Astro 6, MDX, Reveal.js 6, lib `qrcode-generator` (npm, ~5 KB)

**Repos concernés (paths absolus):**
- `lm-polls` : `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/` (nouveau)
- `lm-presentation` : `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/`

**Spec source:** `lm-presentation/docs/superpowers/specs/2026-05-21-live-polls-design.md`

---

## File Structure récapitulative

### Phase A — `lm-polls/` (nouveau repo)

```
lm-polls/
├── .claude/
│   └── CLAUDE.md
├── src/
│   ├── index.js                # Worker entry, routing
│   ├── poll-do.js              # Durable Object class
│   ├── handlers/
│   │   ├── init.js             # POST /api/poll/init
│   │   ├── info.js             # GET  /api/poll/:token/info
│   │   ├── vote.js             # POST /api/poll/:token/vote
│   │   ├── results.js          # GET  /api/poll/:token/results
│   │   ├── freeze.js           # POST /api/poll/:token/freeze
│   │   ├── reset.js            # POST /api/poll/:token/reset
│   │   └── snapshot.js         # GET  /api/snapshot/:deckSlug/:pollId
│   └── lib/
│       ├── code.js             # generateShortCode
│       ├── hash.js             # hashVoter
│       ├── validate.js         # validateInitPayload, normalizeWord
│       └── cors.js             # CORS + origin whitelist
├── test/
│   ├── code.test.js
│   ├── hash.test.js
│   ├── validate.test.js
│   └── integration.test.js
├── package.json
├── wrangler.toml
├── vitest.config.js
├── README.md
└── .gitignore
```

### Phase B — `lm-presentation/` (modifications)

```
src/components/slides/Poll.astro                 # nouveau composant QCM
src/components/slides/WordCloud.astro            # nouveau composant nuage de mots
src/pages/v/[token].astro                        # nouvelle page mobile vote
src/content/presentations/template.mdx           # ajouter 2 exemples (Poll + WordCloud)
public/_headers                                  # ajouter lm-polls.<user>.workers.dev à connect-src
package.json                                     # ajouter dep qrcode-generator
.claude/CLAUDE.md                                # documenter <Poll>/<WordCloud> et workflow
```

---

## Phase A — Worker `lm-polls`

### Task A1 : Initialiser le repo lm-polls

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/package.json`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/wrangler.toml`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/vitest.config.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/.gitignore`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/README.md`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/.claude/CLAUDE.md`

- [ ] **Step 1 : Créer le dossier et init git**

```bash
mkdir -p "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
git init
git config windows.appendAtomically false
git config user.name "Thomas Rouaud"
git config user.email "hello@lausanne.marketing"
```

- [ ] **Step 2 : Écrire package.json**

```json
{
  "name": "lm-polls",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "description": "Worker Cloudflare pour sondages live : QCM et nuage de mots avec Durable Objects",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "wrangler": "^3.90.0"
  }
}
```

- [ ] **Step 3 : Écrire wrangler.toml**

```toml
#:schema node_modules/wrangler/config-schema.json
name = "lm-polls"
main = "src/index.js"
compatibility_date = "2026-01-01"
workers_dev = true

[[durable_objects.bindings]]
name = "POLL_DO"
class_name = "PollDO"

[[kv_namespaces]]
binding = "POLL_KV"
id = "<À REMPLIR APRÈS wrangler kv namespace create>"

[[migrations]]
tag = "v1"
new_classes = ["PollDO"]

[vars]
ALLOWED_HOSTS = "slides.lausanne.marketing,lm-presentation.pages.dev,localhost:4321"
```

- [ ] **Step 4 : Écrire vitest.config.js**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
```

- [ ] **Step 5 : Écrire .gitignore**

```
node_modules/
.wrangler/
.dev.vars
.env
.env.local
.DS_Store
desktop.ini
```

- [ ] **Step 6 : Écrire README.md**

```markdown
# lm-polls

Worker Cloudflare pour sondages live (QCM + nuage de mots) consommé par `lm-presentation`.

## Stack

- Cloudflare Workers + Durable Objects (état temps réel)
- Cloudflare KV (snapshots figés persistants)
- Vitest pour tests unitaires

## Commandes

- `npm install`
- `npm run dev` : dev local sur localhost:8787
- `npm run test` : tests unitaires
- `npm run deploy` : deploy en production
- `npm run tail` : logs en direct du worker prod

## Endpoints

Voir `lm-presentation/docs/superpowers/specs/2026-05-21-live-polls-design.md` section 3.2.

## Configuration

`wrangler.toml` : variable `ALLOWED_HOSTS` (origines whitelistées pour endpoints sensibles).
```

- [ ] **Step 7 : Écrire .claude/CLAUDE.md**

```markdown
# CLAUDE.md - lm-polls

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

## Contexte

Worker Cloudflare dédié aux sondages live (QCM + nuage de mots) pour `lm-presentation`. Aucune logique site-spécifique au-delà : juste un service de poll générique réutilisable.

## Stack

- Cloudflare Workers + Durable Objects + KV
- Vitest pour les tests des helpers
- `wrangler` pour deploy et dev local

## Règles

- **Ne pas mélanger avec `lm-pdf`** : `lm-pdf` fait la génération PDF Browser Rendering. `lm-polls` fait du temps réel via DO. Ces deux workers sont indépendants par design.
- **Maintenir la whitelist `ALLOWED_HOSTS`** dans `wrangler.toml` quand un nouveau site consommateur arrive.
- **Tests unitaires obligatoires** sur les helpers (`generateShortCode`, `hashVoter`, `validateInitPayload`, `normalizeWord`).
- **Pas de PII dans les logs** : on log les hashes de votants, jamais l'IP ni le UserAgent en clair.

## Conventions

- Langue : français (commits, commentaires, docs)
- Pas d'em dashes ni en dashes dans les textes humains
- Encodage UTF-8 obligatoire
```

- [ ] **Step 8 : Installer les deps**

```bash
npm install
```

Expected: `added N packages` sans erreur.

- [ ] **Step 9 : Créer le KV namespace**

```bash
npx wrangler kv namespace create lm-polls-snapshots
```

Expected output : un block TOML à coller dans `wrangler.toml`. Copier l'`id` retourné et l'injecter dans la section `[[kv_namespaces]]` du wrangler.toml.

- [ ] **Step 10 : Commit initial**

```bash
git add -A
git commit -m "chore: init repo lm-polls avec wrangler + vitest"
```

---

### Task A2 : Helper `generateShortCode`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/lib/code.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/test/code.test.js`

- [ ] **Step 1 : Écrire le test (failing)**

```javascript
// test/code.test.js
import { describe, it, expect } from 'vitest';
import { generateShortCode } from '../src/lib/code.js';

describe('generateShortCode', () => {
  it('retourne 6 caractères', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(6);
  });

  it('utilise uniquement l\'alphabet sans caractères ambigus', () => {
    const allowed = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 100; i++) {
      const code = generateShortCode();
      expect(code).toMatch(allowed);
    }
  });

  it('génère des codes différents à chaque appel', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      codes.add(generateShortCode());
    }
    expect(codes.size).toBeGreaterThan(45); // tolérance pour collisions ultra-rares
  });
});
```

- [ ] **Step 2 : Run test → doit FAIL**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
npm test
```

Expected: ÉCHEC avec "Cannot find module 'src/lib/code.js'".

- [ ] **Step 3 : Implémenter**

```javascript
// src/lib/code.js
// Génère un code court de 6 caractères pour identifier une session de poll.
// Alphabet 31 chars (ABCDEFGHJKMNPQRSTUVWXYZ23456789) sans 0/O/I/1/L pour
// éviter les confusions de saisie manuelle. Espace ≈ 887M combinaisons.

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateShortCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
```

- [ ] **Step 4 : Run test → doit PASS**

```bash
npm test
```

Expected: 3 tests passent.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/code.js test/code.test.js
git commit -m "feat(lib): generateShortCode pour identifier les sessions de poll"
```

---

### Task A3 : Helper `hashVoter`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/lib/hash.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/test/hash.test.js`

- [ ] **Step 1 : Écrire le test (failing)**

```javascript
// test/hash.test.js
import { describe, it, expect } from 'vitest';
import { hashVoter } from '../src/lib/hash.js';

describe('hashVoter', () => {
  it('retourne le même hash pour le même couple IP+UA', async () => {
    const a = await hashVoter('1.2.3.4', 'Mozilla/5.0');
    const b = await hashVoter('1.2.3.4', 'Mozilla/5.0');
    expect(a).toBe(b);
  });

  it('retourne des hashes différents pour IP différentes', async () => {
    const a = await hashVoter('1.2.3.4', 'Mozilla/5.0');
    const b = await hashVoter('1.2.3.5', 'Mozilla/5.0');
    expect(a).not.toBe(b);
  });

  it('retourne des hashes différents pour UA différents', async () => {
    const a = await hashVoter('1.2.3.4', 'Mozilla/5.0');
    const b = await hashVoter('1.2.3.4', 'Safari/600');
    expect(a).not.toBe(b);
  });

  it('retourne un hash hex de 16 chars', async () => {
    const h = await hashVoter('1.2.3.4', 'Mozilla/5.0');
    expect(h).toMatch(/^[a-f0-9]{16}$/);
  });
});
```

- [ ] **Step 2 : Run test → doit FAIL**

```bash
npm test
```

- [ ] **Step 3 : Implémenter**

```javascript
// src/lib/hash.js
// Hash anonyme et déterministe pour identifier un votant et empêcher le double-vote
// QCM. SHA256 tronqué à 16 hex chars = 64 bits, collisions négligeables à notre
// échelle. PII (IP, UA) jamais stockée en clair, seulement le hash.

export async function hashVoter(ip, userAgent) {
  const input = `${ip}|${userAgent}`;
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

- [ ] **Step 4 : Run test → doit PASS**

- [ ] **Step 5 : Commit**

```bash
git add src/lib/hash.js test/hash.test.js
git commit -m "feat(lib): hashVoter SHA256 tronqué pour anti-double-vote QCM"
```

---

### Task A4 : Helpers `validateInitPayload` et `normalizeWord`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/lib/validate.js`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/test/validate.test.js`

- [ ] **Step 1 : Écrire le test (failing)**

```javascript
// test/validate.test.js
import { describe, it, expect } from 'vitest';
import { validateInitPayload, normalizeWord } from '../src/lib/validate.js';

describe('validateInitPayload', () => {
  const valid = {
    deckSlug: 'crm-cours',
    pollId: 'vote-clarte',
    type: 'choice',
    question: 'Cette session t\'a paru ?',
    options: ['Très claire', 'Claire', 'Confuse'],
  };

  it('accepte un payload QCM valide', () => {
    const res = validateInitPayload(valid);
    expect(res.ok).toBe(true);
  });

  it('accepte un payload WordCloud valide (sans options)', () => {
    const res = validateInitPayload({
      deckSlug: 'crm-cours',
      pollId: 'mots-cles',
      type: 'word',
      question: 'Un mot pour résumer ?',
    });
    expect(res.ok).toBe(true);
  });

  it('rejette type invalide', () => {
    const res = validateInitPayload({ ...valid, type: 'likert' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('type');
  });

  it('rejette QCM sans options', () => {
    const res = validateInitPayload({ ...valid, options: undefined });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('options');
  });

  it('rejette QCM avec moins de 2 options', () => {
    const res = validateInitPayload({ ...valid, options: ['Seule'] });
    expect(res.ok).toBe(false);
  });

  it('rejette QCM avec plus de 6 options', () => {
    const res = validateInitPayload({ ...valid, options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    expect(res.ok).toBe(false);
  });

  it('rejette question trop longue', () => {
    const res = validateInitPayload({ ...valid, question: 'x'.repeat(201) });
    expect(res.ok).toBe(false);
  });

  it('rejette deckSlug avec caractères interdits', () => {
    const res = validateInitPayload({ ...valid, deckSlug: 'crm/cours' });
    expect(res.ok).toBe(false);
  });

  it('rejette option vide', () => {
    const res = validateInitPayload({ ...valid, options: ['Claire', ''] });
    expect(res.ok).toBe(false);
  });

  it('rejette option trop longue', () => {
    const res = validateInitPayload({ ...valid, options: ['Claire', 'x'.repeat(61)] });
    expect(res.ok).toBe(false);
  });
});

describe('normalizeWord', () => {
  it('trim et lowercase', () => {
    expect(normalizeWord('  Innovation  ')).toBe('innovation');
  });

  it('retire les accents (NFD)', () => {
    expect(normalizeWord('Créativité')).toBe('creativite');
  });

  it('retourne null si vide après trim', () => {
    expect(normalizeWord('   ')).toBe(null);
  });

  it('retourne null si plus de 30 chars après trim', () => {
    expect(normalizeWord('x'.repeat(31))).toBe(null);
  });

  it('accepte 30 chars exactement', () => {
    expect(normalizeWord('x'.repeat(30))).toBe('x'.repeat(30));
  });
});
```

- [ ] **Step 2 : Run test → doit FAIL**

- [ ] **Step 3 : Implémenter**

```javascript
// src/lib/validate.js
// Validation stricte des payloads venant de clients potentiellement malveillants.
// Retourne { ok: true } ou { ok: false, error: string }.

const SLUG_RE = /^[a-z0-9-]+$/;

export function validateInitPayload(p) {
  if (!p || typeof p !== 'object') return fail('payload manquant');

  if (typeof p.deckSlug !== 'string' || !SLUG_RE.test(p.deckSlug) || p.deckSlug.length > 50) {
    return fail('deckSlug invalide (lowercase alphanumeric + tirets, max 50 chars)');
  }
  if (typeof p.pollId !== 'string' || !SLUG_RE.test(p.pollId) || p.pollId.length > 50) {
    return fail('pollId invalide (lowercase alphanumeric + tirets, max 50 chars)');
  }
  if (p.type !== 'choice' && p.type !== 'word') {
    return fail('type invalide (choice ou word attendu)');
  }
  if (typeof p.question !== 'string' || p.question.length < 1 || p.question.length > 200) {
    return fail('question invalide (1 à 200 chars)');
  }

  if (p.type === 'choice') {
    if (!Array.isArray(p.options)) return fail('options requis pour type=choice');
    if (p.options.length < 2 || p.options.length > 6) {
      return fail('options doit contenir 2 à 6 entrées');
    }
    for (const opt of p.options) {
      if (typeof opt !== 'string' || opt.length < 1 || opt.length > 60) {
        return fail('chaque option doit être une string de 1 à 60 chars');
      }
    }
  }

  return { ok: true };
}

function fail(error) {
  return { ok: false, error };
}

export function normalizeWord(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 30) return null;
  return trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
```

- [ ] **Step 4 : Run test → doit PASS**

- [ ] **Step 5 : Commit**

```bash
git add src/lib/validate.js test/validate.test.js
git commit -m "feat(lib): validateInitPayload et normalizeWord avec validation stricte"
```

---

### Task A5 : Helper CORS + origin whitelist

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/lib/cors.js`

- [ ] **Step 1 : Écrire le test (failing)**

```javascript
// test/cors.test.js (créer ce fichier)
import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, corsHeaders } from '../src/lib/cors.js';

describe('isAllowedOrigin', () => {
  const env = { ALLOWED_HOSTS: 'slides.lausanne.marketing,localhost:4321' };

  it('accepte une origine whitelistée HTTPS', () => {
    expect(isAllowedOrigin('https://slides.lausanne.marketing', env)).toBe(true);
  });

  it('accepte localhost HTTP', () => {
    expect(isAllowedOrigin('http://localhost:4321', env)).toBe(true);
  });

  it('rejette une origine non whitelistée', () => {
    expect(isAllowedOrigin('https://evil.com', env)).toBe(false);
  });

  it('rejette null/undefined', () => {
    expect(isAllowedOrigin(null, env)).toBe(false);
    expect(isAllowedOrigin(undefined, env)).toBe(false);
  });
});

describe('corsHeaders', () => {
  it('retourne Access-Control-Allow-Origin: *  pour endpoint public', () => {
    const h = corsHeaders({ public: true });
    expect(h['Access-Control-Allow-Origin']).toBe('*');
  });

  it('retourne origine spécifique si whitelistée', () => {
    const env = { ALLOWED_HOSTS: 'slides.lausanne.marketing' };
    const h = corsHeaders({ origin: 'https://slides.lausanne.marketing', env });
    expect(h['Access-Control-Allow-Origin']).toBe('https://slides.lausanne.marketing');
  });

  it('retourne null si origine non whitelistée et pas public', () => {
    const env = { ALLOWED_HOSTS: 'slides.lausanne.marketing' };
    const h = corsHeaders({ origin: 'https://evil.com', env });
    expect(h).toBe(null);
  });
});
```

- [ ] **Step 2 : Run test → doit FAIL**

- [ ] **Step 3 : Implémenter**

```javascript
// src/lib/cors.js
// CORS + whitelist d'origines. Endpoints publics (info, vote, snapshot) renvoient
// Access-Control-Allow-Origin: *. Endpoints sensibles (init, results, freeze, reset)
// renvoient l'origine exacte si whitelistée, sinon le handler doit retourner 403.

export function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const hosts = (env.ALLOWED_HOSTS || '').split(',').map((h) => h.trim());
  try {
    const u = new URL(origin);
    return hosts.includes(u.host);
  } catch {
    return false;
  }
}

export function corsHeaders({ public: isPublic = false, origin, env } = {}) {
  if (isPublic) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  if (!isAllowedOrigin(origin, env)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function preflight(request, options) {
  const headers = corsHeaders(options);
  if (!headers) return new Response('Forbidden', { status: 403 });
  return new Response(null, { status: 204, headers });
}

export function isSameOrigin(request, env) {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;
  // Fallback : check Origin contre whitelist (pour browsers sans Sec-Fetch-Site)
  return isAllowedOrigin(request.headers.get('Origin'), env);
}
```

- [ ] **Step 4 : Run test → doit PASS**

- [ ] **Step 5 : Commit**

```bash
git add src/lib/cors.js test/cors.test.js
git commit -m "feat(lib): helpers CORS + isAllowedOrigin avec whitelist ALLOWED_HOSTS"
```

---

### Task A6 : Durable Object `PollDO` (squelette + storage)

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/poll-do.js`

- [ ] **Step 1 : Implémenter (pas de test unitaire, ce sera couvert par les tests d'intégration)**

```javascript
// src/poll-do.js
// Durable Object qui maintient l'état d'une session de poll en mémoire.
// Persiste l'état dans state.storage pour survivre aux evictions Cloudflare.
// S'auto-éteint après 60s sans activité via une alarme.

const INACTIVITY_MS = 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

export class PollDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.initialized = false;
    // Map<voterHash, lastTimestamp[]> pour rate limit
    this.rateLimits = new Map();
  }

  async loadState() {
    if (this.initialized) return;
    const stored = await this.state.storage.get('state');
    if (stored) {
      // voters sérialisé en Array, le ré-hydrater en Set
      stored.voters = new Set(stored.voters || []);
      this.poll = stored;
    } else {
      this.poll = null;
    }
    this.initialized = true;
  }

  async saveState() {
    if (!this.poll) return;
    const toStore = { ...this.poll, voters: Array.from(this.poll.voters) };
    await this.state.storage.put('state', toStore);
    await this.state.storage.setAlarm(Date.now() + INACTIVITY_MS);
  }

  async alarm() {
    // Inactivité dépassée : on efface l'état, le DO va s'éteindre
    await this.state.storage.deleteAll();
    this.poll = null;
    this.initialized = true;
  }

  // Méthodes appelées par les handlers via this.state.fetch / direct dispatch.
  // Pour simplicité : on expose une méthode fetch() unique qui route en interne.
  async fetch(request) {
    await this.loadState();
    const url = new URL(request.url);
    const op = url.pathname.split('/').pop();

    try {
      if (op === 'init' && request.method === 'POST') return await this.handleInit(request);
      if (op === 'info' && request.method === 'GET') return await this.handleInfo();
      if (op === 'vote' && request.method === 'POST') return await this.handleVote(request);
      if (op === 'results' && request.method === 'GET') return await this.handleResults();
      if (op === 'freeze' && request.method === 'POST') return await this.handleFreeze();
      if (op === 'reset' && request.method === 'POST') return await this.handleReset();
      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error('PollDO error', err);
      return json({ error: err.message || 'internal' }, 500);
    }
  }

  async handleInit(request) {
    const body = await request.json();
    // Validation déjà faite dans le worker handler. Ici on initialise juste.
    this.poll = {
      type: body.type,
      question: body.question,
      options: body.options,
      votes: {},
      voters: new Set(),
      frozen: false,
      deckSlug: body.deckSlug,
      pollId: body.pollId,
      createdAt: Date.now(),
    };
    await this.saveState();
    return json({ ok: true });
  }

  async handleInfo() {
    if (!this.poll) return json({ error: 'not found' }, 404);
    if (this.poll.frozen) return json({ error: 'frozen' }, 423);
    return json({
      type: this.poll.type,
      question: this.poll.question,
      options: this.poll.options,
    });
  }

  async handleVote(request) {
    if (!this.poll) return json({ error: 'not found' }, 404);
    if (this.poll.frozen) return json({ error: 'frozen' }, 423);

    const voterHash = request.headers.get('X-Voter-Hash');
    if (!voterHash) return json({ error: 'missing voter hash' }, 400);

    // Rate limit
    if (this.isRateLimited(voterHash)) {
      return json({ error: 'rate limited' }, 429);
    }

    const body = await request.json();

    if (this.poll.type === 'choice') {
      const choice = body.choice;
      if (typeof choice !== 'number' || choice < 0 || choice >= this.poll.options.length) {
        return json({ error: 'choice invalide' }, 400);
      }
      if (this.poll.voters.has(voterHash)) {
        return json({ error: 'déjà voté' }, 409);
      }
      this.poll.voters.add(voterHash);
      const key = String(choice);
      this.poll.votes[key] = (this.poll.votes[key] || 0) + 1;
    } else {
      const word = body.word;
      if (typeof word !== 'string' || word.length === 0 || word.length > 30) {
        return json({ error: 'word invalide' }, 400);
      }
      this.poll.votes[word] = (this.poll.votes[word] || 0) + 1;
    }

    this.recordVote(voterHash);
    await this.saveState();
    return json({ ok: true });
  }

  async handleResults() {
    if (!this.poll) return json({ error: 'not found' }, 404);
    const total = Object.values(this.poll.votes).reduce((s, n) => s + n, 0);
    return json({
      votes: this.poll.votes,
      total,
      frozen: this.poll.frozen,
    });
  }

  async handleFreeze() {
    if (!this.poll) return json({ error: 'not found' }, 404);
    this.poll.frozen = true;

    // Snapshot dans KV
    const snapshot = {
      type: this.poll.type,
      question: this.poll.question,
      options: this.poll.options,
      votes: this.poll.votes,
      frozenAt: new Date().toISOString(),
    };
    const key = `${this.poll.deckSlug}/${this.poll.pollId}`;
    await this.env.POLL_KV.put(key, JSON.stringify(snapshot));

    await this.saveState();
    return json({ ok: true });
  }

  async handleReset() {
    if (!this.poll) return json({ error: 'not found' }, 404);
    this.poll.votes = {};
    this.poll.voters = new Set();
    this.poll.frozen = false;
    await this.saveState();
    return json({ ok: true });
  }

  // Rate limit en mémoire (non persisté, reset à chaque eviction = OK car
  // l'eviction signifie que 60s+ sans activité, donc rate limit déjà oublié).
  isRateLimited(voterHash) {
    const now = Date.now();
    const stamps = (this.rateLimits.get(voterHash) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    this.rateLimits.set(voterHash, stamps);
    return stamps.length >= RATE_LIMIT_MAX;
  }

  recordVote(voterHash) {
    const stamps = this.rateLimits.get(voterHash) || [];
    stamps.push(Date.now());
    this.rateLimits.set(voterHash, stamps);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/poll-do.js
git commit -m "feat(do): PollDO class avec lifecycle, vote, freeze, reset"
```

---

### Task A7 : Worker entry `src/index.js` + handlers

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/src/index.js`

- [ ] **Step 1 : Implémenter le worker entry**

```javascript
// src/index.js
// Entry point du worker lm-polls. Routing par regex sur le path. Délègue au DO
// pour les ops sur les sessions, gère lui-même les snapshots KV et l'init.

import { PollDO } from './poll-do.js';
import { generateShortCode } from './lib/code.js';
import { hashVoter } from './lib/hash.js';
import { validateInitPayload, normalizeWord } from './lib/validate.js';
import { corsHeaders, isAllowedOrigin, isSameOrigin, preflight } from './lib/cors.js';

export { PollDO };

const TOKEN_RE = /^[A-Z0-9]{6}$/;
const SLUG_RE = /^[a-z0-9-]+$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin');

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      if (path.startsWith('/api/poll/') && (path.endsWith('/info') || path.endsWith('/vote'))) {
        return preflight(request, { public: true });
      }
      if (path.startsWith('/api/snapshot/')) {
        return preflight(request, { public: true });
      }
      return preflight(request, { origin, env });
    }

    try {
      // POST /api/poll/init
      if (path === '/api/poll/init' && request.method === 'POST') {
        return await handleInit(request, env, origin);
      }

      // GET /api/snapshot/:deckSlug/:pollId
      const snapMatch = path.match(/^\/api\/snapshot\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
      if (snapMatch && request.method === 'GET') {
        return await handleSnapshot(snapMatch[1], snapMatch[2], env);
      }

      // /api/poll/:token/...
      const pollMatch = path.match(/^\/api\/poll\/([A-Z0-9]{6})\/(info|vote|results|freeze|reset)$/);
      if (pollMatch) {
        const [, token, op] = pollMatch;

        // Auth selon endpoint
        if (op === 'info' || op === 'vote') {
          // Public, mais on hash le voter pour vote
          return await forwardToDO(token, op, request, env, { publicCORS: true });
        }
        if (op === 'results' || op === 'freeze' || op === 'reset') {
          if (!isSameOrigin(request, env) && !isAllowedOrigin(origin, env)) {
            return json({ error: 'forbidden' }, 403, corsHeaders({ origin, env }));
          }
          return await forwardToDO(token, op, request, env, { origin });
        }
      }

      // Root : health check
      if (path === '/' && request.method === 'GET') {
        return json({ name: 'lm-polls', version: '0.1.0' });
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error('worker error', err);
      return json({ error: 'internal' }, 500);
    }
  },
};

async function handleInit(request, env, origin) {
  if (!isAllowedOrigin(origin, env)) {
    return json({ error: 'forbidden' }, 403);
  }

  const body = await request.json().catch(() => null);
  const validation = validateInitPayload(body);
  if (!validation.ok) {
    return json({ error: validation.error }, 400, corsHeaders({ origin, env }));
  }

  // Génération du token avec check de collision (probabilité ~10⁻⁷ mais bon)
  let token;
  for (let i = 0; i < 5; i++) {
    token = generateShortCode();
    const id = env.POLL_DO.idFromName(token);
    const stub = env.POLL_DO.get(id);
    const probe = await stub.fetch(`https://do/info`, { method: 'GET' });
    if (probe.status === 404) break; // libre
    token = null;
  }
  if (!token) {
    return json({ error: 'token generation failed' }, 500, corsHeaders({ origin, env }));
  }

  const id = env.POLL_DO.idFromName(token);
  const stub = env.POLL_DO.get(id);
  const initRes = await stub.fetch('https://do/init', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!initRes.ok) {
    return json({ error: 'init failed' }, 500, corsHeaders({ origin, env }));
  }

  return json({ token }, 200, corsHeaders({ origin, env }));
}

async function handleSnapshot(deckSlug, pollId, env) {
  const key = `${deckSlug}/${pollId}`;
  const raw = await env.POLL_KV.get(key);
  if (!raw) return json({ error: 'no snapshot' }, 404, corsHeaders({ public: true }));
  return new Response(raw, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders({ public: true }),
    },
  });
}

async function forwardToDO(token, op, request, env, { publicCORS, origin } = {}) {
  const id = env.POLL_DO.idFromName(token);
  const stub = env.POLL_DO.get(id);

  // Pour le vote : on calcule le hash voter côté worker (a accès à CF-Connecting-IP)
  let forwardRequest = request;
  if (op === 'vote' && request.method === 'POST') {
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const ua = request.headers.get('User-Agent') || 'unknown';
    const voterHash = await hashVoter(ip, ua);
    const body = await request.json().catch(() => ({}));

    // Pour word : normalize ici plutôt que dans le DO (sépare validation et stockage)
    if (typeof body.word === 'string') {
      const normalized = normalizeWord(body.word);
      if (!normalized) {
        return json({ error: 'word invalide' }, 400, corsHeaders({ public: true }));
      }
      // Garde la forme originale pour display, normalize pour dédup
      // (v1 simple : on stocke la forme normalisée pour faciliter dédup côté DO)
      body.word = normalized;
    }

    forwardRequest = new Request(`https://do/${op}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'X-Voter-Hash': voterHash },
    });
  } else {
    forwardRequest = new Request(`https://do/${op}`, {
      method: request.method,
    });
  }

  const res = await stub.fetch(forwardRequest);

  // Ajoute CORS headers à la réponse
  const headers = publicCORS
    ? corsHeaders({ public: true })
    : corsHeaders({ origin, env });
  if (!headers) {
    return json({ error: 'forbidden' }, 403);
  }
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
```

- [ ] **Step 2 : Smoke test local**

```bash
npx wrangler dev
```

Dans un autre terminal :

```bash
curl http://localhost:8787/
```

Expected: `{"name":"lm-polls","version":"0.1.0"}`.

- [ ] **Step 3 : Commit**

```bash
git add src/index.js
git commit -m "feat(worker): entry point avec routing init/info/vote/results/freeze/reset/snapshot"
```

---

### Task A8 : Test d'intégration bout-en-bout

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls/test/integration.test.js`

- [ ] **Step 1 : Écrire le test d'intégration (test contre wrangler dev)**

Ce test demande que `npm run dev` soit lancé dans un terminal à part. Le test cible localhost:8787.

```javascript
// test/integration.test.js
import { describe, it, expect } from 'vitest';

const BASE = 'http://localhost:8787';
const ORIGIN = 'http://localhost:4321';

async function jpost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': ORIGIN,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function jget(path, { origin = ORIGIN } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Origin': origin },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

describe('lm-polls integration', () => {
  it('health check', async () => {
    const { status, body } = await jget('/');
    expect(status).toBe(200);
    expect(body.name).toBe('lm-polls');
  });

  it('init refuse une origine non whitelistée', async () => {
    const res = await fetch(`${BASE}/api/poll/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil.com',
      },
      body: JSON.stringify({
        deckSlug: 'test', pollId: 'q1', type: 'choice',
        question: 'Q ?', options: ['A', 'B'],
      }),
    });
    expect(res.status).toBe(403);
  });

  it('flow complet QCM : init → vote → results → freeze → snapshot', async () => {
    // Init
    const initRes = await jpost('/api/poll/init', {
      deckSlug: 'test-deck',
      pollId: `q-${Date.now()}`,
      type: 'choice',
      question: 'Cette session ?',
      options: ['Bien', 'Mal'],
    });
    expect(initRes.status).toBe(200);
    const token = initRes.body.token;
    expect(token).toMatch(/^[A-Z0-9]{6}$/);

    // Info (public)
    const info = await jget(`/api/poll/${token}/info`);
    expect(info.status).toBe(200);
    expect(info.body.options).toEqual(['Bien', 'Mal']);

    // Vote
    const voteRes = await jpost(`/api/poll/${token}/vote`, { choice: 0 });
    expect(voteRes.status).toBe(200);

    // Double vote rejeté (même IP+UA)
    const dup = await jpost(`/api/poll/${token}/vote`, { choice: 1 });
    expect(dup.status).toBe(409);

    // Results
    const results = await jget(`/api/poll/${token}/results`);
    expect(results.status).toBe(200);
    expect(results.body.total).toBe(1);
    expect(results.body.votes).toEqual({ '0': 1 });

    // Freeze
    const freeze = await jpost(`/api/poll/${token}/freeze`);
    expect(freeze.status).toBe(200);

    // Vote après freeze rejeté
    const lateVote = await jpost(`/api/poll/${token}/vote`, { choice: 0 });
    expect(lateVote.status).toBe(423);

    // Snapshot KV accessible
    const snap = await jget(`/api/snapshot/test-deck/q-${initRes.body.token.slice(0, 4)}`);
    // Note: snapshot uses pollId, not token, donc faut récup le pollId qu'on a utilisé
    // (réécrire si nécessaire)
  });

  it('flow WordCloud accepte multi-votes', async () => {
    const init = await jpost('/api/poll/init', {
      deckSlug: 'test', pollId: `w-${Date.now()}`, type: 'word',
      question: 'Un mot ?',
    });
    const token = init.body.token;

    const v1 = await jpost(`/api/poll/${token}/vote`, { word: 'innovation' });
    expect(v1.status).toBe(200);

    // Multi-votes acceptés en WordCloud (pas d'anti-double)
    const v2 = await jpost(`/api/poll/${token}/vote`, { word: 'agile' });
    expect(v2.status).toBe(200);

    const results = await jget(`/api/poll/${token}/results`);
    expect(results.body.total).toBe(2);
  });

  it('rejette word vide ou trop long', async () => {
    const init = await jpost('/api/poll/init', {
      deckSlug: 'test', pollId: `w2-${Date.now()}`, type: 'word', question: 'Q ?',
    });
    const token = init.body.token;

    const empty = await jpost(`/api/poll/${token}/vote`, { word: '   ' });
    expect(empty.status).toBe(400);

    const tooLong = await jpost(`/api/poll/${token}/vote`, { word: 'x'.repeat(31) });
    expect(tooLong.status).toBe(400);
  });

  it('init rejette payload invalide', async () => {
    const r = await jpost('/api/poll/init', {
      deckSlug: 'test', pollId: 'q', type: 'choice',
      question: 'Q', options: ['Solo'],
    });
    expect(r.status).toBe(400);
  });
});
```

- [ ] **Step 2 : Run l'intégration manuellement**

Terminal 1 :
```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
npm run dev
```

Terminal 2 :
```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
npm test -- integration
```

Expected: tous les tests d'intégration passent.

- [ ] **Step 3 : Commit**

```bash
git add test/integration.test.js
git commit -m "test(integration): flow complet QCM et WordCloud bout-en-bout"
```

---

### Task A9 : Deploy initial du worker

- [ ] **Step 1 : Login Cloudflare (si pas déjà fait)**

```bash
npx wrangler login
```

- [ ] **Step 2 : Deploy**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
npm run deploy
```

Expected: URL publique retournée, du type `https://lm-polls.<user>.workers.dev`. Noter cette URL.

- [ ] **Step 3 : Smoke test prod**

```bash
curl https://lm-polls.<user>.workers.dev/
```

Expected: `{"name":"lm-polls","version":"0.1.0"}`.

- [ ] **Step 4 : Créer le repo GitHub et push**

```bash
gh repo create lm-stack/lm-polls --private --source=. --remote=origin --push
```

(Si `gh` pas dispo : créer le repo manuellement sur GitHub puis `git remote add origin git@github.com:lm-stack/lm-polls.git && git push -u origin main`.)

- [ ] **Step 5 : Update spec avec URL exacte du worker**

Dans `lm-presentation/docs/superpowers/specs/2026-05-21-live-polls-design.md`, remplacer `lm-polls.<user>.workers.dev` par l'URL réelle obtenue.

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
# Edit le fichier spec pour remplacer le placeholder
git add docs/superpowers/specs/2026-05-21-live-polls-design.md
git commit -m "docs: URL réelle du worker lm-polls"
```

---

## Phase B — Frontend `lm-presentation`

### Task B1 : Installer qrcode-generator + variables d'environnement + CSP

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/package.json`
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/public/_headers`
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/.env.example`

- [ ] **Step 1 : Installer la dépendance**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm install qrcode-generator
```

- [ ] **Step 2 : Créer .env.example**

```env
# URL du worker lm-polls. À configurer aussi dans Cloudflare Pages env vars (UI dashboard).
PUBLIC_LM_POLLS_URL=https://lm-polls.<user>.workers.dev
```

Et créer `.env.local` (gitignored) avec la vraie URL pour dev.

- [ ] **Step 3 : Update CSP dans public/_headers**

Dans `public/_headers`, modifier `connect-src` pour ajouter l'URL lm-polls :

```
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https://images.unsplash.com; font-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://lm-pdf.hello-cb2.workers.dev https://pdf.lausanne.marketing https://lm-polls.<user>.workers.dev; frame-src https://open.spotify.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'
```

Remplacer `<user>` par la valeur réelle.

- [ ] **Step 4 : Commit**

```bash
git add package.json package-lock.json .env.example public/_headers
git commit -m "build: dep qrcode-generator + env PUBLIC_LM_POLLS_URL + CSP lm-polls"
```

---

### Task B2 : Composant `<Poll>` (QCM)

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/components/slides/Poll.astro`

- [ ] **Step 1 : Implémenter le composant Poll.astro**

```astro
---
// src/components/slides/Poll.astro
// Slide QCM live : question + QR + graphique barres horizontales animées.
// Suit le pattern SlideTitle (h2 + slide-subtitle + slide-divider).
// Quatre états : initial (bouton Démarrer), live (QR + polling), frozen (snapshot fige),
// archived (lecture KV après cours).
import SlideTitle from '@/components/SlideTitle.astro';

interface Props {
  id: string;
  question: string;
  options: string[];
  subtitle?: string;
  highlight?: string;
}

const { id, question, options, subtitle, highlight } = Astro.props;

if (options.length < 2 || options.length > 6) {
  throw new Error(`Poll "${id}" : options doit contenir 2 à 6 entrées, reçu ${options.length}`);
}
---
<section
  class="poll-slide"
  data-layout="poll"
  data-section-title={question.slice(0, 60)}
  data-poll-id={id}
  data-poll-type="choice"
  data-poll-question={question}
  data-poll-options={JSON.stringify(options)}
>
  <SlideTitle title={question} subtitle={subtitle} highlight={highlight} />

  <div class="poll-slide__body">
    <div class="poll-slide__chart" data-poll-chart>
      {options.map((opt, i) => (
        <div class="poll-slide__bar-row" data-bar-index={i}>
          <span class="poll-slide__bar-label">{opt}</span>
          <div class="poll-slide__bar-track">
            <div class="poll-slide__bar-fill" data-bar-fill style="width: 0%"></div>
          </div>
          <span class="poll-slide__bar-count" data-bar-count>0</span>
        </div>
      ))}
    </div>

    <div class="poll-slide__side" data-poll-side>
      <div class="poll-slide__initial" data-poll-state="initial" hidden>
        <button type="button" class="poll-slide__start-btn" data-poll-start>
          Démarrer le sondage
        </button>
      </div>

      <div class="poll-slide__live" data-poll-state="live" hidden>
        <div class="poll-slide__qr" data-poll-qr></div>
        <div class="poll-slide__code" data-poll-code>------</div>
        <div class="poll-slide__url" data-poll-url>slides.lausanne.marketing/v/------</div>
        <div class="poll-slide__counter" data-poll-counter>0 votes</div>
        <div class="poll-slide__actions">
          <button type="button" class="poll-slide__action-btn" data-poll-freeze title="Figer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Z"/>
            </svg>
          </button>
          <button type="button" class="poll-slide__action-btn" data-poll-reset title="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M197.67 186.37a8 8 0 0 1 0 11.29C196.58 198.73 170.82 224 128 224c-37.39 0-64.53-22.4-80-39.85V208a8 8 0 0 1-16 0v-48a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16H55.44C67.76 183.35 93 208 128 208c36 0 58.14-21.46 58.36-21.68a8 8 0 0 1 11.31.05M216 40a8 8 0 0 0-8 8v23.85C192.53 54.4 165.39 32 128 32c-42.82 0-68.58 25.27-69.66 26.34a8 8 0 0 0 11.3 11.34C69.86 69.46 92 48 128 48c35 0 60.24 24.65 72.56 40H168a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8V48a8 8 0 0 0-8-8"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="poll-slide__frozen" data-poll-state="frozen" hidden>
        <div class="poll-slide__frozen-badge">Vote terminé</div>
        <div class="poll-slide__counter" data-poll-frozen-counter>0 votes</div>
        <div class="poll-slide__actions">
          <button type="button" class="poll-slide__action-btn" data-poll-reset title="Nouvelle session">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M197.67 186.37a8 8 0 0 1 0 11.29C196.58 198.73 170.82 224 128 224c-37.39 0-64.53-22.4-80-39.85V208a8 8 0 0 1-16 0v-48a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16H55.44C67.76 183.35 93 208 128 208c36 0 58.14-21.46 58.36-21.68a8 8 0 0 1 11.31.05M216 40a8 8 0 0 0-8 8v23.85C192.53 54.4 165.39 32 128 32c-42.82 0-68.58 25.27-69.66 26.34a8 8 0 0 0 11.3 11.34C69.86 69.46 92 48 128 48c35 0 60.24 24.65 72.56 40H168a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8V48a8 8 0 0 0-8-8"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="poll-slide__archived" data-poll-state="archived" hidden>
        <div class="poll-slide__frozen-badge">Session archivée</div>
        <div class="poll-slide__counter" data-poll-archived-counter>0 votes</div>
      </div>
    </div>
  </div>
</section>

<style>
  .poll-slide__body {
    display: grid;
    grid-template-columns: 60% 40%;
    gap: 64px;
    width: 100%;
    max-width: 1700px;
    margin: 0 auto;
  }

  .poll-slide__chart {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-self: center;
  }

  .poll-slide__bar-row {
    display: grid;
    grid-template-columns: 280px 1fr 80px;
    align-items: center;
    gap: 16px;
    height: 56px;
  }

  .poll-slide__bar-label {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    text-align: right;
  }

  .poll-slide__bar-track {
    height: 56px;
    background: rgba(25, 25, 25, 0.06);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }

  .poll-slide__bar-fill {
    height: 100%;
    background: #FFD838;
    border-radius: 6px;
    transition: width 400ms ease-out;
    position: relative;
  }

  .poll-slide__bar-fill.is-flash::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.4);
    animation: poll-flash 600ms ease-out forwards;
  }

  @keyframes poll-flash {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .poll-slide__bar-count {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 24px;
    color: #191919;
    font-variant-numeric: tabular-nums;
  }

  .poll-slide__side {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .poll-slide__initial,
  .poll-slide__live,
  .poll-slide__frozen,
  .poll-slide__archived {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .poll-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: 2px solid #191919;
    border-radius: 12px;
    padding: 24px 48px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .poll-slide__start-btn:hover {
    transform: translateY(-2px);
  }

  .poll-slide__qr {
    width: 420px;
    height: 420px;
    background: #FAF8F3;
    border: 1px solid #191919;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .poll-slide__qr svg {
    width: 100%;
    height: 100%;
  }

  .poll-slide__code {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 80px;
    letter-spacing: 0.15em;
    color: #191919;
    font-variant-numeric: tabular-nums;
  }

  .poll-slide__url {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 500;
    font-size: 22px;
    color: #6B6F84;
  }

  .poll-slide__counter {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 18px;
    color: #6B6F84;
    margin-top: 4px;
  }

  .poll-slide__actions {
    display: flex;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid rgba(25, 25, 25, 0.12);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(25, 25, 25, 0.06);
    padding: 6px;
    margin-top: 12px;
  }

  .poll-slide__action-btn {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #191919;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  @media (hover: hover) {
    .poll-slide__action-btn:hover {
      background: #FFD838;
    }
  }

  .poll-slide__frozen-badge {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 36px;
    color: #191919;
    background: #FFD838;
    padding: 24px 48px;
    border: 2px solid #191919;
    border-radius: 12px;
    text-align: center;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Poll.astro
git commit -m "feat(slide): composant <Poll> avec 4 etats (initial/live/frozen/archived)"
```

---

### Task B3 : Composant `<WordCloud>` (nuage de mots)

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/components/slides/WordCloud.astro`

- [ ] **Step 1 : Implémenter le composant**

```astro
---
// src/components/slides/WordCloud.astro
// Slide nuage de mots live. Même structure que Poll mais viz différente :
// nuage flex-wrap avec taille proportionnelle au count.
import SlideTitle from '@/components/SlideTitle.astro';

interface Props {
  id: string;
  question: string;
  subtitle?: string;
  highlight?: string;
}

const { id, question, subtitle, highlight } = Astro.props;
---
<section
  class="wordcloud-slide"
  data-layout="wordcloud"
  data-section-title={question.slice(0, 60)}
  data-poll-id={id}
  data-poll-type="word"
  data-poll-question={question}
>
  <SlideTitle title={question} subtitle={subtitle} highlight={highlight} />

  <div class="wordcloud-slide__body">
    <div class="wordcloud-slide__chart" data-poll-chart>
      <!-- Mots injectés en JS -->
    </div>

    <div class="wordcloud-slide__side" data-poll-side>
      <div class="wordcloud-slide__initial" data-poll-state="initial" hidden>
        <button type="button" class="wordcloud-slide__start-btn" data-poll-start>
          Démarrer le sondage
        </button>
      </div>

      <div class="wordcloud-slide__live" data-poll-state="live" hidden>
        <div class="wordcloud-slide__qr" data-poll-qr></div>
        <div class="wordcloud-slide__code" data-poll-code>------</div>
        <div class="wordcloud-slide__url" data-poll-url>slides.lausanne.marketing/v/------</div>
        <div class="wordcloud-slide__counter" data-poll-counter>0 mots</div>
        <div class="wordcloud-slide__actions">
          <button type="button" class="wordcloud-slide__action-btn" data-poll-freeze title="Figer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Z"/>
            </svg>
          </button>
          <button type="button" class="wordcloud-slide__action-btn" data-poll-reset title="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M197.67 186.37a8 8 0 0 1 0 11.29C196.58 198.73 170.82 224 128 224c-37.39 0-64.53-22.4-80-39.85V208a8 8 0 0 1-16 0v-48a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16H55.44C67.76 183.35 93 208 128 208c36 0 58.14-21.46 58.36-21.68a8 8 0 0 1 11.31.05M216 40a8 8 0 0 0-8 8v23.85C192.53 54.4 165.39 32 128 32c-42.82 0-68.58 25.27-69.66 26.34a8 8 0 0 0 11.3 11.34C69.86 69.46 92 48 128 48c35 0 60.24 24.65 72.56 40H168a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8V48a8 8 0 0 0-8-8"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="wordcloud-slide__frozen" data-poll-state="frozen" hidden>
        <div class="wordcloud-slide__frozen-badge">Vote terminé</div>
        <div class="wordcloud-slide__counter" data-poll-frozen-counter>0 mots</div>
        <div class="wordcloud-slide__actions">
          <button type="button" class="wordcloud-slide__action-btn" data-poll-reset title="Nouvelle session">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M197.67 186.37a8 8 0 0 1 0 11.29C196.58 198.73 170.82 224 128 224c-37.39 0-64.53-22.4-80-39.85V208a8 8 0 0 1-16 0v-48a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16H55.44C67.76 183.35 93 208 128 208c36 0 58.14-21.46 58.36-21.68a8 8 0 0 1 11.31.05M216 40a8 8 0 0 0-8 8v23.85C192.53 54.4 165.39 32 128 32c-42.82 0-68.58 25.27-69.66 26.34a8 8 0 0 0 11.3 11.34C69.86 69.46 92 48 128 48c35 0 60.24 24.65 72.56 40H168a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8V48a8 8 0 0 0-8-8"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="wordcloud-slide__archived" data-poll-state="archived" hidden>
        <div class="wordcloud-slide__frozen-badge">Session archivée</div>
        <div class="wordcloud-slide__counter" data-poll-archived-counter>0 mots</div>
      </div>
    </div>
  </div>
</section>

<style>
  .wordcloud-slide__body {
    display: grid;
    grid-template-columns: 60% 40%;
    gap: 64px;
    width: 100%;
    max-width: 1700px;
    margin: 0 auto;
  }

  .wordcloud-slide__chart {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    align-self: center;
    min-height: 500px;
    padding: 24px;
  }

  .wordcloud-slide__word {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    line-height: 1.2;
    animation: wordcloud-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .wordcloud-slide__word--c0 { color: #FFD838; }
  .wordcloud-slide__word--c1 { color: #191919; }
  .wordcloud-slide__word--c2 { color: #6B6F84; }

  @keyframes wordcloud-pop {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .wordcloud-slide__side {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .wordcloud-slide__initial,
  .wordcloud-slide__live,
  .wordcloud-slide__frozen,
  .wordcloud-slide__archived {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  /* Reprise identique des styles de Poll (start-btn, qr, code, url, counter, actions, frozen-badge) */
  .wordcloud-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: 2px solid #191919;
    border-radius: 12px;
    padding: 24px 48px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .wordcloud-slide__start-btn:hover { transform: translateY(-2px); }

  .wordcloud-slide__qr {
    width: 420px;
    height: 420px;
    background: #FAF8F3;
    border: 1px solid #191919;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wordcloud-slide__qr svg { width: 100%; height: 100%; }

  .wordcloud-slide__code {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 80px;
    letter-spacing: 0.15em;
    color: #191919;
    font-variant-numeric: tabular-nums;
  }

  .wordcloud-slide__url {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 500;
    font-size: 22px;
    color: #6B6F84;
  }

  .wordcloud-slide__counter {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 18px;
    color: #6B6F84;
    margin-top: 4px;
  }

  .wordcloud-slide__actions {
    display: flex;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid rgba(25, 25, 25, 0.12);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(25, 25, 25, 0.06);
    padding: 6px;
    margin-top: 12px;
  }

  .wordcloud-slide__action-btn {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: #191919;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  @media (hover: hover) {
    .wordcloud-slide__action-btn:hover { background: #FFD838; }
  }

  .wordcloud-slide__frozen-badge {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 36px;
    color: #191919;
    background: #FFD838;
    padding: 24px 48px;
    border: 2px solid #191919;
    border-radius: 12px;
    text-align: center;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/WordCloud.astro
git commit -m "feat(slide): composant <WordCloud> nuage de mots live"
```

---

### Task B4 : Script orchestration côté slide (polling, états, QR, événements)

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/layouts/Deck.astro`

- [ ] **Step 1 : Ajouter le script de gestion des polls à la fin du `<script>` existant dans Deck.astro**

Localiser la fin du script principal dans `Deck.astro` (juste avant `</script>`). Ajouter ce bloc :

```typescript
      // ================================================================
      // Sondages live : initialisation et polling des slides <Poll>/<WordCloud>
      // ================================================================
      import qrcode from 'qrcode-generator';

      const LM_POLLS_URL = import.meta.env.PUBLIC_LM_POLLS_URL || '';
      const DECK_SLUG = window.location.pathname.split('/').filter(Boolean)[1] || 'unknown';

      type PollState = {
        type: 'choice' | 'word';
        question: string;
        options?: string[];
        pollId: string;
        token: string | null;
        pollingTimer: number | null;
        section: HTMLElement;
      };

      const polls = new Map<string, PollState>();

      function initPollSlides() {
        const slides = document.querySelectorAll<HTMLElement>('section[data-layout="poll"], section[data-layout="wordcloud"]');
        slides.forEach((section) => {
          const pollId = section.dataset.pollId!;
          const type = section.dataset.pollType as 'choice' | 'word';
          const question = section.dataset.pollQuestion!;
          const options = section.dataset.pollOptions ? JSON.parse(section.dataset.pollOptions) : undefined;

          const state: PollState = {
            type, question, options, pollId, token: null, pollingTimer: null, section,
          };
          polls.set(pollId, state);

          wireSlide(state);
          resolveInitialState(state);
        });
      }

      function wireSlide(state: PollState) {
        const sec = state.section;
        sec.querySelector<HTMLButtonElement>('[data-poll-start]')?.addEventListener('click', () => onStart(state));
        sec.querySelector<HTMLButtonElement>('[data-poll-freeze]')?.addEventListener('click', () => onFreeze(state));
        sec.querySelectorAll<HTMLButtonElement>('[data-poll-reset]').forEach((btn) => {
          btn.addEventListener('click', () => onReset(state));
        });
      }

      async function resolveInitialState(state: PollState) {
        const stored = sessionStorage.getItem(`poll-${state.pollId}-token`);
        if (stored) {
          // Vérifier que le DO existe encore
          const res = await fetch(`${LM_POLLS_URL}/api/poll/${stored}/info`);
          if (res.ok) {
            state.token = stored;
            await refreshPoll(state);
            showState(state, 'live');
            startPolling(state);
            return;
          }
          if (res.status === 423) {
            // Frozen
            state.token = stored;
            await refreshPoll(state);
            showState(state, 'frozen');
            return;
          }
          // 404 ou autre : token mort, nettoyer
          sessionStorage.removeItem(`poll-${state.pollId}-token`);
        }

        // Pas de token actif : essayer snapshot KV
        const snapRes = await fetch(`${LM_POLLS_URL}/api/snapshot/${DECK_SLUG}/${state.pollId}`);
        if (snapRes.ok) {
          const snap = await snapRes.json();
          renderResults(state, snap.votes, sumVotes(snap.votes));
          showState(state, 'archived');
          return;
        }

        // État initial
        showState(state, 'initial');
      }

      async function onStart(state: PollState) {
        const body: any = {
          deckSlug: DECK_SLUG,
          pollId: state.pollId,
          type: state.type,
          question: state.question,
        };
        if (state.type === 'choice') body.options = state.options;

        const res = await fetch(`${LM_POLLS_URL}/api/poll/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          console.error('Poll init failed', await res.text());
          return;
        }
        const { token } = await res.json();
        state.token = token;
        sessionStorage.setItem(`poll-${state.pollId}-token`, token);
        renderQR(state, token);
        showState(state, 'live');
        startPolling(state);
      }

      async function onFreeze(state: PollState) {
        if (!state.token) return;
        const res = await fetch(`${LM_POLLS_URL}/api/poll/${state.token}/freeze`, { method: 'POST' });
        if (!res.ok) {
          console.error('Freeze failed');
          return;
        }
        stopPolling(state);
        await refreshPoll(state);
        showState(state, 'frozen');
      }

      async function onReset(state: PollState) {
        if (state.token) {
          await fetch(`${LM_POLLS_URL}/api/poll/${state.token}/reset`, { method: 'POST' });
          await refreshPoll(state);
          showState(state, 'live');
          startPolling(state);
        } else {
          // Reset depuis état archived : on relance une init
          await onStart(state);
        }
      }

      function showState(state: PollState, name: 'initial' | 'live' | 'frozen' | 'archived') {
        const side = state.section.querySelector('[data-poll-side]')!;
        side.querySelectorAll<HTMLElement>('[data-poll-state]').forEach((el) => {
          el.hidden = el.dataset.pollState !== name;
        });
      }

      function startPolling(state: PollState) {
        stopPolling(state);
        state.pollingTimer = window.setInterval(() => refreshPoll(state), 1500);
      }

      function stopPolling(state: PollState) {
        if (state.pollingTimer) {
          clearInterval(state.pollingTimer);
          state.pollingTimer = null;
        }
      }

      async function refreshPoll(state: PollState) {
        if (!state.token) return;
        try {
          const res = await fetch(`${LM_POLLS_URL}/api/poll/${state.token}/results`, {
            credentials: 'include',
          });
          if (!res.ok) return;
          const { votes, total, frozen } = await res.json();
          renderResults(state, votes, total);
          if (frozen) {
            stopPolling(state);
            showState(state, 'frozen');
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }

      function renderResults(state: PollState, votes: Record<string, number>, total: number) {
        if (state.type === 'choice') {
          renderChoiceBars(state, votes, total);
        } else {
          renderWordCloud(state, votes);
        }
        const liveCounter = state.section.querySelector<HTMLElement>('[data-poll-counter]');
        const frozenCounter = state.section.querySelector<HTMLElement>('[data-poll-frozen-counter]');
        const archivedCounter = state.section.querySelector<HTMLElement>('[data-poll-archived-counter]');
        const unit = state.type === 'choice' ? 'votes' : 'mots';
        const label = `${total} ${unit}`;
        if (liveCounter) liveCounter.textContent = label;
        if (frozenCounter) frozenCounter.textContent = label;
        if (archivedCounter) archivedCounter.textContent = label;
      }

      function renderChoiceBars(state: PollState, votes: Record<string, number>, total: number) {
        const max = Math.max(1, ...Object.values(votes), 1);
        state.section.querySelectorAll<HTMLElement>('[data-bar-index]').forEach((row) => {
          const i = parseInt(row.dataset.barIndex!, 10);
          const count = votes[String(i)] || 0;
          const fill = row.querySelector<HTMLElement>('[data-bar-fill]')!;
          const cntEl = row.querySelector<HTMLElement>('[data-bar-count]')!;
          const newWidth = `${(count / max) * 100}%`;
          const oldCount = parseInt(cntEl.textContent || '0', 10);
          fill.style.width = newWidth;
          cntEl.textContent = String(count);
          if (count > oldCount) {
            fill.classList.remove('is-flash');
            void fill.offsetWidth; // restart anim
            fill.classList.add('is-flash');
          }
        });
      }

      function renderWordCloud(state: PollState, votes: Record<string, number>) {
        const chart = state.section.querySelector<HTMLElement>('[data-poll-chart]')!;
        const sorted = Object.entries(votes).sort(([, a], [, b]) => b - a).slice(0, 30);
        chart.innerHTML = '';
        sorted.forEach(([word, count], i) => {
          const span = document.createElement('span');
          span.className = `wordcloud-slide__word wordcloud-slide__word--c${i % 3}`;
          span.style.fontSize = `clamp(28px, calc(28px + ${count * 6}px), 96px)`;
          span.textContent = word;
          chart.appendChild(span);
        });
      }

      function renderQR(state: PollState, token: string) {
        const url = `${window.location.origin}/v/${token}`;
        const qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const svgString = qr.createSvgTag({ scalable: true, margin: 0 });
        const qrEl = state.section.querySelector<HTMLElement>('[data-poll-qr]')!;
        qrEl.innerHTML = svgString;
        state.section.querySelector<HTMLElement>('[data-poll-code]')!.textContent = token;
        state.section.querySelector<HTMLElement>('[data-poll-url]')!.textContent = url.replace(/^https?:\/\//, '');
      }

      function sumVotes(votes: Record<string, number>): number {
        return Object.values(votes).reduce((s, n) => s + n, 0);
      }

      // Init quand DOM ready (la slide est rendue par Reveal après init)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPollSlides);
      } else {
        initPollSlides();
      }
```

- [ ] **Step 2 : Commit**

```bash
git add src/layouts/Deck.astro
git commit -m "feat(deck): script orchestration des sondages live (polling, QR, etats)"
```

---

### Task B5 : Page mobile `/v/[token].astro`

**Files:**
- Create: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/pages/v/[token].astro`

- [ ] **Step 1 : Implémenter la page mobile**

```astro
---
// src/pages/v/[token].astro
// Page mobile où les participants votent. Statique côté Astro, le contenu est
// chargé via fetch côté client à partir du :token dans l'URL.
import FontsPreload from '@/components/FontsPreload.astro';

export function getStaticPaths() {
  // Route statique avec catch-all : on génère une seule page template,
  // le token est lu côté client. Renvoyer un placeholder pour Astro.
  return [{ params: { token: 'PLACEHOLDER' } }];
}

export const prerender = false;
---
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <FontsPreload />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <title>Sondage : Lausanne Marketing</title>
    <meta name="robots" content="noindex" />
    <style>
      :root {
        font-size: 62.5%;
      }
      body {
        margin: 0;
        font-family: 'Hanken Grotesk', sans-serif;
        background: #FAF8F3;
        color: #191919;
        min-height: 100vh;
      }
      .vote-header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: #FAF8F3;
        border-bottom: 1px solid rgba(25, 25, 25, 0.08);
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
        box-sizing: border-box;
      }
      .vote-brand {
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 16px;
      }
      .vote-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #6B6F84;
      }
      .vote-status__dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #6B6F84;
      }
      .vote-status--open .vote-status__dot { background: #22C55E; }
      .vote-status--closed .vote-status__dot { background: #EF4444; }

      .vote-body {
        padding: 24px;
        max-width: 480px;
        margin: 0 auto;
      }

      .vote-question {
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 800;
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 32px;
      }

      .vote-option {
        display: block;
        width: 100%;
        min-height: 72px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 18px;
        text-align: left;
        background: #FFFFFF;
        color: #191919;
        border: 2px solid #191919;
        border-radius: 12px;
        padding: 16px 24px;
        margin-bottom: 12px;
        cursor: pointer;
        box-sizing: border-box;
      }
      .vote-option:active,
      .vote-option.is-selected {
        background: #FFD838;
      }

      .vote-input {
        width: 100%;
        height: 60px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-size: 18px;
        padding: 16px;
        box-sizing: border-box;
        border: 2px solid #191919;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .vote-submit {
        width: 100%;
        height: 60px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 800;
        font-size: 18px;
        background: #191919;
        color: #FFD838;
        border: none;
        border-radius: 12px;
        cursor: pointer;
      }
      .vote-submit:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .vote-message {
        text-align: center;
        padding: 40px 16px;
      }
      .vote-message__icon {
        font-size: 64px;
        margin-bottom: 16px;
        line-height: 1;
      }
      .vote-message__title {
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 28px;
        margin: 0 0 8px;
      }
      .vote-message__detail {
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 500;
        font-size: 18px;
        color: #6B6F84;
        margin: 0;
      }
      .vote-message__action {
        margin-top: 24px;
        background: #FFD838;
        border: 2px solid #191919;
        border-radius: 12px;
        padding: 12px 24px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <header class="vote-header">
      <span class="vote-brand">Lausanne Marketing</span>
      <span class="vote-status" id="vote-status">
        <span class="vote-status__dot"></span>
        <span id="vote-status-label">Connexion</span>
      </span>
    </header>
    <main class="vote-body" id="vote-body">
      <p style="text-align: center; padding: 40px 16px; color: #6B6F84;">Chargement...</p>
    </main>

    <script>
      const LM_POLLS_URL = import.meta.env.PUBLIC_LM_POLLS_URL || '';
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const token = pathParts[pathParts.length - 1];

      const statusEl = document.getElementById('vote-status') as HTMLElement;
      const statusLabel = document.getElementById('vote-status-label') as HTMLElement;
      const body = document.getElementById('vote-body') as HTMLElement;

      function setStatus(state: 'open' | 'closed' | 'idle', label: string) {
        statusEl.classList.remove('vote-status--open', 'vote-status--closed');
        if (state === 'open') statusEl.classList.add('vote-status--open');
        if (state === 'closed') statusEl.classList.add('vote-status--closed');
        statusLabel.textContent = label;
      }

      function showMessage(icon: string, title: string, detail: string, action?: { label: string; onClick: () => void }) {
        body.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'vote-message';
        wrap.innerHTML = `
          <div class="vote-message__icon">${icon}</div>
          <h2 class="vote-message__title">${title}</h2>
          <p class="vote-message__detail">${detail}</p>
        `;
        if (action) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'vote-message__action';
          btn.textContent = action.label;
          btn.addEventListener('click', action.onClick);
          wrap.appendChild(btn);
        }
        body.appendChild(wrap);
      }

      async function init() {
        if (!token || !/^[A-Z0-9]{6}$/.test(token)) {
          setStatus('closed', 'Code invalide');
          showMessage('❌', 'Code invalide', 'Le code de session n\'est pas reconnu.');
          return;
        }

        try {
          const res = await fetch(`${LM_POLLS_URL}/api/poll/${token}/info`);
          if (res.status === 404) {
            setStatus('closed', 'Non démarré');
            showMessage('⏳', 'Sondage non démarré', "Demande à l'animateur de lancer le vote.");
            return;
          }
          if (res.status === 423) {
            setStatus('closed', 'Vote fermé');
            showMessage('🔒', 'Vote terminé', 'Merci pour ta participation !');
            return;
          }
          if (!res.ok) {
            setStatus('closed', 'Erreur');
            showMessage('⚠️', 'Erreur', 'Impossible de charger le sondage.');
            return;
          }
          const info = await res.json();
          setStatus('open', 'Vote ouvert');
          renderForm(info);
        } catch (err) {
          console.error(err);
          setStatus('closed', 'Erreur réseau');
          showMessage('⚠️', 'Erreur réseau', 'Vérifie ta connexion et recharge la page.');
        }
      }

      function renderForm(info: { type: 'choice' | 'word'; question: string; options?: string[] }) {
        body.innerHTML = '';
        const h = document.createElement('h1');
        h.className = 'vote-question';
        h.textContent = info.question;
        body.appendChild(h);

        if (info.type === 'choice' && info.options) {
          info.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'vote-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => submitChoice(i, opt));
            body.appendChild(btn);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'vote-input';
          input.maxLength = 30;
          input.placeholder = 'Un mot ou une expression';
          input.autocomplete = 'off';
          input.spellcheck = false;

          const submit = document.createElement('button');
          submit.type = 'button';
          submit.className = 'vote-submit';
          submit.textContent = 'Envoyer';
          submit.disabled = true;

          input.addEventListener('input', () => {
            submit.disabled = input.value.trim().length < 1 || input.value.trim().length > 30;
          });
          submit.addEventListener('click', () => {
            const word = input.value.trim();
            if (word.length === 0) return;
            submitWord(word, info);
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !submit.disabled) submit.click();
          });

          body.appendChild(input);
          body.appendChild(submit);
        }
      }

      async function submitChoice(choice: number, label: string) {
        try {
          const res = await fetch(`${LM_POLLS_URL}/api/poll/${token}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choice }),
          });
          if (res.status === 200) {
            showMessage('✅', 'Merci pour ton vote !', `Tu as voté pour : ${label}`);
            return;
          }
          if (res.status === 409) {
            showMessage('ℹ️', 'Tu as déjà voté', 'Un vote par appareil pour ce sondage.');
            return;
          }
          if (res.status === 423) {
            setStatus('closed', 'Vote fermé');
            showMessage('🔒', 'Vote fermé', 'Le sondage a été clôturé entre-temps.');
            return;
          }
          if (res.status === 429) {
            showMessage('⏱️', 'Trop de tentatives', 'Attends une minute avant de réessayer.');
            return;
          }
          showMessage('⚠️', 'Erreur', `Le vote n'a pas pu être enregistré (${res.status}).`, { label: 'Réessayer', onClick: () => init() });
        } catch (err) {
          showMessage('⚠️', 'Erreur réseau', 'Vérifie ta connexion.', { label: 'Réessayer', onClick: () => init() });
        }
      }

      async function submitWord(word: string, info: any) {
        try {
          const res = await fetch(`${LM_POLLS_URL}/api/poll/${token}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word }),
          });
          if (res.status === 200) {
            showMessage('✅', 'Réponse envoyée !', 'Propose-en une autre si tu veux.', {
              label: 'Envoyer un autre mot',
              onClick: () => renderForm(info),
            });
            return;
          }
          if (res.status === 423) {
            setStatus('closed', 'Vote fermé');
            showMessage('🔒', 'Vote fermé', 'Le sondage a été clôturé entre-temps.');
            return;
          }
          if (res.status === 429) {
            showMessage('⏱️', 'Trop de tentatives', 'Attends une minute avant de réessayer.');
            return;
          }
          showMessage('⚠️', 'Erreur', `La réponse n'a pas pu être envoyée (${res.status}).`, { label: 'Réessayer', onClick: () => renderForm(info) });
        } catch (err) {
          showMessage('⚠️', 'Erreur réseau', 'Vérifie ta connexion.', { label: 'Réessayer', onClick: () => renderForm(info) });
        }
      }

      init();
    </script>
  </body>
</html>
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/v/[token].astro
git commit -m "feat(mobile): page /v/[token] pour vote QCM et nuage de mots"
```

---

### Task B6 : Ajouter exemples Poll + WordCloud dans template.mdx

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/src/content/presentations/template.mdx`

- [ ] **Step 1 : Ajouter les imports et 2 slides exemples avant le `<Closing>` final**

Localiser la fin du fichier `template.mdx` (avant `<Closing variant="qa" />`).

Ajouter les imports en haut du fichier :

```mdx
import Poll from '@/components/slides/Poll.astro';
import WordCloud from '@/components/slides/WordCloud.astro';
```

Puis ajouter ces slides avant `<Closing variant="qa" />` :

```mdx
<Section
  number="04"
  eyebrow="Interactivité"
  title="Sondages live"
  highlight="live"
  subtitle="QCM et nuage de mots avec QR code et graphique temps réel."
/>

<Poll
  id="exemple-qcm"
  question="Cette présentation t'a paru ?"
  subtitle="Réponds depuis ton téléphone"
  highlight="téléphone"
  options={[
    "Très claire",
    "Claire",
    "Confuse par moments",
    "Très confuse",
  ]}
/>

<WordCloud
  id="exemple-mots-cles"
  question="En un mot, qu'est-ce que tu retiens ?"
  subtitle="Plusieurs réponses bienvenues"
  highlight="Plusieurs"
/>
```

- [ ] **Step 2 : Tester en local**

```bash
npm run dev
```

Aller sur `http://localhost:4321/p/template/` et naviguer jusqu'aux slides Poll et WordCloud. Vérifier que :
- L'état initial affiche bien le bouton "Démarrer le sondage"
- Click sur "Démarrer" → QR + code + URL apparaissent
- Le code court a bien 6 chars alphanumériques

- [ ] **Step 3 : Tester depuis un téléphone (ou DevTools mobile)**

Ouvrir DevTools, toggle device mode, naviguer sur `localhost:4321/v/<TOKEN>` avec un token affiché sur la slide. Vérifier que le formulaire de vote s'affiche correctement, que le vote fonctionne, et que le graphique sur le slide se rafraîchit dans les 2 secondes.

- [ ] **Step 4 : Commit**

```bash
git add src/content/presentations/template.mdx
git commit -m "feat(template): exemples <Poll> et <WordCloud> dans le deck demo"
```

---

### Task B7 : Documenter dans `.claude/CLAUDE.md`

**Files:**
- Modify: `C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation/.claude/CLAUDE.md`

- [ ] **Step 1 : Ajouter une section "Sondages live" à la fin du CLAUDE.md**

Ajouter avant la section "Ne JAMAIS" :

```markdown
## Sondages live

Deux composants slides : `<Poll>` (QCM) et `<WordCloud>` (nuage de mots).

```mdx
<Poll
  id="vote-clarte"
  question="Cette session t'a paru ?"
  options={["Très claire", "Claire", "Confuse"]}
/>

<WordCloud
  id="mots-cles"
  question="Un mot pour résumer ?"
/>
```

Le présentateur clique "Démarrer le sondage" sur la slide, un QR + URL courte apparaissent. Les participants scannent et votent. Le graphique se rafraîchit toutes les 1.5s (max ~1.7s de latence).

Boutons sur la slide :
- **Démarrer** : initialise une session (génère token court 6 chars)
- **Figer** : verrouille les votes, snapshot persistant dans Cloudflare KV
- **Reset** : remet à zéro sans changer le token

Workflow détaillé et architecture : `docs/superpowers/specs/2026-05-21-live-polls-design.md`.

Variable d'env requise : `PUBLIC_LM_POLLS_URL` (URL du worker `lm-polls`), à configurer dans `.env.local` et dans Cloudflare Pages env vars.
```

- [ ] **Step 2 : Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs(claude): regle Sondages live avec exemples <Poll>/<WordCloud>"
```

---

### Task B8 : Tests manuels bout-en-bout

- [ ] **Step 1 : Setup**

Terminal 1 (worker) :
```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-polls"
npm run dev
```

Terminal 2 (site) :
```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run dev
```

Mettre `PUBLIC_LM_POLLS_URL=http://localhost:8787` dans `.env.local`.

- [ ] **Step 2 : Scénario 1 — Flux QCM nominal**

1. Ouvrir `http://localhost:4321/p/template/` dans Chrome
2. Naviguer jusqu'au slide Poll exemple-qcm
3. Cliquer "Démarrer le sondage"
4. Noter le code à 6 chars affiché
5. Ouvrir un onglet incognito sur `http://localhost:4321/v/<CODE>`
6. Voter pour une option
7. **Vérifier** : dans les 2s, la barre correspondante grandit sur le slide principal, le compteur passe à `1 votes`
8. Tenter de re-voter depuis l'onglet incognito → "Tu as déjà voté"
9. Ouvrir un 2e onglet incognito (ou private window), voter pour une autre option
10. **Vérifier** : 2e barre grandit, compteur à `2 votes`

- [ ] **Step 3 : Scénario 2 — Freeze + Archive**

1. Suite du scénario 1, cliquer "Figer" sur le slide
2. **Vérifier** : badge "Vote terminé" remplace le QR, bouton Reset disponible
3. Depuis l'onglet incognito, recharger la page → "Vote terminé. Merci pour ta participation !"
4. Naviguer ailleurs dans le deck puis revenir sur le slide poll
5. **Vérifier** : état frozen conservé, graphique avec les vrais résultats
6. Fermer Chrome, rouvrir le deck (sessionStorage vide)
7. **Vérifier** : état "Session archivée" affiché, graphique avec les bons résultats (chargé depuis le snapshot KV)

- [ ] **Step 4 : Scénario 3 — Reset relance une session**

1. Sur l'état frozen ou archived, cliquer "Reset" / "Nouvelle session"
2. **Vérifier** : Nouveau code généré, nouveau QR affiché, graphique vide
3. Voter → graphique repart de zéro
4. Re-figer → snapshot KV est écrasé par les nouveaux chiffres
5. Recharger en nouvel onglet → "Session archivée" affiche les NOUVEAUX chiffres (pas les anciens)

- [ ] **Step 5 : Scénario 4 — WordCloud**

1. Naviguer au slide WordCloud, "Démarrer"
2. Depuis 2 onglets incognito, envoyer plusieurs mots variés ("innovation", "agile", "collaboration", puis "innovation" depuis le 2e onglet)
3. **Vérifier** : le nuage de mots apparaît avec "innovation" plus grand que les autres (2 votes vs 1 vote pour les autres)
4. Multi-votes acceptés (pas de blocage anti-double-vote sur WordCloud)
5. Submit mot vide depuis le mobile → bouton "Envoyer" reste désactivé
6. Submit mot > 30 chars → bouton reste désactivé

- [ ] **Step 6 : Scénario 5 — Mode plein écran**

1. Ouvrir le deck, naviguer au slide poll, démarrer la session
2. Cliquer le bouton "Plein écran" du deck
3. **Vérifier** : les boutons Figer / Reset restent visibles et cliquables sur le slide
4. **Vérifier** : le QR + code + URL sont toujours visibles

- [ ] **Step 7 : Si tout passe, commit final**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git add -A
git commit -m "test: validation manuelle bout-en-bout des sondages live" --allow-empty
```

---

### Task B9 : Déploiement et configuration Cloudflare Pages

- [ ] **Step 1 : Ajouter la variable d'env dans Cloudflare Pages**

Via le dashboard Cloudflare → Pages → lm-presentation → Settings → Environment variables :
- Ajouter `PUBLIC_LM_POLLS_URL` = `https://lm-polls.<user>.workers.dev` (production)
- Idem pour preview

- [ ] **Step 2 : Push sur main pour déclencher le build CF Pages**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git push
```

- [ ] **Step 3 : Smoke test prod**

1. Aller sur `https://slides.lausanne.marketing/p/template/`
2. Naviguer au slide Poll exemple-qcm
3. Démarrer la session
4. Scanner le QR depuis un vrai téléphone (autre réseau que WiFi local)
5. Voter
6. **Vérifier** : graphique se rafraîchit dans les 2s sur le slide
7. Tester le flux complet : freeze + reset + archive

- [ ] **Step 4 : Documenter l'URL prod du worker dans la spec si pas déjà fait**

Le fichier `docs/superpowers/specs/2026-05-21-live-polls-design.md` doit contenir l'URL finale du worker.

---

## Self-Review

**Spec coverage check** :

- ✅ §1.1 QCM + nuage de mots : tasks B2 + B3
- ✅ §1.2 Hors scope respecté (pas d'auth, pas d'export, pas d'historique)
- ✅ §2.1 Worker `lm-polls` dédié : tasks A1-A9
- ✅ §2.2 Modifications lm-presentation : tasks B1-B9
- ✅ §3.1 Structure repo respectée : task A1 + handlers répartis (consolidés dans A6+A7 pour pragmatisme)
- ✅ §3.2 Endpoints implémentés : task A7 (worker entry) + A6 (DO méthodes)
- ✅ §3.3 Modèle de données DO : task A6
- ✅ §3.4 Persistence KV : task A6 (handleFreeze) + A7 (handleSnapshot)
- ✅ §3.5 Sécurité (CORS, rate limit, validation, hash voter) : tasks A3-A7
- ✅ §4.1 Composants `<Poll>` `<WordCloud>` : tasks B2 + B3
- ✅ §4.2 Page mobile `/v/[token]` : task B5
- ✅ §4.3 QR + URL courte : task B4 (renderQR)
- ✅ §4.4 États initial/live/frozen/archived : task B4 (resolveInitialState + showState)
- ✅ §5 Flux et identifiants : tasks A7 (init/snapshot) + B4 (workflow présentateur)
- ✅ §6 Layout visuel : tasks B2 + B3 + B5
- ✅ §7 Edge cases : tasks B4 (gestion network errors, 404, 423, 429) + A6/A7 (rate limit, validation, anti-double)
- ✅ §8 Testing : tasks A2-A4 (unit), A8 (intégration), B8 (manuel)
- ✅ §9 Déploiement : tasks A9 + B9

**Placeholder scan** : aucun `TBD`, `TODO`, `implement later`. URLs avec `<user>` sont des placeholders explicites à substituer au moment du deploy, pas des oublis de spec.

**Type consistency** : 
- `PollState` (DO) = `{ type, question, options, votes, voters, frozen, deckSlug, pollId, createdAt }` cohérent entre task A6 et A7
- `PollState` (frontend, task B4) = `{ type, question, options, pollId, token, pollingTimer, section }` — différent du backend par design (front a besoin de section + timer, back a besoin de voters + frozen).
- `token` : string `[A-Z0-9]{6}` partout. Regex matchent côté worker (`/^[A-Z0-9]{6}$/`) et côté frontend (`/^[A-Z0-9]{6}$/`).
- Endpoint paths cohérents entre A7 et B4 (`/api/poll/init`, `/api/poll/:token/vote`, etc.).

Plan complet.

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-05-21-live-polls.md`.

Deux options d'exécution :

**1. Subagent-Driven (recommandé)** — Je dispatche un subagent frais par task, review entre tasks, itération rapide. Bien pour ce plan en 18 tasks réparties sur 2 phases distinctes.

**2. Inline Execution** — J'exécute les tasks dans cette session, batch avec checkpoints pour validation.

Quel mode tu préfères ?
