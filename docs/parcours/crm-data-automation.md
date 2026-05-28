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

## État au 2026-05-28 (4 jours avant la formation)

Decks présents dans le parcours :

| Deck                | Couvre brochure ?                          |
| ------------------- | ------------------------------------------ |
| introduction        | housekeeping                               |
| marketing-automation | Jour 2, syllabus #8                       |
| workflow            | Jour 2 (recouvre partiellement #1 Modélisation des processus) |
| lead-nurturing      | Jour 3, syllabus #9                       |
| funnel-marketing    | HORS BROCHURE, héritage Growth Marketing  |
| protection-donnees  | Jour 2, syllabus #5                       |
| workflows-avances   | Jour 3, syllabus #10                      |
| ia-automatisation   | Jour 3, syllabus #11                      |
| conclusion          | housekeeping                               |

Decks manquants par rapport à la brochure :

- **Jour 1** : Architecture des données, Collecte et nettoyage des données, Segmentation client (et possiblement Modélisation des processus en deck dédié si distinct de `workflow`)
- **Jour 2** : Implémentation CRM, Data visualisation et dashboards
- **Jour 3** : Suivi des performances

Decks à arbitrer :

- `funnel-marketing` : hors syllabus brochure, à archiver, recycler en partie dans un autre module, ou re-targeter

## Choix structurants

### Paramètres du cours (2026-05-28)

- **3 sujets par jour, 2h par sujet** : 9 modules au total, mappés sur les 12 sujets de la brochure par fusion. Décisions de fusion prises module par module.
- **Audience mixte** : associations à multinationales. Tous les contenus doivent parler aux deux extrêmes.
- **Public non-dev** : pas de jargon DB. Toujours expliquer "pourquoi on fait ça" avant le "comment".

### Messages-clés fil rouge (à tisser dans tous les modules)

1. **Tool-agnostic** : un CRM, c'est une logique, pas un outil. Excel = Salesforce dans la pensée.
2. **PME power** : ce qui était inaccessible il y a 5 ans est trivial aujourd'hui avec les bons outils.
3. **IA fil rouge** : intégrée partout, pas en module isolé.

### Module Architecture des données (Jour 1, sujet 1)

- **Durée** : 120 min (2h)
- **Idée centrale** : "Le schéma compte plus que l'outil."
- **Schéma fil rouge** (démo et workshop) : Contact + Société + Affaire + Événement. Démontre la séparation Événement vs champs sur Contact (fix du piège #3).
- **Outils démo (3) ** : Excel, Airtable, Brevo (cohérence avec le stack 50 CHF/mois de la conclusion).
- **Workshop** : multi-groupes de 3-4 personnes. Chaque groupe désigne une boîte parmi ses membres comme cas d'étude. ERD dessiné au feutre sur paperboard ou A3 papier. Restitution 1-2 min par groupe.
- **IA dans le module** : étape bonus du workshop ("demande à Claude/GPT de critiquer ton ERD"). Pas de bloc IA séparé, l'IA aura son module Jour 3.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 5 |
  | Exchange ouverture | 10 |
  | Pourquoi l'architecture compte (5 raisons non-dev) | 15 |
  | Vocabulaire de base | 15 |
  | 5 pièges classiques | 25 |
  | Pivot tool-agnostic | 5 |
  | Démo 3 outils | 12 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 20 |
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
