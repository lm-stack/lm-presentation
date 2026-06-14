# Description courte obligatoire (carte parcours + slide « Des questions ? »)

Date : 2026-06-14
Statut : design validé, implémentation en cours.

## Problème

Aujourd'hui, la carte « Des questions ? » affiche `short ?? subtitle` du deck suivant
(un titre court ou le nom du cours, jamais une vraie description). La carte du parcours
affiche `description ?? short` (incohérent : SEO long pour certains, titre court sinon).
Aucun champ « accroche courte » dédié, obligatoire et plafonné.

## Décision (validée)

Réutiliser le champ `description` existant :

- Le rendre **obligatoire** + **plafonné à 90 caractères** dans `content.config.ts`.
- L'utiliser partout : carte parcours, carte « Des questions ? », et meta SEO (déjà le cas).

## Changements

1. `content.config.ts` : `description: z.string().optional()` → `description: z.string().max(90)`
   (obligatoire ; le build échoue si manquant ou > 90 → règle réellement garantie).
2. `src/pages/p/[slug].astro` : `nextShort={nextDeck.data.short ?? nextDeck.data.subtitle}`
   → `nextShort={nextDeck.data.description}`.
3. `src/components/slides/Questions.astro` : clamp 2 lignes sur `.questions__next-short`
   (filet anti-débordement, en plus du plafond schéma).
4. `src/pages/parcours/[slug].astro` : `const desc = deck.description ?? deck.short ?? ''`
   → `const desc = deck.description` (déjà tronquée 1 ligne ellipsis dans la liste).
5. Migration : `description` ≤ 90 car. réécrite pour les 15 decks du parcours.

## Limite : 90 caractères

À 22px dans la carte « Des questions ? » (~740px de large), 90 car. tiennent en 2 lignes max.
Ajustable. À valider par capture pendant l'implémentation.

## Ordre d'implémentation (dev server partagé, multi-agent)

Flipper le schéma vers obligatoire+max revalide TOUS les decks ; si un deck dépasse 90 à ce
moment, le dev server `:8000` casse pour tous les agents. Donc :

1. Raccourcir les 15 descriptions à ≤ 90 d'abord (sûr : schéma encore optionnel).
2. Câbler routes + CSS (sûr).
3. Flipper le schéma EN DERNIER, une fois les 15 decks conformes.

Decks édités par d'autres agents (collisions) : à traiter une fois libérés ; le flip du
schéma attend que les 15 soient conformes.

## Definition of done

- Build propre (`z.string().max(90)` respecté par les 15 decks).
- Carte « Des questions ? » : description en 2 lignes max, pas de débordement (capture).
- Carte parcours : description (1 ligne ellipsis) cohérente avec la carte de fin.
