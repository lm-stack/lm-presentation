---
date: 2026-05-10
status: draft
title: Génération PDF avec layouts d'export multiples
author: Thomas Rouaud
---

# Génération PDF avec layouts d'export multiples : spec de design

## 1. Contexte et motivation

Aujourd'hui, le bouton "Télécharger" de `Deck.astro` (`src/layouts/Deck.astro:175-179`) ouvre simplement le mode `?print-pdf` natif de Reveal dans un nouvel onglet, laissant l'utilisateur faire `Ctrl+P` puis "Save as PDF" lui-même.

Côté `lm-offres`, un Worker Cloudflare (`workers/lm-signer`) génère déjà des PDF vectoriels via le binding natif Browser Rendering (`@cloudflare/puppeteer`). Cette logique est mélangée avec la signature et l'envoi d'email, ce qui rend `lm-signer` mal nommé.

Objectif : reproduire la même UX one-click + PDF vectoriel sur `lm-presentation`, avec un choix de mise en page proposé dans une modale, et factoriser la génération de PDF dans un worker dédié partagé.

### 1.1 Trois layouts d'export

1. **1up** : 1 slide par page, A4 paysage. Équivalent du `?print-pdf` natif Reveal, mais récupéré directement en PDF binaire sans dialog d'impression.
2. **2up** : 2 slides par page A4 portrait, ratio 16:9 strict, largeur ≈ 190mm, centrées verticalement. Pas de stretch, pas de déformation.
3. **3up + lignes** : 3 slides par page A4 portrait avec une colonne de lignes vierges à droite. Handout participant pour prise de notes manuscrite en cours/workshop.

### 1.2 Hors scope

- **Authentification ou protection des PDF** : les URLs des présentations sont publiques, les PDFs aussi.
- **Custom domain pour `lm-pdf`** : `.workers.dev` brut au démarrage, basculement custom si besoin opérationnel.
- **Notes speaker dans le MDX** : les MDX actuels n'ont pas de `<aside class="notes">`. Le layout 3up traite la colonne de droite comme des lignes vierges manuscrites. Si on ajoute un jour des notes speaker, on créera un layout dédié, sans surcharger 3up.
- **Cache des PDF** : `Cache-Control: no-store`, régénération à chaque demande. Acceptable au volume actuel.
- **Lib JS partagée** entre les sites consommateurs (helper `pdfDownload(url, options)`) : envisageable plus tard si on multiplie les consommateurs.

## 2. Architecture globale

Trois livrables :

### 2.1 `lm-pdf/` (nouveau repo dédié)

Worker Cloudflare générique. Endpoint unique `GET /api/pdf?url=...` qui renvoie un PDF vectoriel généré par Browser Rendering. Aucune connaissance des sites consommateurs : il fait `goto(url) + page.pdf(options)` et retourne le binaire. Tout le styling print vit dans les sites consommateurs (via `@media print` natif).

### 2.2 `lm-presentation/` (modifications)

- Modale au clic sur `#deck-download-btn` proposant les 3 layouts.
- Nouvelle route dynamique `/p/[slug]/handout/[mode]/` (mode = "2" ou "3") qui rend les slides en mise en page handout.
- Layout `Handout.astro` qui arrange les `<section>` slottés en grille print-paginated, sans Reveal.js.

### 2.3 `lm-offres/` (refacto mineure)

- Migration du CSS print actuellement injecté par le worker vers une feuille print native du site.
- Pointage du bouton PDF vers `lm-pdf` au lieu de `lm-signer`.
- Nettoyage de `lm-signer` (retrait de `handlePdfRequest` + binding `BROWSER`).

Conséquence : `lm-signer` redevient ce que son nom dit (signature + email). Le worker `lm-pdf` est réutilisable pour de futurs sites (`lm-diagrams`, autres) sans extension.

## 3. Worker `lm-pdf`

### 3.1 Structure du repo

```
lm-pdf/
├── src/
│   └── index.js
├── wrangler.toml
├── package.json
├── README.md
└── .claude/
    └── CLAUDE.md
```

### 3.2 Contrat API

```
GET /api/pdf?url=<encoded-url>&format=A4&orientation=portrait&margin=0&filename=<slug>
OPTIONS /api/pdf
```

| Param         | Type   | Default    | Validation                                           |
| ------------- | ------ | ---------- | ---------------------------------------------------- |
| `url`         | string | requis     | Absolue, HTTPS, host dans `ALLOWED_HOSTS`            |
| `format`      | string | `A4`       | Regex `^(A[0-6]\|Letter\|Legal\|Tabloid\|Ledger)$`   |
| `orientation` | enum   | `portrait` | `portrait` ou `landscape`                            |
| `margin`      | string | `0`        | Regex permissive `[\d\s]+(mm\|cm\|in\|px)?` × 1 à 4  |
| `filename`    | string | auto       | Sanitized `[a-z0-9-]{1,80}`. Default : pathname slugifié |

### 3.3 Whitelist de hosts

Configurée via `[vars] ALLOWED_HOSTS` dans `wrangler.toml`, parsée en `Set` au démarrage :

```toml
[vars]
ALLOWED_HOSTS = "offre.lausanne.marketing,slides.lausanne.marketing,lm-offres.pages.dev,lm-presentation.pages.dev"
```

Tout host hors liste retourne 403. Pas de wildcard pour éviter le détournement (worker non-authentifié).

### 3.4 Réponses

- **200** : `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="<filename>.pdf"`, `Cache-Control: no-store`, CORS ouvert (`Access-Control-Allow-Origin: *`).
- **400** : url manquante / invalide, `format` / `orientation` / `margin` invalides.
- **403** : host hors whitelist.
- **502** : Browser Rendering en échec.

### 3.5 Logique cœur

```js
import puppeteer from '@cloudflare/puppeteer';

// validation des params...
const browser = await puppeteer.launch(env.BROWSER);
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format,
    landscape: orientation === 'landscape',
    printBackground: true,
    margin: parseMargin(margin),
  });
  return new Response(pdf, { /* headers */ });
} finally {
  await browser.close();
}
```

Pas d'`addStyleTag`, pas de connaissance des sites. Tout le styling est rendu côté site via `@media print`.

### 3.6 `wrangler.toml`

```toml
name = "lm-pdf"
main = "src/index.js"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

[browser]
binding = "BROWSER"

[vars]
ALLOWED_HOSTS = "offre.lausanne.marketing,slides.lausanne.marketing,lm-offres.pages.dev,lm-presentation.pages.dev"
```

### 3.7 Déploiement

`npx wrangler deploy` depuis `lm-pdf/`. Hostname : `lm-pdf.<account>.workers.dev` brut au démarrage, basculement sur custom domain si besoin opérationnel.

## 4. Routes handout côté `lm-presentation`

### 4.1 URL pattern

| Layout       | URL appelée par le worker                                | Mode de rendu       |
| ------------ | -------------------------------------------------------- | ------------------- |
| 1up          | `https://slides.lausanne.marketing/p/<slug>/?print-pdf`  | Reveal natif        |
| 2up          | `https://slides.lausanne.marketing/p/<slug>/handout/2/`  | Custom Astro        |
| 3up + lignes | `https://slides.lausanne.marketing/p/<slug>/handout/3/`  | Custom Astro        |

### 4.2 Fichiers à créer

```
src/pages/p/[slug]/handout/[mode].astro    # route dynamique (mode = "2" | "3")
src/layouts/Handout.astro                  # layout handout sans Reveal.js
src/styles/handout.css                     # styles print spécifiques
```

### 4.3 `src/pages/p/[slug]/handout/[mode].astro`

- `getStaticPaths()` retourne le produit cartésien `presentations × ['2', '3']`.
- Importe le MDX comme `<Content />` (sans son layout natif).
- Wrap dans `<Handout mode={mode} title={...}>...<Content />...</Handout>`.

### 4.4 `src/layouts/Handout.astro`

- Reçoit `mode: '2' | '3'` en prop.
- Pas de Reveal.js (rendu HTML statique paginé par CSS).
- Les `<section>` MDX sont slottés et arrangés via grid CSS.

### 4.5 Mise en page mode 2up

A4 portrait (210mm × 297mm), marges 10mm (zone utile 190mm × 277mm). Slides ratio 16:9 strict, largeur 190mm, hauteur ≈ 107mm. 2 slides par page, centrées verticalement (espace blanc en haut, milieu, bas).

```
┌──────────────────────────┐
│  ┌────────────────────┐  │  slide N (190 × 107)
│  │       16:9         │  │
│  └────────────────────┘  │
│                          │  gap centrant verticalement
│  ┌────────────────────┐  │  slide N+1
│  │       16:9         │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

CSS clé :

```css
@page { size: A4 portrait; margin: 10mm; }
.handout-page {
  page-break-after: always;
  height: 277mm;
  display: grid;
  place-items: center;
  gap: 10mm;
}
.handout-page--2up { grid-template-rows: 1fr 1fr; }
.handout-slide { aspect-ratio: 16/9; width: 100%; }
```

### 4.6 Mise en page mode 3up + lignes

A4 portrait, 2 colonnes (slides 60% / lignes 40%), 3 slides par page.

```
┌──────────────────────────┐
│  ┌──────────┐ ──────────  │  slide N (60% largeur) + lignes (40%)
│  │   16:9   │ ──────────  │
│  └──────────┘ ──────────  │
│  ┌──────────┐ ──────────  │  slide N+1
│  │   16:9   │ ──────────  │
│  └──────────┘ ──────────  │
│  ┌──────────┐ ──────────  │  slide N+2
│  │   16:9   │ ──────────  │
│  └──────────┘ ──────────  │
└──────────────────────────┘
```

Lignes vierges via `repeating-linear-gradient` :

```css
.handout-lines {
  background-image: repeating-linear-gradient(
    transparent,
    transparent 7mm,
    #BBB 7mm,
    #BBB 7.1mm
  );
}
```

### 4.7 Détails à régler à l'implémentation

Non bloquants pour la spec, à arbitrer pendant le plan :

1. **Mécanisme de slot des `<section>` MDX** : `<slot />` Astro standard ou récupération via `Content.compiledContent`. À tester.
2. **Scale des slides Reveal (1920 × 1080) dans le slot handout** : `transform: scale()` calculé depuis la largeur du slot, CSS `zoom`, ou viewport units.
3. **Pagination** : grouper les slides côté Astro au build (loop par paquets de 2 ou 3) ou laisser CSS `break-inside: avoid` faire le travail.
4. **Reveal `?print-pdf` paperSize pour layout 1up** : config Reveal `paperSize: 'A4'` en mode landscape ou accepter les bandes blanches dues au ratio 16:9 vs A4 (1.41:1).

## 5. Modale UX côté `Deck.astro`

### 5.1 Comportement

- Click sur `#deck-download-btn` : `<dialog>` HTML natif via `dialog.showModal()` (focus trap, ESC, backdrop gérés par le navigateur).
- 3 cards côte à côte avec :
  - Mini-aperçu SVG inline 80 × 100px représentant la disposition.
  - Titre : `1 slide / page`, `2 slides / page`, `3 slides + lignes`.
  - Sous-titre orientation : `Paysage`, `Portrait`, `Portrait`.
- Click sur une card : state loading sur la card cliquée (spinner overlay), les 2 autres `disabled`.
- `fetch(workerUrl)` : `blob` → `URL.createObjectURL` → `<a download>` synthétique → close dialog.
- Erreur fetch : message rouge sous les cards, dialog reste ouverte.
- Mobile : cards en colonne (1 par ligne), même UX.

### 5.2 Naming des fichiers téléchargés

Convention "n-up" standard pour les handouts :

- Layout 1up : `<slug>-1up.pdf`
- Layout 2up : `<slug>-2up.pdf`
- Layout 3up : `<slug>-3up-notes.pdf`

### 5.3 Accessibilité

- `<dialog aria-labelledby="pdf-modal-title">` avec `<h2 id="pdf-modal-title">` interne.
- Cards = `<button type="button">`, jamais `<div>` cliquables.
- Focus trap, ESC, backdrop : gérés nativement par `<dialog>`.
- Focus initial sur la première card après `showModal()`.
- Restauration du focus sur `#deck-download-btn` au close (comportement natif).

### 5.4 Fichiers

```
src/components/deck/PdfModal.astro       # nouveau composant
src/styles/slides.css                    # ajouter les styles modale (réutiliser pattern .deck-menu existant)
src/layouts/Deck.astro                   # remplacer le handler downloadBtn par openPdfModal()
```

## 6. Migration `lm-offres`

### 6.1 Étapes

**1. Déplacer le CSS print du worker vers le site**

Le bloc `PDF_HIDE_CHROME_CSS` actuel (`workers/lm-signer/src/index.js:205-216`) devient un `@media print` natif dans `src/styles/print.css` :

```css
@media print {
  .no-print, .barre-signer, .offre-toolbar, .offre-menu-pill, .offre-menu {
    display: none !important;
  }
  body { background: #FFFFFF !important; }
  .page-sheet {
    margin: 0 auto !important;
    box-shadow: none !important;
  }
}
```

Le navigateur l'applique nativement quand Puppeteer fait `page.pdf()` (mode print détecté).

**2. Pointer le bouton PDF vers `lm-pdf`**

Composant `BoutonPDF.astro` (à localiser dans `src/components/offres/mdx/`) : remplacer l'appel `<lm-signer-host>/api/pdf?url=...` par `<lm-pdf-host>/api/pdf?url=...&format=A4&orientation=portrait&filename=offre-<slug>`.

**3. Nettoyer `lm-signer`**

- Retirer `handlePdfRequest` (`workers/lm-signer/src/index.js:218-270`) et l'import `@cloudflare/puppeteer`.
- Retirer `[browser]` dans `wrangler.toml`.
- Retirer la dépendance `@cloudflare/puppeteer` du `package.json`.
- `npx wrangler deploy`.

### 6.2 Rollback

Les 3 commits sont indépendants et reversables. Si un problème surgit après bascule :

- Reverter le commit "pointer URL" rétablit le routage vers `lm-signer` (qui contient encore l'endpoint si on n'a pas encore reverté l'étape 3).
- Garder l'étape 3 en dernier (et la déployer après validation des étapes 1-2 en prod) limite la fenêtre où un rollback nécessite plusieurs reverts.

## 7. Plan de déploiement

Ordre destiné à minimiser le risque sur `lm-offres` (déjà en production) :

1. **Deploy `lm-pdf`** : worker indépendant, testable seul via `curl` direct.
2. **Update `lm-offres`** : déplacer CSS + pointer URL → deploy Pages.
3. **Vérifier** : bouton PDF `lm-offres` fonctionne via `lm-pdf` (texte sélectionnable, chrome masqué, marges identiques).
4. **Update `lm-signer`** : retirer endpoint + binding → deploy.
5. **Implémenter modale + routes handout** dans `lm-presentation` → deploy.

Les étapes 1 à 4 stabilisent la plomberie partagée avant l'ajout des nouvelles fonctionnalités côté `lm-presentation`. Si l'étape 5 introduit un bug, `lm-offres` n'est pas impacté.

## 8. Tests / validation

- [ ] `lm-offres` : PDF identique avant/après bascule (texte sélectionnable, marges, masquage du chrome `.no-print`).
- [ ] `lm-presentation` : modale s'ouvre, ferme, ESC, backdrop, focus trap fonctionnent.
- [ ] Layout 1up sur `crm-data-automation` : PDF paysage 1 slide / page.
- [ ] Layout 2up : 2 slides A4 portrait, ratio 16:9 strict, centrées verticalement, pas de déformation.
- [ ] Layout 3up + lignes : 3 slides + colonne lignes vierges, lignes correctement tracées (espacement 7mm).
- [ ] Filename auto correct (`<slug>-1up.pdf`, `<slug>-2up.pdf`, `<slug>-3up-notes.pdf`).
- [ ] Quotas Browser Rendering free tier suffisants après une dizaine de tests (vérifier dashboard CF).
- [ ] Mobile : modale s'affiche en colonne, cards lisibles, télécharge bien sur iOS et Android.

## 9. Liens utiles

- Repo `lm-pdf` (à créer) : `../lm-pdf/`
- Repo `lm-offres` (refacto) : `../lm-offres/`
- Worker existant `lm-signer` : `../lm-offres/workers/lm-signer/`
- CLAUDE.md `lm-presentation` : `.claude/CLAUDE.md`
- Spec initiale `lm-presentation` : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`
- Documentation Cloudflare Browser Rendering : https://developers.cloudflare.com/browser-rendering/
- Documentation Reveal.js print-pdf : https://revealjs.com/pdf-export/
