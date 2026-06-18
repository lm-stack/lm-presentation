---
name: pdf
description: Use when the user wants to export a deck or a whole parcours from lm-presentation to PDF (1 slide per page) — triggers like "/pdf", "exporte ... en pdf", "pdf du deck ...", "pdf du parcours ...", "génère le pdf de ...". The user DESCRIBES the deck or parcours in natural language (not necessarily the exact slug); resolve it to slug(s) and run the export into the gitignored pdf/ folder, overwriting previous exports.
---

# /pdf — Export PDF des slides (1 slide par page)

Exporte un deck (ou tous les decks d'un parcours) en PDF « 1 slide par page » (mode 1up, paysage 16:9), vers le dossier `pdf/` à la racine du repo. Écrase systématiquement les versions précédentes.

L'utilisateur **décrit** le deck ou le parcours en langage naturel (ex. « le deck sur la collecte de données », « le parcours CRM Data »). À toi de résoudre la description vers le bon slug.

## Étapes

### 1. Résoudre la cible (description → slug(s))

- **Deck** : un fichier `src/content/presentations/<slug>.mdx` = un slug (le nom de fichier). Lis les frontmatter `title` (et `subtitle`) des decks pour faire correspondre la description. Ex. « collecte de données » → `collecte-donnees`.
- **Parcours** : `src/content/parcours/<slug>.mdx`. Si la demande vise un parcours, lis son frontmatter et récupère la **liste ordonnée des decks** (clé `decks`, ou en aplatissant `days[].decks`). On exportera **tous** ces decks.
- Si la correspondance est **ambiguë** (plusieurs candidats plausibles) ou **introuvable** : demande à l'utilisateur de préciser, ne devine pas.
- Si elle est **claire** : annonce le(s) deck(s) résolu(s) (slug + titre) puis continue. Le build prend quelques minutes, autant viser juste.

### 2. Garantir le .gitignore

`pdf/` doit être gitignoré (ce sont des artefacts locaux). S'il n'y figure pas, l'ajouter à `.gitignore`. (Normalement déjà présent.)

### 3. Lancer l'export

⚠️ Couper d'abord tout `astro dev` / `npm run dev` en cours : le build du script entre en conflit avec le watcher Vite (cf. CLAUDE.md « Ne JAMAIS »).

- **Un deck seul** (sortie `pdf/<slug>.pdf`) :
  ```bash
  node scripts/export-pdf.mjs --slugs <slug>
  ```
- **Un parcours** (un PDF par deck, dans un sous-dossier au nom du parcours → `pdf/<parcours>/<deck>.pdf`) :
  ```bash
  node scripts/export-pdf.mjs --slugs <slug1,slug2,slug3,...> --subdir <parcours-slug>
  ```

Le script gère tout le cycle : `npm run build` → preview local → export Puppeteer (Chrome) de chaque deck en mode 1up → arrêt du preview.

Notes d'exécution :
- **Windows / bash** : si `node` n'est pas trouvé, préfixer `export PATH="$PATH:/c/Program Files/nodejs"`.
- **Chrome** attendu à `C:\Program Files\Google\Chrome\Application\chrome.exe` (override via `PUPPETEER_EXECUTABLE_PATH`).
- **Re-export rapide** sans rebuild (si `dist/` est déjà à jour) : ajouter `--no-build`.
- Un slug introuvable fait échouer ce deck avec un message explicite (HTTP 404 sur la route handout).

### 4. Rapport

Lister les PDF produits avec leur chemin sous `pdf/`.

## Hors scope

- Le mode est **fixé à 1 slide/page** (1up). Les handouts 2up/3up (avec lignes de notes) restent gérés par `scripts/build-handouts.mjs` (pipeline CI séparé qui pousse vers R2) : ne pas confondre.
- `pdf/` est **local et gitignoré** : les exports ne sont jamais commités.
