# CRM, Data & Automation (HEC Lausanne ExecEd, juin 2026)

## Source brochure

`source/execed-brochure-fc-crma.pdf` : syllabus officiel à délivrer.

Promesse de la brochure :

- Diplôme : Formation courte (FC), 2.5 crédits ECTS
- Durée : 3 jours sur 1 mois
- Horaires : 9h00 à 17h00
- Format : présentiel
- Langue : français
- Prix : 2'250 CHF (rabais 10% pour Alumni HEC)

## Public cible

Responsables marketing digital, CRM managers, growth marketers, chefs de projet digital, data analysts marketing, chefs d'entreprise.

## Syllabus officiel (12 modules)

**Jour 1** : Modélisation des processus, Architecture des données, Collecte et nettoyage des données, Segmentation client.

**Jour 2** : Protection des données, Implémentation CRM, Data visualisation et dashboards, Marketing automation.

**Jour 3** : Lead nurturing, Workflows avancés, IA & automatisation, Suivi des performances.

## Compétences cibles (selon brochure)

- Conduire la gouvernance des données
- Diriger l'implémentation CRM
- Piloter une stratégie d'automatisation
- Modéliser et optimiser les processus
- Rationaliser les opérations marketing
- Visualiser les performances marketing

## Origine du contenu actuel

Les decks présents dans `src/content/presentations/` sont une reprise du cours **Growth Marketing 2024-2025** de Thomas (HEC Lausanne ExecEd). Ils servent de **base** pour comprendre le style d'enseignement, pas de version finale du cours CRM Data Automation. Le contenu doit évoluer pour matcher la brochure.

## Philosophie pédagogique observable dans les decks existants

À conserver dans les nouveaux decks :

- Cover et Calendar systématiques à l'ouverture de chaque module (rituel d'ancrage temporel)
- NumberedCards pour les listes structurées (3 à 6 items max)
- ImageGrid avec images vraies, pas d'icônes plates
- Statements pour les pivots conceptuels
- Workshop et WorkshopBrief pour ancrer dans la pratique
- Closing Q&R en fin de chaque module
- Démo n8n live pour les modules tech
- Sondages Poll/WordCloud aux moments-clés
- Calendar repris dans chaque deck d'un même jour, slot courant mis en avant

## État au 2026-05-29 (3 jours avant la formation)

Decks présents dans le parcours :

| Deck                    | Couvre brochure ?                          |
| ----------------------- | ------------------------------------------ |
| introduction            | housekeeping                               |
| collecte-donnees        | Jour 1, syllabus #3 (partie capture)       |
| qualite-donnees         | Jour 1, syllabus #3 (cleaning, enrichment) + bouts de #1 Modélisation (ownership, routines) |
| architecture-donnees    | Jour 1, syllabus #2                        |
| segmentation-activation | Jour 1, syllabus #4                        |
| marketing-automation    | Jour 2, syllabus #8                        |
| modeliser-les-processus | Jour 1, syllabus #1 (Modélisation des processus) |
| workflow                | Jour 2, syllabus #6 Implémentation/automatisation (le bloc modélisation a été extrait vers `modeliser-les-processus` le 2026-06-13) |
| lead-nurturing          | Jour 3, syllabus #9                        |
| funnel-marketing        | HORS BROCHURE, héritage Growth Marketing   |
| protection-donnees      | Jour 2, syllabus #5                        |
| workflows-avances       | Jour 3, syllabus #10                       |
| ia-automatisation       | Jour 3, syllabus #11                       |
| conclusion              | housekeeping                               |

Decks manquants par rapport à la brochure :

- **Jour 1** : complet. Le sujet #1 Modélisation des processus a désormais son deck dédié `modeliser-les-processus` (créé 2026-06-13), placé **après** `des-donnees-au-crm` : on structure les données (architecture), on monte le CRM sur ce schéma (Des données au CRM), puis on modélise les processus pour les implémenter dans ce CRM. Les 3 piliers de la qualité (sujet 2 Qualité) restent un renfort sur la gouvernance.
- **Jour 2** : Implémentation CRM, Data visualisation et dashboards
- **Jour 3** : Suivi des performances

Decks à arbitrer :

- `funnel-marketing` : hors syllabus brochure, à archiver, recycler en partie dans un autre module, ou re-targeter

Historique des splits et réorganisations :

- **2026-05-29** : split du deck `collecte-qualite-donnees` (Jour 1, sujet 2 dans l'ancienne organisation, 2h) en deux decks `collecte-donnees` et `qualite-donnees` (1h30 chacun). Architecture déplacée du sujet 1 au sujet 3 pour partir de la pratique (capter, nettoyer) avant de monter en abstraction. Jour 1 passe de 3 sujets de 2h à 4 sujets de 1h30 (+ synthèse 30 min).
- **2026-06-13** : création du deck `modeliser-les-processus` (Jour 1, après `des-donnees-au-crm`). Le bloc modélisation (chaos, BPMN, 4 notions clés, Exchange, outils d'édition BPMN, process vs workflow) est **extrait intégralement** de `workflow` (Jour 2) vers ce nouveau deck, plus deux slides net-neuf (mapping BPMN vers objets CRM, démo Zoho Blueprint). `workflow` redémarre désormais sur les outils no-code et la construction, en assumant la modélisation faite au Jour 1. Images rapatriées vers `public/decks/modeliser-les-processus/`.

## Choix structurants

### Paramètres du cours (mise à jour 2026-05-29)

- **Jour 1 : 4 sujets de 1h30 + synthèse 30 min.** Ordre pédagogique : capter (Collecte), nettoyer (Qualité), structurer (Architecture), utiliser (Segmentation). Part du concret avant l'abstrait, à l'inverse de l'ordre originel qui démarrait par Architecture.
- **Jours 2-3 : 3 sujets de 2h** par défaut, à ajuster module par module. 10 modules au total Jour 1 inclus, mappés sur les 12 sujets de la brochure par fusion.
- **Audience mixte** : associations à multinationales. Tous les contenus doivent parler aux deux extrêmes.
- **Public non-dev** : pas de jargon DB. Toujours expliquer "pourquoi on fait ça" avant le "comment".

### Messages-clés fil rouge (à tisser dans tous les modules)

1. **Tool-agnostic** : un CRM, c'est une logique, pas un outil. Excel = Salesforce dans la pensée.
2. **PME power** : ce qui était inaccessible il y a 5 ans est trivial aujourd'hui avec les bons outils.
3. **IA fil rouge** : intégrée partout, pas en module isolé.

### Module Collecte des données (Jour 1, sujet 1)

- **Durée** : 90 min (1h30)
- **Idée centrale** : "Capter proprement, dès la source. La donnée la plus propre est celle qu'on n'a pas eu besoin de nettoyer."
- **Fil rouge** : la landing page de **Cédric**, construite dans le module Growth Marketing qui précède le parcours. Suite directe de leur travail de la semaine précédente. Le fil rouge se prolonge dans Qualité (sujet 2), puis dans les modules workflow (Jour 2) et workflows avancés (Jour 3) qui automatisent sur cette donnée propre.
- **Sources couvertes (5)** : formulaires, transactions, scraping, intégrations (API), imports manuels.
- **Organisation du deck (révisée 2026-06-03)** : vue d'ensemble, puis deep dives par source.
  - **1.0 Source de données** : intercalaire d'ouverture, les 5 portes d'entrée (ImageGridHero) + sondage "quelle source utilisez-vous le plus ?".
  - **1.1 Scraping** : le concept (registres officiels Zefix/RC, Google Maps, annuaires pro), le cadre légal (données publiques d'entreprises oui, données personnelles non sans base légale : LPD/RGPD), démo Apify (Google Maps Scraper).
  - **1.2 Formulaires** : maquette, les 4 règles de bonne capture, "quelles données demander" (à demander vs à inférer/enrichir), démo du formulaire de Cédric disséqué.
- **Quatre règles de bonne capture** : minimum viable de champs, validation côté formulaire, capture du contexte (UTM, lead magnet, timestamp, IP), consentement explicite.
- **Démos live (2)** : Apify Google Maps Scraper (section Scraping) et décomposition du formulaire de Cédric, champs visibles / cachés / validation (section Formulaires). Pas de pipeline n8n ici (réservé au sujet 2 Qualité).
- **Workshop** : retiré du deck (décision 2026-06-03, "pas de refonte de formulaire"). Le module n'a pas de workshop pour l'instant. L'ancien workshop (refonte d'un formulaire selon les 4 règles, wireframe avant/après) reste consultable dans l'historique git de l'ancien deck `collecte-donnees.mdx` (supprimé lors du nettoyage des doublons le 2026-06-05) si besoin de le réintégrer.
- **Slide "Collecter ne suffit pas"** : déplacé vers le deck `qualite-donnees` (pivot d'ouverture du module Qualité) le 2026-06-03.
- **Structure timing** (plan initial 2026-05-29, à réviser : workshop retiré et scraping ajouté le 2026-06-03) :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 3 |
  | Statement intro Cédric | 4 |
  | Section Sources et capture | 30s |
  | 5 sources de données | 10 |
  | 4 règles de bonne capture | 10 |
  | Démo formulaire Cédric | 15 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 25 |
  | Restitution + débrief | 8 |
  | Closing Q&R | 5 |

- **Détails Cédric à confirmer** : métier, lead magnet précis, champs du formulaire, outil de construction. À oraliser sur la base des slides existantes du module Growth Marketing le jour J.

### Module Qualité des données (Jour 1, sujet 2)

- **Durée** : 90 min (1h30)
- **Thèse centrale** : "Ne demande que ce que tu ne peux pas déduire."
- **Articulation** : sujet 1 a capté (forme, UTM, consentement). Sujet 2 transforme la donnée brute en donnée propre et enrichie, prête à activer après l'architecture (sujet 3).
- **Cleaning (5 techniques)** : email (lowercase + MX validation), téléphone (E.164 via libphonenumber), nom/prénom (Title Case + trim emojis), doublons (strict + fuzzy), dates et codes postaux (format ISO).
- **Enrichment (4 cas)** : Genderize.io (genre depuis prénom), Clearbit/Apollo (société depuis email pro), IPstack (géoloc depuis IP), Claude/GPT API (structuration de texte libre).
- **Qualité comme processus (3 piliers)** : métriques visibles (dashboard), routines calendarisées (mensuelles, trimestrielles), ownership clair (data steward ou CRM manager).
- **Démo live** : pipeline n8n complet, sortie du formulaire de Cédric (sujet 1) → cleaning → enrichment (Genderize central) → routing CRM.
- **Workshop** : mêmes groupes qu'au sujet 1, même formulaire participant. Conçoivent le pipeline cleaning + enrichment derrière. Bonus : critique IA du pipeline.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 3 |
  | Statement pivot capture vers qualité | 4 |
  | Section Cleaning | 30s |
  | Tableau cleaning (5 techniques) | 12 |
  | Section Enrichment | 30s |
  | 4 cas d'enrichment (Genderize central) | 12 |
  | Statement pivot "ne demande pas, déduis" | 4 |
  | Section Qualité comme processus | 30s |
  | 3 piliers (métriques, routines, ownership) | 10 |
  | Démo pipeline n8n | 12 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 20 |
  | Restitution + débrief | 8 |

### Module Architecture des données (Jour 1, sujet 3)

- **Durée** : 90 min (1h30)
- **Idée centrale** : "Le schéma compte plus que l'outil."
- **Placement** : sujet 3 après la pratique de la matinée (Collecte + Qualité). Les participants ont manipulé de la donnée brute et propre, ils ont les exemples concrets en tête pour aborder l'abstraction du schéma. Première heure d'après-midi.
- **Schéma fil rouge** (démo et workshop) : Contact + Société + Affaire + Événement. Démontre la séparation Événement vs champs sur Contact (fix du piège #3).
- **Outils démo (3)** : Excel (TPE et associations), Airtable (PME en croissance), Zoho (grande structure). Un par taille d'entreprise. L'angle "tool-agnostic" prend tout son sens : même schéma, trois véhicules calibrés sur trois échelles.
- **Workshop** : multi-groupes de 3-4 personnes. Chaque groupe désigne une boîte parmi ses membres comme cas d'étude. ERD dessiné au feutre sur paperboard ou A3 papier. Restitution 1-2 min par groupe.
- **IA dans le module** : étape bonus du workshop ("demande à Claude/GPT de critiquer ton ERD"). Pas de bloc IA séparé, l'IA aura son module Jour 3.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 3 |
  | Exchange ouverture | 5 |
  | Pourquoi l'architecture compte (5 raisons non-dev) | 10 |
  | Vocabulaire de base | 8 |
  | 5 pièges classiques | 20 |
  | Pivot tool-agnostic | 3 |
  | Démo 3 outils | 10 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 18 |
  | Restitution + débrief | 10 |

- **Les 5 pièges classiques** (bloc-clé du module) :
  1. Trop de champs : "on va tout tracker" → CRM abandonné. Fix : "qu'est-ce que je vais filtrer/décider avec ce champ ?"
  2. Pas de relations : tout dans une table fourre-tout. Fix : entités séparées avec liens.
  3. Événements dans la fiche contact (`DerniereAction`, `ProchaineRelance`) : écrase l'historique. Fix : table Activités séparée.
  4. Champ notes fourre-tout : "DOB 1985, allergique gluten" perdu. Fix : champs structurés pour le filtrable, notes pour le qualitatif.
  5. Pas de single source of truth : la même donnée à plusieurs endroits divergents. Fix : un endroit qui fait foi.

- **Les 5 raisons "pourquoi l'archi compte" (vue non-dev)** :
  1. Retrouver l'info en 3 sec, pas 20 min
  2. Permettre à l'IA de t'aider (un assistant IA ne vaut que ce que vaut ton schéma)
  3. L'équipe parle le même langage
  4. Changer d'outil sans tout refaire
  5. Grossir sans casser

### Module Segmentation et activation (Jour 1, sujet 4)

- **Durée** : 90 min (1h30)
- **Thèse centrale** : "Segmenter sans activer, c'est perdre son temps."
- **Articulation** : sujets 1-2 = la donnée propre, sujet 3 = le schéma, sujet 4 = USAGE de la donnée. Dernier module du jour, ferme la boucle data vers activation.
- **Cinq axes de segmentation** : démographique, comportemental, valeur (RFM), cycle de vie, prédictif (IA).
- **Clarification vocabulaire** : persona (modèle mental, ne se filtre pas) vs segment (sous-ensemble filtrable et actionnable).
- **Trois leviers IA** : clustering automatique (HubSpot Lists Auto / Einstein), lookalike (jumeaux statistiques pour ads et prospection), predictive scoring (propension / churn / LTV).
- **Quatre modes d'activation** : séquence email automatisée, email transactionnel déclenché (chirurgical), audience publicitaire (retargeting Meta/LinkedIn/Google), handover commercial.
- **Démo live** : reprise de la base Cédric (nettoyée et enrichie au sujet 2), création de 3 segments distincts dans Zoho avec activations alignées.
- **Workshop** : multi-groupes, reprise de la boîte travaillée plus tôt dans la journée (formulaire au sujet 1, pipeline au sujet 2, ERD au sujet 3) pour la cohérence du fil rouge. Output : tableau segments × critères × activation × premier message.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 3 |
  | Recap (data propre + structure, on l'utilise) | 4 |
  | Section Pourquoi segmenter | 30s |
  | Statement spray and pray | 5 |
  | Section Axes de segmentation | 30s |
  | 5 axes classiques | 10 |
  | TwoColumnTable persona vs segment | 5 |
  | 3 leviers IA | 8 |
  | Section L'activation | 30s |
  | Statement pivot | 3 |
  | 4 modes d'activation | 10 |
  | Section Mettre en pratique | 30s |
  | Démo live (Cédric, 3 segments) | 10 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 18 |
  | Restitution + débrief | 8 |

### Module Modéliser les processus (Jour 2, premier sujet)

- **Durée** : 90 min (1h30).
- **Idée centrale** : "Modéliser avant d'implémenter. On cartographie le processus sur le papier avant de le construire dans le CRM."
- **Placement et fil rouge** : volontairement **après** `des-donnees-au-crm`. Enchaînement : architecture des données (le schéma) puis Des données au CRM (on monte le CRM sur ce schéma) puis Modéliser les processus (on cartographie les processus métier, puis on les implémente dans ce CRM). Le module annonce aussi le Jour 2 (`workflow`, les workflows d'exécution) via le slide "processus vs workflow".
- **Origine du contenu** : le bloc modélisation a été **extrait intégralement** du deck `workflow` (Jour 2) le 2026-06-13 (chaos, BPMN/Trisotech, 4 notions clés, Exchange, outils d'édition BPMN, process vs workflow), augmenté de deux slides net-neuf : le mapping BPMN vers objets CRM, et une démo Zoho Blueprint.
- **Notation BPMN (4 notions clés)** : swimlanes (acteurs/départements), événements (début, intermédiaire, fin), activités (tâches), gateways (points de décision).
- **Outils d'édition** : MIRO (le plus connu), Lucidchart (alternative robuste).
- **Pont vers le CRM** (cœur du module, slides net-neuf) : chaque brique BPMN se traduit dans le CRM. Swimlane vers rôle/assignation, événement vers déclencheur, activité vers étape (statut/transition/tâche), gateway vers condition/règle. Ancré dans Zoho via le module Blueprint (l'outil fil rouge établi au module précédent).
- **Workshop** : **modélisation BPMN pure** (décision : pas de volet implémentation CRM dans l'exercice, qui reste une démo). Les participants modélisent un processus réel de leur organisation, avec au moins deux swimlanes et un gateway.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover | 2 |
  | Pourquoi modéliser (chaos) | 4 |
  | BPMN, le standard (Trisotech) | 6 |
  | Les 4 notions clés du BPMN | 10 |
  | Outils d'édition (MIRO, Lucidchart) | 4 |
  | Exchange, modéliser ensemble | 8 |
  | Processus vs workflow | 4 |
  | Du processus au CRM (mapping) | 6 |
  | Démo Zoho Blueprint | 10 |
  | Workshop brief | 3 |
  | Workshop BPMN | 25 |
  | Restitution + débrief | 8 |

## Examen (décidé 2026-06-13)

Présenté dans le deck `introduction` (section `03 L'examen`), trois slides : intercalaire, livrables, barème.

### Principe

**Un seul projet, sur leur propre entreprise** (ou un cas de leur choix si ce n'est pas possible), décliné en quatre livrables qui s'enchaînent dans l'ordre de construction du cours. Les trois premiers sont quasi les outputs des workshops (ERD, BPMN, workflow no-code) : l'examen capitalise sur la pratique en salle. Le quatrième, la stratégie, est la clé de voûte qui relie les trois.

### Les quatre livrables (dans l'ordre)

1. **Architecture de données** : le schéma du CRM, entités et relations (cf. module `architecture-donnees`).
2. **Processus modélisés** : deux à trois processus clés en BPMN (cf. `modeliser-les-processus`). Deux à trois suffisent.
3. **Workflow** : un processus automatisé de bout en bout (cf. `workflows`). Un seul suffit.
4. **Stratégie data & automation** : la vision qui relie et priorise les trois.

### Modalités

- **Format** : dossier écrit, **individuel**, une section par livrable.
- **Cas** : leur entreprise, ou un cas au choix à défaut.
- **Rendu** : après la formation, délai indiqué sur Moodle.

### Barème

| Livrable | Poids |
|----------|-------|
| Architecture | 20 % |
| Processus | 20 % |
| Workflow | 20 % |
| Stratégie | 40 % |

La stratégie pèse le double : c'est là que se mesure la compétence brochure « Piloter une stratégie d'automatisation », au-delà de la preuve technique. Pondération posée par défaut, à réviser librement (modifier le `<Table>` de `introduction.mdx`).

## Récap de fin (conclusion)

Le deck `conclusion` ouvre sur un slide `<Recap parcours="crm-data-automation">` (composant `src/components/slides/Recap.astro`) qui **dérive au build** le nombre de workshops et de démonstrations du parcours, comme `AgendaDays` :

- **Workshops** : tout deck dont le corps contient un `<Workshop>`, moins l'override `noWorkshop` (mêmes exclusions que l'agenda : `funnel-marketing`, `segmentation-activation`). Libellé = titre du deck.
- **Démonstrations** : chaque `<Demo toolName="...">` rencontré. Seuls 4 decks utilisent aujourd'hui le composant `<Demo>` (Tally, Apify, Apollo.io, Zoho CRM) : les démos faites en direct sans slide `<Demo>` ne sont pas comptées. État au 2026-06-13 : 5 workshops, 4 démos. Le récap se met à jour tout seul quand on ajoute un atelier ou une démo.
