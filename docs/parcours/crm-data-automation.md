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
| workflow                | Jour 2 (recouvre partiellement #1 Modélisation des processus) |
| lead-nurturing          | Jour 3, syllabus #9                        |
| funnel-marketing        | HORS BROCHURE, héritage Growth Marketing   |
| protection-donnees      | Jour 2, syllabus #5                        |
| workflows-avances       | Jour 3, syllabus #10                       |
| ia-automatisation       | Jour 3, syllabus #11                       |
| conclusion              | housekeeping                               |

Decks manquants par rapport à la brochure :

- **Jour 1** : complet (4 sujets de 1h30, voir Choix structurants ci-dessous). Le sujet #1 Modélisation des processus n'a pas de deck dédié : on a choisi de le couvrir par les 3 piliers de la qualité (sujet 2 Qualité) et par le module `workflow` du Jour 2.
- **Jour 2** : Implémentation CRM, Data visualisation et dashboards
- **Jour 3** : Suivi des performances

Decks à arbitrer :

- `funnel-marketing` : hors syllabus brochure, à archiver, recycler en partie dans un autre module, ou re-targeter

Historique des splits et réorganisations :

- **2026-05-29** : split du deck `collecte-qualite-donnees` (Jour 1, sujet 2 dans l'ancienne organisation, 2h) en deux decks `collecte-donnees` et `qualite-donnees` (1h30 chacun). Architecture déplacée du sujet 1 au sujet 3 pour partir de la pratique (capter, nettoyer) avant de monter en abstraction. Jour 1 passe de 3 sujets de 2h à 4 sujets de 1h30 (+ synthèse 30 min).

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
- **Sources couvertes (5)** : formulaires web, achats/transactions, imports manuels, synchronisations API, saisie manuelle équipe.
- **Quatre règles de bonne capture** : minimum viable de champs, validation côté formulaire, capture du contexte (UTM, lead magnet, timestamp, IP), consentement explicite.
- **Démo live** : décomposition du formulaire de Cédric (champs visibles, champs cachés, validation côté client). Pas de pipeline n8n ici (réservé au sujet 2 Qualité).
- **Workshop** : multi-groupes, chaque groupe reprend un formulaire actif d'un membre et le reconçoit selon les 4 règles. Output : wireframe avant/après sur paperboard, champs visibles + cachés annotés.
- **Structure timing** :

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
