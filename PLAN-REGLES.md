# Règles à écrire : plan de travail (lm-presentation)

> Doc de travail à la racine du repo (ce n'est pas une règle en soi). On capture ici, ensemble,
> les règles qu'on veut formaliser. Chaque règle validée est ensuite écrite dans `.claude/rules/`
> (auto-chargé à chaque session) puis retirée du backlog ci-dessous.
>
> Versionné sur `main` (commit de fondation typo). Édité à la main ou via nos sessions.

## Séquence

1. Pousser le travail des autres agents (collecte-donnees, composants en cours...).
2. Vider le backlog : pour chaque règle, on décide intention + niveau d'enforcement + fichier cible.
3. Écrire chaque règle validée dans `.claude/rules/`, puis la passer en « Fait ».

## Rappel : 3 niveaux d'enforcement (du plus mou au plus fort)

1. **Documentée** : écrite dans `.claude/rules/<fichier>.md` : suivie par convention par tous les agents.
2. **Durcie dans le code** : la violation est rendue *impossible* dans le composant (ex. `<h2>`
   « Workshop » codé en dur, props `title`/`italicPart` retirées de l'interface). À préférer dès que faisable.
3. **Gated en CI** (pas encore en place) : `astro build` + `astro check` sur les PR.

Fichiers de règles actuels : `slides.md`, `conventions.md`, `themes.md`, `parcours.md`, `polls.md`
(cf. table « Fichiers de règles » dans `.claude/CLAUDE.md`).

## Modèle pour chaque règle

```
### Titre court de la règle
- Pourquoi    : le problème concret que ça évite
- Concerne    : composant(s) / fichier(s)
- Enforcement : doc | hardcode | CI
- Cible       : .claude/rules/<fichier>.md (existant ou nouveau)
- Statut      : à discuter | validé | fait
```

## Backlog (à remplir ensemble)

_Dump tes idées ici en vrac, même mal formulées : on les structure ensemble._

-

## Idées à trier (non validées)

_(rien encore)_

## Bugs à régler

### Bande blanche en bas du slide en plein écran
- **Symptôme** : en mode plein écran, une bande blanche horizontale apparaît tout en bas du slide, sous le dégradé pearl du contenu. Asymétrique (bas uniquement, rien en haut). Constaté sur `WorkshopHero` en thème ExecEd (capture `bande-blanche.png`).
- **Cause** : inconnue, à investiguer (ne pas spéculer en cascade). Pistes de départ dans `slides.css` : le calcul aspect-ratio 16:9 de `.deck-stage` vs le `100vh` réel en plein écran ; ce qui apparaît derrière le slide (`.reveal` est `transparent`, `body` = `--c-cream`, mais `html` est blanc par défaut) ; le sizing/scaling propre de Reveal.js en plein écran laissant un gap en bas qui expose une couche blanche.
- **Repro** : passer un deck en plein écran (bouton ou touche), observer le bas. Inspecter quel élément reçoit `:fullscreen` et le fond des couches `html` / `body` / `.deck-stage`.
- **Statut** : à investiguer (pas urgent, mais visible en salle).

## En cours

### Harmonisation typographique des slides (ambition totale : tokens + migration complète)
- **Pourquoi** : sur la famille Hero, ~17 tailles de titres (64-188px), corps 16-42px, largeurs de descriptions 620-1500px. Aucune échelle partagée.
- **Concerne** : les 34 composants Hero vivants (legacy hors scope, à archiver).
- **Enforcement** : tokens CSS (`src/styles/type.css`) + règle `.claude/rules/typographie.md` (« pas de taille en dur »).
- **Décidé** : ambition totale = tokens + migration complète des heroes.
- **Fait** : `type.css` (tokens, inerte / pas encore importé) + `typographie.md` (règle + mapping palier→composant) poussés sur `main`.
- **Reste** : néant pour la fondation. Suivi continu des entorses résiduelles documentées dans `typographie.md`.
- **Statut** : FAIT. `type.css` est importé par `slides.css`, la famille Hero consomme les tokens (cf. `typographie.md`, statut « MIGRÉ 2026-06-08 »). Nettoyage 2026-06-09 : 20 composants legacy pré-Hero supprimés, tokens `--fs-slide-title` / `--fs-code` ajoutés, `slides.css` ne porte plus de px brut.

## Fait

### Titre des slides Workshop figé sur « Workshop »
- Pourquoi    : « Workshop » est l'ancrage visuel récurrent des temps d'atelier ; aucune variante thématique.
- Concerne    : `WorkshopHero.astro` + 6 decks (architecture-donnees suivra via son worktree).
- Enforcement : hardcode (h2 en dur + props retirées) **et** doc.
- Cible       : `.claude/rules/slides.md`.
- Statut      : fait : commit `a9be662` sur `main`.
