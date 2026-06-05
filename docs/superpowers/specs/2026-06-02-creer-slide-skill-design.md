# Skill `creer-slide` : design

- **Date** : 2026-06-02
- **Statut** : validé (design), à implémenter
- **Type** : skill Claude Code repo-local (`lm-presentation`)

## Objectif

Outiller l'écriture de slides dans `lm-presentation` pour qu'un slide soit produit correctement du premier coup : bon layout, props remplies selon les conventions LM, inséré au bon endroit du deck, et rendu vérifié. Capturer ce qui a fait tâtonner en pratique (choix du composant, `italicPart`, recadrage d'image, accents, ordre des slides) pour ne plus le refaire.

## Périmètre

Inclus :
1. Écrire un slide avec les **composants existants** (le cœur).
2. Créer un **nouveau composant de layout** uniquement si aucun existant ne convient, dans le respect des RÈGLES ABSOLUES.

Hors périmètre (YAGNI) :
- Scaffolder une présentation entière (frontmatter + squelette de deck).
- Inspecter / réparer un slide existant comme finalité (la boucle de vérif fait partie de l'écriture, mais le diagnostic n'est pas le but du skill).

## Sources de vérité (jamais recopiées dans le skill : approche A)

- `src/content/presentations/template.mdx` : catalogue vivant des layouts (chaque composant Hero avec un exemple de props).
- `lm-presentation/.claude/CLAUDE.md` : RÈGLES ABSOLUES visuelles + conventions de contenu.

Le skill **pointe** ces fichiers et impose de les relire avant d'agir. Il ne duplique ni la liste des props, ni les règles : seul un mini-cheatsheet « intention → composant » (noms seulement) vit dans le skill.

## Identité du skill

- **Nom** : `creer-slide`
- **Emplacement** : `lm-presentation/.claude/skills/creer-slide/SKILL.md`
- **Description / déclencheur** (frontmatter) : s'active quand on écrit ou ajoute un slide dans `lm-presentation` (Astro + Reveal.js, slides.lausanne.marketing) : choisir le layout dans le catalogue `template.mdx`, remplir les props selon les conventions LM, insérer dans un MDX de `src/content/presentations/`, vérifier le rendu ; et quand aucun layout n'existe, créer un nouveau composant selon les RÈGLES ABSOLUES. Déclencheurs : « ajoute / crée / rajoute un slide », « nouveau slide », édition d'un deck sous `src/content/presentations/`.

## Workflow

### Étape 0 — Cadrer (demander vs avancer)
- Clarifier d'abord ce qui est **factuel / inconnu** (ex : la liste des modules d'un CAS, FC vs CAS) et le **placement** dans le deck.
- Pour un choix **réversible** (placement, formulation), prendre un défaut sensé et **le signaler** plutôt que bloquer.
- Au **1er souci visuel**, demander un coup d'œil / screenshot (culture CLAUDE.md : ne pas tâtonner en cascade).

### Étape 1 — Choisir le layout
- Lire `template.mdx` (catalogue qui fait foi).
- Mini-cheatsheet « intention → composant » : couverture → `CoverHero` ; intervenant → `AboutHero` ; agenda → `ProgrammeHero` ; programme / liste de modules (avec image) → `ListImageHero` ; liste numérotée 3-5 items → `NumberedSplit` ; image(s) hero (1-5) → `ImageGridHero` ; citation → `QuoteImage` ; ouverture de section → `SectionHero` / `SectionSplit` ; atelier → `WorkshopHero` ; pause → `PauseHero` ; sondage → `PollHero` / `WordCloudHero` ; clôture → `ClosingHero`.
- Confirmer les **props exactes** sur `template.mdx` (le cheatsheet ne donne que les noms).

### Étape 2 — Remplir les props (conventions)
- Accents FR obligatoires ; pas d'em-dash ni en-dash ; nombres suisses / CHF ; pas d'emoji.
- `italicPart` = **sous-chaîne exacte** du `title` (sinon le split ne rend rien d'italique).
- `brand` / `brandSub` cohérents avec le reste du deck.
- Image Unsplash : résoudre la **page** vers l'**URL directe** `images.unsplash.com/photo-...` ; recadrer avec `focal` (valeur CSS `object-position`, ex `center 80%`) quand le sujet est coupé ; `alt` en français.

### Étape 3 — Insérer dans le deck
- Ajouter l'`import` du composant + poser le slide au bon endroit **narratif** (ex : moi → vous → programme).
- Garder le bloc d'imports propre.

### Étape 4 — Vérifier le rendu
- Réutiliser / lancer `npm run dev` (http://localhost:4321), vérifier HTTP 200 + marqueurs de contenu.
- **Gotcha PowerShell** : `Invoke-WebRequest` décode mal l'UTF-8 → tester avec des **sous-chaînes ASCII** (les accents donnent du mojibake et cassent les regex).
- Vérifier l'**ordre** des slides via le **texte de corps** (pas les noms de classes CSS, hoistés par Astro en début de document).
- Lire le **log du serveur dev** pour détecter une erreur de compilation MDX.
- Pour un **nouveau visuel / composant**, demander à l'utilisateur de regarder le rendu et proposer des réglages (je ne peux pas screenshoter le rendu Reveal facilement).

### Étape 5 — Créer un composant (seulement si aucun layout ne convient)
- Partir du composant Hero le **plus proche** (copier header + fond + conventions).
- Respecter les **RÈGLES ABSOLUES** (renvoi `CLAUDE.md`) : header marque + logo LM full-width + border-bottom ; safe area ≥ 48px (padding 64px pour les Hero) ; `border-radius: 4px` cards/images ; centrage vertical (titre fixe en haut) ; ombres légères.
- Préférer un **prop optionnel non-breaking** (défaut = comportement actuel) plutôt que forker un composant existant.
- **Ajouter le nouveau layout au catalogue `template.mdx`** (pour qu'il reste découvrable).
- Puis utiliser le composant dans le deck (Étapes 2-4).

## Pièges récurrents (liste courte dans le skill)
- URL Unsplash : page `unsplash.com/photos/...` ≠ image directe `images.unsplash.com/photo-...`.
- Double recadrage : `object-fit: cover` re-rogne par-dessus le crop Unsplash → piloter le focus via `object-position` (`focal`).
- Accents en test PowerShell (cf. Étape 4).
- UTF-8 partout (règle absolue du repo).

## Principe de maintenance
Approche A : le skill reste fin et durable parce qu'il ne contient ni props ni règles recopiées. Quand un composant évolue, `template.mdx` et `CLAUDE.md` restent la vérité ; seul le cheatsheet (noms) peut demander une ligne en plus si un composant est ajouté.

## Critères de succès
- Un slide demandé est produit avec le bon layout sans tâtonner sur le composant.
- Les conventions (accents, italicPart, image directe, focal) sont respectées sans rappel.
- Le rendu est vérifié (200 + marqueurs) et l'ordre des slides confirmé.
- Un nouveau composant, quand nécessaire, respecte les RÈGLES ABSOLUES et atterrit dans `template.mdx`.
