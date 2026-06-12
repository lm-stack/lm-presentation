# CLAUDE.md - lm-presentation

> ⚠️ UTF-8 obligatoire (accents complets : é, è, à, ç...). Les règles détaillées sont découpées dans `.claude/rules/` (chargées automatiquement) : voir la table « Fichiers de règles » en bas.

## Contexte

Site `slides.lausanne.marketing` qui héberge les présentations Lausanne Marketing (cours, PPT commerciaux, workshops, événements). Astro statique + Reveal.js pour le mode plein écran.

Branding par défaut : Lausanne Marketing (charte calquée sur `lm/`). Les **decks** restent en charte LM. Un **parcours** peut toutefois être basculé en thème ExecEd via `scheme: execed` quand le contexte le justifie (ex. cours HEC ExecEd) : voir `.claude/rules/parcours.md` et `.claude/rules/themes.md`.

Spec : `docs/superpowers/specs/2026-05-07-lm-presentation-design.md`

## Contexte par parcours

Pour chaque parcours, un fichier `docs/parcours/<slug>.md` qui contient : public cible, source brochure, philosophie pédagogique, historique des éditions, choix structurants. À consulter avant de toucher un deck d'un parcours.

Parcours documentés :

- [crm-data-automation](../docs/parcours/crm-data-automation.md) : HEC Lausanne ExecEd, juin 2026

## Stack

- Astro 6 (statique)
- Tailwind CSS v4 via `@tailwindcss/vite`
- MDX pour les fichiers de présentation
- Reveal.js 6 pour le mode plein écran (types embarqués, pas de @types/reveal.js)
- astro-icon + Phosphor Icons
- Cloudflare Pages

## Structure

- `src/components/slides/` : layouts visuels génériques (famille Hero : Cover, Statement, Table, etc.)
- `src/components/SlideTitle.astro` : composant titre unifié, utilisé par tous les slides à contenu
- `src/content/presentations/` : fichiers MDX, un par présentation
- `src/layouts/Deck.astro` : mode présentation (Reveal init)
- `src/layouts/Handout.astro` : mode handout (PDF 1up/2up/3up)
- `src/pages/p/[slug].astro` : route présentation
- `src/pages/p/[slug]/handout/[mode].astro` : route handout
- `source/` : archive originaux (gitignored, jamais publié)

## Commandes

- `npm run dev` : serveur local
- `npm run build` : build statique vers `dist/`
- `npm run preview` : preview du build

## Ne JAMAIS

- Ajouter Sveltia CMS (édition directe en code).
- Mettre des assets PPT/PDF/RAW dans le repo (toujours `source/` gitignored).
- Modifier les slides en mode présentation directement (toujours via MDX + composants).
- Lancer `npm run build` pendant qu'`astro dev` tourne : les deux écrivent dans `.astro/`, le watcher Vite part en boucle de reload (`Failed to load url astro:server-app.js`). Stopper le dev avant un build. Garde-fou en place : `vite.server.watch.ignored` dans `astro.config.mjs`.

## Cache Cloudflare Pages (rename ou suppression de deck)

Les pages HTML de `slides.lausanne.marketing` sont servies avec `Cache-Control: public, s-maxage=604800` : cache **edge Cloudflare Pages de 7 jours**, avec `cf-cache-status=DYNAMIC` (c'est la couche Pages, PAS le cache CDN de zone).

Conséquence quand un deck est renommé ou supprimé : son ancienne URL `/p/<ancien-slug>/` continue de renvoyer **200 avec l'ancienne page jusqu'à 7 jours**, alors même que :

- l'origine renvoie déjà 404 (le vérifier en ajoutant `?cb=<random>` à l'URL : le query bypass le cache et révèle le vrai statut origine) ;
- on a redéployé : un nouveau build ne purge PAS les URLs déjà en cache edge ;
- on fait un « Purge by URL » de zone (dashboard ou API) : ça n'atteint pas la couche Pages, et le token `CF_TOKEN_LM` n'a de toute façon pas le scope Cache Purge.

Options : (1) **laisser expirer** (le plus simple, 7 j max depuis la mise en cache) ; (2) **Redirect Rule de zone** (Rules > Redirect Rules) `/p/<ancien-slug>*` vers la nouvelle URL : elle s'exécute AVANT le cache, donc court-circuite immédiatement la copie périmée.

Constaté 2026-06-04 : `/p/template-execed/` (renommé `template`, commit `c1be3d0`) servait encore l'ancienne page ~2,5 j après le rename.

## Fichiers de règles (`.claude/rules/`)

Chargés automatiquement à chaque session. À respecter pour tout travail sur les decks et les parcours.

| Fichier | Contenu |
|---------|---------|
| `slides.md` | Règles visuelles INTANGIBLES : zone titre `SlideTitle`, centrage vertical (titre fixe en haut), safe area 48px, border-radius 4px, drop-shadows légères, header ExecEd, fond pearl uniforme, sous-titre `SubSection` sur une ligne, titre `Workshop` figé sur « Workshop », slide de fin auto (`Questions` / `Merci`) |
| `conventions.md` | UTF-8, pas d'em-dash dans les slides, nombres CHF suisses (`2'250 CHF`), pas d'emojis, nommage PascalCase / kebab-case |
| `polls.md` | Sondages live `<Poll>` / `<WordCloud>` : workflow présentateur, Cloudflare KV, variable `PUBLIC_LM_POLLS_URL` |
| `themes.md` | Tokens de couleur (schémas LM / ExecEd), règle « pas de hex en dur », frontmatter `scheme` |
| `parcours.md` | Conventions des parcours : dates précises, chaque deck dans un jour (intro/conclusion inclus), `scheme` + `switcher` par parcours |
