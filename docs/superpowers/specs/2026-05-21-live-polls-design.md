---
date: 2026-05-21
status: draft
title: Sondages live façon AhaSlides : QCM et nuage de mots
author: Thomas Rouaud
---

# Sondages live façon AhaSlides : spec de design

## 1. Contexte et motivation

`lm-presentation` est aujourd'hui un site statique sur Cloudflare Pages qui sert des présentations Reveal.js générées depuis MDX. Aucun backend dynamique, aucune interaction temps réel avec l'audience.

Pour les cours en formation continue (HEC, intra-entreprise), un outil de sondage live façon Mentimeter / AhaSlides / Slido manque : afficher une question sur le slide, les participants scannent un QR code avec leur téléphone, votent, et le graphique sur le slide bouge en temps quasi-réel.

Objectif : implémenter cette feature avec deux types de sondages (QCM et nuage de mots), dans le respect de la charte LM, en restant dans le stack Cloudflare existant.

### 1.1 Cas d'usage

1. **QCM** (choix unique parmi 2 à 6 options) : sondage d'opinion, quiz simple sans bonne réponse. Visualisation par barres horizontales animées.
2. **Nuage de mots** : prompt ouvert, participants envoient un mot ou expression courte. Visualisation par nuage où la taille du mot grandit avec la fréquence.

Les questions sont définies dans le MDX du deck, comme tous les autres composants slides (`<Cover>`, `<Section>`, etc.). Pas de dashboard d'édition séparé.

Audience cible : moins de 50 participants par session (formation typique). Latence acceptable : jusqu'à 1.7s entre vote et rafraîchissement du graphique (polling HTTP 1.5s).

### 1.2 Hors scope v1

- **Authentification présentateur** : le deck est privé (URL non listée), confiance assumée.
- **Modération du nuage de mots** : les réponses sont affichées telles que reçues. Pas de filtre, pas de blocklist.
- **Échelle Likert, sondages multi-réponses, ranking** : QCM choix unique uniquement.
- **Export CSV des votes** : si besoin, copie manuelle des chiffres depuis le slide.
- **Historique des snapshots** : un seul snapshot persistant par poll, le dernier figé écrase l'ancien.
- **Dashboard de management** : pas de liste des sondages, pas d'admin UI.
- **Notifications push** : pas de relance vers les participants.
- **Auth des votants** : anonyme. Anti-double-vote QCM via hash IP+UserAgent, pas étanche mais suffisant.
- **WebSocket / Server-Sent Events** : polling HTTP 1.5s validé, suffisant à l'échelle visée.
- **Audiences 50+** : si besoin un jour, migration vers SSE ou WebSocket (Durable Objects supportent les deux nativement).

## 2. Architecture globale

Deux livrables :

### 2.1 `lm-polls/` (nouveau repo dédié)

Worker Cloudflare générique pour les sondages live. Calqué sur l'architecture de `lm-pdf/` (worker isolé, whitelist d'origines, déploiement Cloudflare Pages-compatible).

- **Cloudflare Workers** + **Durable Objects** pour l'état temps réel des sessions actives (un DO par token).
- **Cloudflare KV** pour la persistence des snapshots figés (lecture publique, écriture déclenchée au freeze).
- Vitest pour les tests des helpers (validation payload, hash voter, génération code court).

### 2.2 `lm-presentation/` (modifications)

- Deux nouveaux composants slides : `<Poll>` (QCM) et `<WordCloud>` (nuage de mots).
- Nouvelle route `src/pages/v/[token].astro` : page mobile où les participants votent.
- QR code généré côté JS sur la slide via la lib `qrcode-generator` (ajoutée en dépendance, ~5 KB).
- Polling HTTP 1.5s du slide présentateur vers le worker.
- Boutons "Démarrer", "Figer", "Reset" rendus sur la slide elle-même.

## 3. Worker `lm-polls`

### 3.1 Structure du repo

```
lm-polls/
├── src/
│   ├── index.js           # Worker entry, routing
│   ├── poll-do.js         # Durable Object class
│   ├── handlers/
│   │   ├── init.js        # POST /api/poll/init
│   │   ├── info.js        # GET  /api/poll/:token/info
│   │   ├── vote.js        # POST /api/poll/:token/vote
│   │   ├── results.js     # GET  /api/poll/:token/results
│   │   ├── freeze.js      # POST /api/poll/:token/freeze
│   │   ├── reset.js       # POST /api/poll/:token/reset
│   │   └── snapshot.js    # GET  /api/snapshot/:deckSlug/:pollId
│   └── lib/
│       ├── code.js        # generateShortCode (6 chars, sans 0/O/I/1/L)
│       ├── hash.js        # hashVoter (SHA256 IP+UA)
│       ├── validate.js    # validateInitPayload, normalizeWord
│       └── cors.js        # CORS + origin whitelist
├── test/
│   ├── code.test.js
│   ├── hash.test.js
│   └── validate.test.js
├── wrangler.toml
├── package.json
└── README.md
```

### 3.2 Endpoints

| Méthode | Path | Auth | Body in | Body out |
|---|---|---|---|---|
| `POST` | `/api/poll/init` | Origin whitelist | `{ deckSlug, pollId, type, question, options? }` | `{ token }` |
| `GET` | `/api/poll/:token/info` | Public (CORS *) | — | `{ type, question, options? }` |
| `POST` | `/api/poll/:token/vote` | Public (CORS *) | QCM: `{ choice: number }` · Word: `{ word: string }` | `{ ok: true }` ou 4xx |
| `GET` | `/api/poll/:token/results` | Origin whitelist | — | `{ votes, total, frozen }` |
| `POST` | `/api/poll/:token/freeze` | Origin whitelist | — | `{ ok: true }` |
| `POST` | `/api/poll/:token/reset` | Origin whitelist | — | `{ ok: true }` |
| `GET` | `/api/snapshot/:deckSlug/:pollId` | Public (CORS *) | — | snapshot JSON ou 404 |

**Origin whitelist** : variable `ALLOWED_HOSTS` dans `wrangler.toml`, valeur initiale `slides.lausanne.marketing,lm-presentation.pages.dev,localhost:4321`.

**CORS** : préflight OPTIONS géré pour tous les endpoints. Endpoints publics → `Access-Control-Allow-Origin: *`. Endpoints whitelist → `Access-Control-Allow-Origin: ${origin}` si dans la liste, 403 sinon.

### 3.3 Modèle de données du Durable Object

État en mémoire, sérialisé via `state.storage` Cloudflare (persistence au cas où Cloudflare réveille un DO récemment endormi) :

```ts
interface PollState {
  type: 'choice' | 'word';
  question: string;
  options?: string[];                  // QCM uniquement, 2 à 6 entrées
  votes: Record<string, number>;       // QCM: { '0': 12, '1': 8 } · Word: { 'innovation': 5, 'agile': 3 }
  voters: Set<string>;                 // hash(IP+UA), QCM uniquement (sérialisé en Array dans state.storage)
  frozen: boolean;
  deckSlug: string;
  pollId: string;
  createdAt: number;                   // unix ms
}
```

**Lifecycle** :

- `POST /api/poll/init` crée le DO via `env.POLL_DO.idFromName(token)` (token = code court 6 chars généré), initialise l'état.
- `POST /api/poll/:token/vote` route vers le DO via `env.POLL_DO.get(idFromName(token))`.
- `state.storage.put('state', state)` après chaque mutation pour survivre à un eviction.
- `state.storage.setAlarm(Date.now() + 60_000)` réinitialisé après chaque request : si l'alarme tire (60s sans activité), le DO efface son état storage et s'éteint. Cloudflare le supprime ensuite.

### 3.4 Persistence KV (snapshots figés)

Binding `POLL_KV` dans `wrangler.toml`.

- **Clé** : `${deckSlug}/${pollId}` (un seul snapshot par couple, écrasement à chaque freeze)
- **Valeur** : JSON stringifié `{ type, question, options, votes, frozenAt: ISOString }`
- **TTL** : aucun (snapshots persistent indéfiniment, conformément au "à jamais pour tous")
- **Écriture** : uniquement déclenchée par `POST /api/poll/:token/freeze`, depuis le DO via le binding KV
- **Lecture** : endpoint `GET /api/snapshot/:deckSlug/:pollId`, public

### 3.5 Sécurité

- **Origin whitelist** sur les endpoints sensibles (`init`, `results`, `freeze`, `reset`) : check du header `Origin` contre `ALLOWED_HOSTS`. 403 sinon.
- **Rate limit IP** : 10 votes/min/IP (compteur en mémoire DO, suffisant à l'échelle visée). Au-delà → 429.
- **Validation payload `init`** :
  - `type ∈ {'choice','word'}`
  - `question`: string, 1 à 200 chars
  - `options` (si type=choice): array de strings, 2 à 6 entrées, chacune 1 à 60 chars
  - `deckSlug`, `pollId`: regex `/^[a-z0-9-]+$/`, 1 à 50 chars
- **Validation payload `vote`** :
  - QCM: `choice` ∈ `[0, options.length - 1]`
  - Word: `word` string trim, normalize (lowercase, NFD), 1 à 30 chars après trim
- **Anti-double-vote QCM** : hash SHA256 tronqué de `IP + UserAgent`. Set des hashes dans le DO. 409 Conflict si déjà voté.
- **Pas de logs PII** : on ne log jamais d'IP ou UA en clair (seulement le hash si nécessaire pour debug).

## 4. Frontend `lm-presentation`

### 4.1 Composants `<Poll>` et `<WordCloud>`

**`<Poll>`** :

```mdx
<Poll
  id="vote-clarte"
  question="Cette session t'a paru ?"
  options={[
    "Très claire",
    "Claire",
    "Confuse par moments",
    "Très confuse",
  ]}
/>
```

Props :
- `id` (required) : `string`, slug stable (sert de `pollId` dans le token et la clé KV)
- `question` (required) : `string`, 1 à 200 chars
- `options` (required) : `string[]`, 2 à 6 entrées
- `subtitle` (optional) : `string`, affiché sous la question avant le divider gold
- `highlight` (optional) : `string`, partie du sous-titre à souligner gold

**`<WordCloud>`** :

```mdx
<WordCloud
  id="mots-cles"
  question="En un mot, qu'est-ce que tu retiens ?"
/>
```

Props :
- `id` (required)
- `question` (required)
- `subtitle`, `highlight` (optional)

### 4.2 Page mobile `/v/[token].astro`

Route dynamique Astro, rendue côté client (le contenu réel est chargé via fetch après mount).

Structure :
- Header sticky 60px : "Lausanne Marketing" + indicateur état (vert vote ouvert, rouge vote fermé)
- Body : selon état (vote ouvert QCM, vote ouvert WordCloud, après vote, vote fermé, deck non démarré)
- Pas de footer, pas de menu, pas de chrome (page volontairement minimaliste)

Le composant JS au mount :
1. Lit `:token` depuis l'URL
2. `GET /api/poll/${token}/info` :
   - 200 → render formulaire selon `type`
   - 404 → "Sondage non démarré"
   - 423 → "Vote terminé"
3. Submit :
   - QCM : `POST /api/poll/${token}/vote { choice }`. Si 200 → écran de remerciement. Si 409 (déjà voté) → "Tu as déjà voté".
   - WordCloud : `POST /api/poll/${token}/vote { word }`. Si 200 → reset input + message "Envoyé", le user peut renvoyer.

### 4.3 QR code et URL courte

- Bibliothèque : `qrcode-generator` (npm), ~5 KB minified.
- QR généré au mount du composant slide, contient l'URL complète `https://slides.lausanne.marketing/v/${token}`.
- Sous le QR : code court en gros (Space Grotesk 700 80px, letter-spacing 0.15em) pour saisie manuelle.
- Sous le code court : URL en clair (Hanken Grotesk 500 22px gris) pour ceux qui veulent taper l'URL complète.

### 4.4 États de la slide

Une slide poll a 4 états possibles :

| État | Trigger | Affichage |
|---|---|---|
| **Initial** | Premier rendu, pas de token en sessionStorage, pas de snapshot KV | Grand bouton centré "Démarrer le sondage" + question affichée en header. Si snapshot KV existe → preview discrète "Session précédente disponible" |
| **Live** | Token en sessionStorage, polling actif | Question + QR + URL + code + graphique en temps réel + boutons "Figer" / "Reset" |
| **Frozen** | Token frozen=true (via polling result ou par snapshot KV chargé) | Question + graphique figé + badge "Vote terminé" + bouton "Reset" pour relancer une session |
| **Archived** | Pas de session active, snapshot KV présent | Identique à Frozen, mais sans bouton Reset (mode lecture pure). Détection : `sessionStorage` vide + `GET /api/snapshot/...` 200. |

## 5. Flux et identifiants

### 5.1 Token court

- 6 caractères, alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31 chars, sans `0/O/I/1/L`)
- Espace combinatoire : 31⁶ ≈ 887M, collisions négligeables pour <50 sessions simultanées
- Génération côté worker dans `POST /api/poll/init` via `crypto.getRandomValues`
- Check collision : `env.POLL_DO.idFromName(candidate)` puis lecture storage. Si état existe, régénère. Worst case ~2-3 itérations.

### 5.2 Snapshot KV

- Écrit à chaque freeze (écrasement).
- Lu par n'importe quelle slide qui s'ouvre sans token actif, pour afficher les derniers résultats archivés.
- Pas de TTL : reste tant que l'utilisateur ne refait pas freeze (ou ne purge pas KV manuellement).

### 5.3 Workflow présentateur

```
Premier rendu de la slide
  ├─ sessionStorage['poll-${pollId}-token'] ?
  │   ├─ Vide → GET /api/snapshot/${deckSlug}/${pollId}
  │   │         ├─ 200 → état Archived (lecture seule, bouton "Nouvelle session")
  │   │         └─ 404 → état Initial (bouton "Démarrer le sondage")
  │   └─ Présent → GET /api/poll/${token}/info
  │                 ├─ 200 → état Live (polling lance), ou Frozen si frozen=true
  │                 └─ 404/423 → token mort, vider sessionStorage, retour à Initial

Clic "Démarrer" (Initial)
  ├─ POST /api/poll/init { deckSlug, pollId, type, question, options }
  ├─ Reçoit { token }
  ├─ sessionStorage.setItem('poll-${pollId}-token', token)
  └─ Render QR + URL + polling lance → état Live

Clic "Figer" (Live)
  ├─ POST /api/poll/${token}/freeze
  ├─ Polling continue mais reçoit { frozen: true }
  └─ État passe à Frozen, QR grisé, bouton "Reset" disponible

Clic "Reset" (Live ou Frozen)
  ├─ POST /api/poll/${token}/reset
  ├─ DO wipe votes + voters + frozen=false
  └─ Retour à Live avec MÊME token (QR et URL inchangés)
```

### 5.4 Workflow visiteur ordinaire

Visiteur qui ouvre le deck en mode lecture (post-cours) :
- `sessionStorage` vide (autre browser/onglet)
- `GET /api/snapshot/${deckSlug}/${pollId}` :
  - 200 → état Archived, lecture seule
  - 404 → état Initial avec un message "Sondage non démarré"

Important : pas d'auto-init du DO. Sinon n'importe quel visiteur créerait une session parasite avec son propre QR.

### 5.5 Workflow mobile

```
Arrivée sur /v/${token} (via QR scan ou saisie manuelle URL/code)
  ├─ GET /api/poll/${token}/info
  │   ├─ 200 → render formulaire selon type
  │   ├─ 404 → "Sondage non démarré, demande à l'animateur"
  │   └─ 423 → "Vote terminé"

Submit vote
  ├─ POST /api/poll/${token}/vote { choice ou word }
  │   ├─ 200 → écran "Merci pour ton vote" (QCM) ou "Envoyé, propose-en un autre" (Word)
  │   ├─ 409 → "Tu as déjà voté" (QCM uniquement)
  │   ├─ 423 → "Vote fermé entre-temps"
  │   ├─ 429 → "Trop de tentatives, attends une minute"
  │   └─ 4xx/5xx → "Erreur, retoucher pour réessayer"
```

## 6. Layout visuel

### 6.1 Slide Poll (1920×1080)

**Zone titre** (pattern unifié `SlideTitle`) :
- `h2` question : Hanken Grotesk 800, 56px, centré
- `slide-subtitle` (optionnel) : Hanken Grotesk 500, 24px, gris #6B6F84
- `slide-divider` : barre gold 80×3px centrée
- Marges 4px (titre → sous-titre) et 32px (sous-titre → divider)

**Body, 2 colonnes** (60% / 40%) :

**Colonne gauche — graphique barres horizontales** :
- 2 à 6 barres selon `options.length`, gap 24px
- Chaque barre :
  - Label option à gauche : Hanken Grotesk 800, 28px, noir #191919, width fixe 280px
  - Barre gold #FFD838 : hauteur 56px, border-radius 6px, width proportionnelle au total (`width: ${(count/max)*100}%`)
  - Count à droite de la barre : Space Grotesk 700, 24px, noir
- Animation barre : `transition: width 400ms ease-out`
- Nouveau vote : flash gold opacité 0.4 → 0 sur 600ms via animation CSS one-shot

**Colonne droite — QR + URL + boutons** :
- QR code 420×420 centré, noir sur fond crème #FAF8F3, border 1px noir
- Code court sous le QR : Space Grotesk 700, 80px, letter-spacing 0.15em, noir
- URL complète sous le code : Hanken Grotesk 500, 22px, gris #6B6F84
- Compteur de votes : Space Grotesk 700, 18px, sous l'URL, format "12 votes"
- Pill de boutons en bas à droite de la colonne : fond blanc, border 1px gris, padding 6px, 2 boutons icônes 40×40 (Figer + Reset en Live, Reset seul en Frozen)

**État Initial** :
- À la place de la colonne droite, un grand bouton centré : "Démarrer le sondage" (Hanken Grotesk 800, 28px, fond gold #FFD838 sur noir, padding 24px 48px, border-radius 12px)

**État Frozen** :
- QR remplacé par badge `<div class="poll-frozen-badge">Vote terminé</div>` (gold sur noir, Hanken 800 36px)
- URL grisée et barrée
- Watermark "FIGÉ" en diagonale 8% opacité sur la zone QR

### 6.2 Slide WordCloud (1920×1080)

Identique à Poll côté zone titre + colonne droite (QR, URL, boutons).

**Colonne gauche — nuage de mots** :
- Container 1100×700 flex-wrap centered, gap 16px
- Chaque mot dans un `<span>` :
  - Hanken Grotesk 800
  - `font-size: clamp(28px, 28px + count * 6px, 96px)` (1 vote = 34px, 10 votes = 88px, plafonné à 96)
  - Couleur cyclique : index `i % 3` → gold #FFD838 / noir #191919 / gris #6B6F84
- Animation à l'apparition : `transform: scale(0) → scale(1)` 400ms cubic-bezier spring
- Maximum 30 mots affichés (les 30 plus fréquents, tri descending), au-delà discardés visuellement

### 6.3 Page mobile

**Header sticky** (60px) :
- Fond crème #FAF8F3, border-bottom 1px gris
- "Lausanne Marketing" : Hanken Grotesk 700, 16px, noir, à gauche, padding 16px
- Indicateur état à droite : pastille 12px (vert #22C55E vote ouvert, rouge #EF4444 vote fermé) + texte

**Body** (padding 24px) :

**Vote ouvert QCM** :
- Question : Hanken Grotesk 800, 28px, noir, margin-bottom 32px
- Liste verticale de boutons (1 par option) :
  - Largeur 100%, hauteur 72px
  - Hanken Grotesk 700, 18px
  - Border 2px noir, border-radius 12px, fond blanc, padding 16px 24px, text-align left
  - Active state (tap) : fond gold #FFD838, instant (pas de transition pour réactivité)
  - Gap 12px entre boutons
- Submit auto au tap (pas de bouton "Confirmer" séparé)

**Vote ouvert WordCloud** :
- Question identique
- Input texte large :
  - Hauteur 60px, padding 16px, Hanken Grotesk 500 18px
  - Border 2px noir, border-radius 12px
  - Placeholder "Un mot ou une expression"
  - `maxlength="30"` HTML + check JS
- Bouton "Envoyer" sous l'input :
  - Largeur 100%, hauteur 60px
  - Fond noir #191919, texte gold #FFD838, Hanken Grotesk 800 18px
  - Désactivé si input vide ou >30 chars

**Après vote QCM** :
- Centré verticalement : icône check vert 64×64 + "Merci pour ton vote !" Hanken 700 28px
- En dessous : "Tu as voté pour : *${optionChoisie}*" Hanken 500 18px gris

**Après vote WordCloud** :
- Icône check vert + "Réponse envoyée !"
- Bouton "Envoyer un autre mot" qui reset l'input et reste sur la page

**Vote fermé** :
- Icône cadenas 64×64 + "Le vote est terminé. Merci pour ta participation !"
- Pas de formulaire

**Sondage non démarré** :
- Icône horloge + "Sondage non démarré. Demande à l'animateur de lancer le vote."

## 7. Edge cases

| Scénario | Comportement |
|---|---|
| Présentateur recharge la page pendant la session | Token en sessionStorage récupéré, `GET /info` valide. Si DO mort entre temps (rare car polling 1.5s le maintient en vie) → 404, JS affiche "Session expirée, redémarrer ?" et propose nouvelle init. |
| DO killed Cloudflare après inactivité 60s+ | Si freeze a été fait avant → snapshot KV persiste, slide affiche état figé. Sinon, votes perdus, présentateur doit redémarrer. Compromis "éphémère" assumé. |
| Vote arrive pile au moment du freeze | DO test `frozen===true` atomically dans `POST /vote`. Si déjà frozen → 423 Locked, mobile affiche "Vote fermé". |
| Network error côté mobile | Pas de retry automatique (risque de double-vote). Affiche "Erreur réseau, retoucher pour réessayer" avec bouton. |
| Network error côté présentateur (polling) | Polling échoue silencieusement, retry au tick suivant. Après 5 échecs consécutifs → badge "Connexion perdue" sur la slide, retry continue. |
| 2 présentateurs ouvrent le même deck en même temps | Chacun clique Démarrer → 2 sessions parallèles, 2 QR différents. Pas de conflit technique, juste 2 sondages isolés. |
| Token collision | Probabilité ~10⁻⁷. Worker régénère le code si DO existe déjà. |
| Payload malformé sur POST /init | Validation stricte, retour 400 avec message d'erreur. |
| Vote nuage de mots vide ou trop long | Côté JS mobile + côté worker : trim + check `1 ≤ length ≤ 30`. Normalize (lowercase, NFD). |
| Snapshot KV manquant attendu | `GET /api/snapshot/...` → 404 → mode "non démarré" affiché. |
| Rate limit dépassé | 10 votes/min/IP côté worker, 429 sinon. |
| Tampering : appeler /freeze sans token valide | Origin whitelist + check token existe, 403/404 sinon. |
| Tampering : appeler /reset depuis le mobile | Check `Sec-Fetch-Site: same-origin` + `Origin` whitelist côté worker. Endpoints reset/freeze refusés si pas appel depuis page slide. Pas étanche (header forgeable hors browser) mais suffisant en v1 pour usage privé. |

## 8. Testing

### 8.1 Worker `lm-polls`

- **Unit tests** (vitest, calqué sur `lm-pdf`) : `generateShortCode`, `hashVoter`, `validateInitPayload`, `normalizeWord`, parseurs CORS.
- **Integration tests** : `wrangler dev` local + appel des endpoints via fetch dans les tests. Couvre les flux init → vote → freeze → snapshot → reset.
- **Manual smoke test** : 2 onglets (présentateur sur localhost:4321 + mobile via ngrok ou IP locale).

### 8.2 Frontend `lm-presentation`

Manuel uniquement en v1. Charte LM + animations difficiles à tester unitairement, ROI faible pour usage privé.

Scénarios à valider :
- Démarrer → voter depuis téléphone → graphique bouge en moins de 2s
- Freeze → quitter slide → revenir → état figé conservé
- Reset → nouvelle session → voter → OK
- Recharger page présentateur → reprend l'état (token sessionStorage)
- Double-vote QCM rejeté
- Nuage de mots : multi-votes acceptés, mot vide rejeté côté UI
- Mode lecture du deck post-cours (sessionStorage vide) → snapshot affiché
- Mode plein écran : boutons sur la slide restent accessibles
- Layout responsive page mobile : iPhone SE, iPhone Pro Max, Pixel
- Token saisi manuellement au lieu du QR scan : URL `/v/AB7XKQ` arrive correctement

### 8.3 Observabilité

- `console.log` côté worker (visible via `wrangler tail`)
- `console.error` côté frontend (logs locaux)
- Pas de Sentry, pas de metrics dashboard en v1

## 9. Déploiement

### 9.1 Worker `lm-polls`

1. Création repo `lm-polls/` (template basé sur `lm-pdf/`)
2. `wrangler.toml` :
   ```toml
   name = "lm-polls"
   main = "src/index.js"
   compatibility_date = "2026-01-01"
   workers_dev = true

   [[durable_objects.bindings]]
   name = "POLL_DO"
   class_name = "PollDO"

   [[kv_namespaces]]
   binding = "POLL_KV"
   id = "<créé via wrangler kv namespace create lm-polls-snapshots>"

   [vars]
   ALLOWED_HOSTS = "slides.lausanne.marketing,lm-presentation.pages.dev,localhost:4321"
   ```
3. Création KV namespace : `wrangler kv namespace create lm-polls-snapshots`
4. Migration Durable Object : déclaration dans `wrangler.toml`, run `wrangler deploy`
5. Deploy initial : `wrangler deploy`
6. Health check : `curl https://lm-polls.<user>.workers.dev/` retourne `{ name: 'lm-polls', version: '0.1.0' }`

### 9.2 Frontend `lm-presentation`

1. Ajout dépendance `qrcode-generator` : `npm install qrcode-generator`
2. Variable d'env pour l'URL worker : `PUBLIC_LM_POLLS_URL` dans `.env` et dans les variables d'environnement Cloudflare Pages
3. Création composants `<Poll>` et `<WordCloud>` dans `src/components/slides/`
4. Création route `src/pages/v/[token].astro`
5. Update `template.mdx` pour ajouter 2 exemples (1 Poll + 1 WordCloud) pour valider en dev
6. Update CSP dans `public/_headers` : ajouter `lm-polls.<user>.workers.dev` à `connect-src`
7. Test local via `npm run dev` + mobile via ngrok
8. Deploy via push sur main (Cloudflare Pages CI)

### 9.3 Documentation

- `lm-polls/README.md` : usage, endpoints, déploiement
- `lm-polls/.claude/CLAUDE.md` : contexte, conventions, ne pas mélanger avec lm-pdf
- Update `lm-presentation/.claude/CLAUDE.md` : ajouter section "Sondages live" expliquant `<Poll>`, `<WordCloud>`, le workflow présentateur, la variable d'env `PUBLIC_LM_POLLS_URL`
- Update `lm-presentation/README.md` : mentionner la feature en intro

### 9.4 Implémentation visuelle des composants

Le développement des composants `<Poll>` et `<WordCloud>` peut bénéficier du skill `superpowers:frontend-design` s'il est installé dans la session. Sinon, développement itératif classique via `npm run dev` avec validation visuelle en direct.

Le layout est décrit en détail en section 6 et doit respecter le pattern unifié `SlideTitle` + la charte LM existante (couleurs, polices, espacements).
