# Cas d'usage horloger dans le deck « Stratégie data & automation »

- **Date** : 2026-06-14
- **Deck cible** : `src/content/presentations/strategie-data-automation.mdx`
- **Statut** : design à valider
- **Scope** : un seul fichier MDX (voir « Hors scope »)

## Contexte et problème

Le deck `strategie-data-automation` est le capstone du parcours CRM, Data & Automation (Jour 3, dernier module avant la conclusion, 4e livrable de l'examen). Son ouverture (section 01 « Pourquoi une stratégie ») est aujourd'hui **abstraite** : un Statement thèse, un recap des 3 briques, un InfoCards « ce qu'une stratégie ajoute ».

Le deck `workflows-avances` (Jour 3) porte un message fort qui mérite de survivre, indépendamment du sort de ce deck : **« on ne crée plus un workflow par événement, mais un workflow qui s'adapte à tous les événements »** (le pivot « à la racine », plus les 3 limites de la duplication : risque d'erreur, scalabilité, usine à gaz).

L'idée : ancrer l'ouverture du deck stratégie dans un **cas d'usage concret, la gestion des événements d'une maison horlogère**, qui démontre la thèse au lieu de l'asséner. Le pivot « à la racine » n'est pas une astuce technique n8n : c'est une décision de **cohérence d'ensemble**, soit exactement ce qu'apporte une stratégie.

## Objectif pédagogique

Faire vivre, sur un cas, le message déjà inscrit dans le deck (« Sans stratégie, vous automatisez le désordre plus vite ») :

1. Sans vision d'ensemble, on duplique un workflow par événement, donc on duplique les erreurs (une correction à 12 endroits, des versions divergentes, une maintenance qui explose).
2. Avec cohérence, on automatise l'événementiel **à la racine** : un seul workflow paramétrable, la donnée varie (le type d'événement), la logique reste unique.
3. Cette bascule (penser le système, pas la tâche) **est** une décision stratégique. Pont direct vers « ce qu'une stratégie ajoute ».

## Décisions actées (avec l'utilisateur, 2026-06-14)

- **Périmètre = approche A** : le cas réécrit la section 01 (ouverture). Le reste du deck (sections 02 maturité/priorisation/roadmap, 03 livrable, workshop) ne bouge pas, pour rester générique et applicable à la propre organisation de chaque participant (cohérence avec le workshop).
- **Canvas = « spaghetti puis racine »** : deux N8nCanvas successifs (l'avant chargé et dupliqué, puis l'après unique et propre). Facteur de contraste visuel assumé.
- **Recap des 3 briques conservé**, resserré : un slide Steps « ce que vous avez déjà construit » reste, pour le pont explicite vers les 3 premiers livrables de l'examen.
- **`workflows-avances` conservé** dans le parcours pour l'instant (suppression remise à plus tard par l'utilisateur). Redondance temporaire assumée.
- **Multiagent** : je ne touche **qu'à** `strategie-data-automation.mdx`. Aucune écriture sur le frontmatter du parcours ni sur d'autres decks.

## Structure cible de la section 01 (réécrite)

Composants 100 % existants. Le cas est une maison horlogère **fictive et générique** (« une maison horlogère genevoise », sans nom de marque, fil rouge tool/brand-agnostic du parcours). « Watches & Wonders » est cité comme type d'événement (salon public neutre).

| # | Slide | Composant | Rôle | Statut |
|---|-------|-----------|------|--------|
| 1 | « Pourquoi une stratégie ? » | `SubSection` 01 | intercalaire | inchangé |
| 2 | Une année rythmée par les événements | `Media` | poser le décor | nouveau |
| 3 | Un workflow par événement | `Compare` | opposer duplication vs racine | nouveau |
| 4 | Trois limites de la duplication | `ImageGrid` | recyclé de workflows-avancés | nouveau (repris) |
| 5a | Le réflexe : un workflow par événement | `N8nCanvas` | le « spaghetti », l'avant | nouveau |
| 5b | Le workflow à la racine | `N8nCanvas` | le workflow unique, l'après | nouveau |
| 6 | La leçon : la cohérence avant l'outil | `Statement` | recadrage vers la stratégie | remplace le Statement actuel |
| 7 | Ce que vous avez déjà construit | `Steps` | recap 3 briques, pont examen | conservé, resserré |
| 8 | Ce qu'une stratégie ajoute | `InfoCards` | la cohérence en 1er apport | quasi inchangé |

### Contenu rédactionnel (draft à valider)

**Slide 2 : Media « Une année rythmée par les événements »**
- italicPart : « événements »
- subtitle : « Une maison horlogère genevoise. Chaque année, une dizaine de rendez-vous, toujours la même mécanique derrière. »
- body : « Lancement d'un modèle, salon Watches & Wonders, soirée VIP en boutique, vente privée, pop-up voyageur, dîner presse. À chaque fois : une liste d'invités segmentée, des invitations, des RSVP, des relances, un check-in sur place, un suivi après l'événement. »
- image : placeholder Unsplash (montre / atelier horloger), `fit="cover"`.

**Slide 3 : Compare « Un workflow par événement »**
- italicPart : « par événement »
- subtitle : « Le même besoin revient à chaque événement. Deux façons de l'automatiser. »
- left.heading : « Un workflow par événement »
  - « On crée « Lancement Modèle X », puis on le duplique en « Salon Genève », puis en « Soirée VIP »... »
  - « Chaque copie réintroduit ses propres réglages, ses propres oublis. »
  - « 40 événements par an, 40 workflows à tenir à jour. »
- right.heading : « Un workflow pour tous les événements »
  - « Une seule logique, paramétrée par les attributs de l'événement. »
  - « La donnée varie (type, date, audience), le workflow reste unique. »
  - « Un correctif, et tous les événements en profitent. »
- note : « On ne crée plus un workflow par événement, mais un workflow qui s'adapte à tous les événements. »

**Slide 4 : ImageGrid « Trois limites de la duplication »** (repris de workflows-avancés, recadré horloger)
- italicPart : « limites »
- subtitle : « Multiplier les workflows identiques, c'est multiplier les occasions de divergence. »
- 3 images (placeholders ou reprise des assets workflows-avancés à confirmer) :
  - Risque d'erreur : « Le texte de relance corrigé dans un workflow, oublié dans les onze autres. Le consentement RGPD mis à jour ici, pas là. »
  - Scalabilité limitée : « Un workflow par événement, donc une charge de maintenance qui croît avec le calendrier. »
  - Usine à gaz : « Qui a créé « Soirée VIP v3 (final) » ? Plus personne ne sait quelle version fait foi. »

**Slide 5a : N8nCanvas « Le réflexe : un workflow par événement » (spaghetti)**
- 3 chaînes parallèles identiques, non reliées entre elles, empilées :
  - Lancement Modèle X : [trigger] → Invitation → RSVP → Relance
  - Salon Genève : [trigger] → Invitation → RSVP → Relance
  - Soirée VIP : [trigger] → Invitation → RSVP → Relance
- captionTitle : « Un workflow par événement », captionText : « La même logique, copiée encore et encore. Et 37 autres en dessous. »

**Slide 5b : N8nCanvas « Le workflow à la racine » (workflow unique)**
- Une seule chaîne, déclencheur générique + routage qui converge vers les actions communes :
  - [trigger] « Événement créé » (CRM)
  - → Switch « Type d'événement » (branches labellisées Lancement / Salon / VIP qui pointent toutes vers le même nœud suivant)
  - → « Parcours d'invitation » (template paramétré)
  - → « RSVP »
  - → « Relance J-3 »
  - → « Check-in »
  - → « Suivi post-event » (remerciement, scoring, handover conseiller)
- captionTitle : « Un workflow pour tous », captionText : « La donnée varie, la logique est unique. Un seul flux à maintenir. »

**Slide 6 : Statement « La cohérence avant l'outil »** (remplace le Statement actuel)
- title : « Sans stratégie, vous automatisez\nle désordre plus vite »
- italicPart : « le désordre plus vite »
- body : « Le passage d'un workflow par événement à un workflow unique n'est pas une astuce n8n. C'est une décision de cohérence : penser le système plutôt que la tâche. C'est précisément ce qu'apporte une stratégie. »

**Slide 7 : Steps « Ce que vous avez déjà construit »** (conservé du deck actuel, inchangé sur le fond)
- Recap des 3 livrables (architecture, processus, workflow) + « il manque le plan qui les relie ».

**Slide 8 : InfoCards « Ce qu'une stratégie ajoute »** (quasi inchangé)
- Reformuler la 1re carte autour de la **cohérence** (le fil qui relie), puis priorisation, séquencement, mesure. Garde 4 cartes 2x2.

## Ce qui ne change pas

Sections 02 (maturité, matrice impact/effort, roadmap 3 horizons), 03 (Table du livrable, Tip « pas un 4e silo »), et le Workshop : intacts. La fin auto (Questions) est gérée par la route, rien à écrire.

## Contraintes repo

- **UTF-8** complet, **guillemets français « » avec espace insécable** (U+00A0) dans tout texte rendu, **pas d'em-dash** (deux-points, virgules, parenthèses), pas d'emojis. Min 22px géré par les composants.
- **scheme** du deck : `execed` (figé), ne pas toucher.
- **N8nCanvas** : scène 1920x1080, NODE_W 156 / NODE_H 120, connexions gauche→droite ; positions x/y à caler visuellement sur le dev server (:8000). Ne pas mettre `tocLabel` (slides de contenu, pas de section dans le Sommaire).
- **Images** : placeholders Unsplash cohérents avec le reste du deck (déjà en placeholders). Les assets locaux de `public/decks/workflows-avances/` peuvent être réutilisés pour l'ImageGrid si on veut éviter les placeholders (à confirmer ; ne pas déplacer les fichiers, juste pointer dessus).

## Leviers de réduction (si l'ouverture paraît trop longue à la relecture)

La section 01 passe de 3 à 8 slides de contenu. Si c'est trop dense une fois rendu :
- fondre le slide 2 (décor) dans le `subtitle` du Compare (slide 3) ;
- ou retirer le Steps recap (slide 7) en mentionnant les 3 briques dans le body du Statement (slide 6).

## Hors scope

- Suppression de `workflows-avances` (fichier, frontmatter parcours, images, doc parcours) : remis à plus tard, géré hors de ce travail.
- Modification du parcours `crm-data-automation.mdx`, de la doc parcours, ou de tout autre deck.
- Sections 02 / 03 / Workshop du deck stratégie.
- Création de nouveau composant slide (tout est couvert par l'existant).
