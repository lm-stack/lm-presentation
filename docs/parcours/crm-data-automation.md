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
- **Outils démo (3)** : Excel (TPE et associations), Airtable (PME en croissance), Zoho (grande structure). Un par taille d'entreprise. L'angle "tool-agnostic" prend tout son sens : même schéma, trois véhicules calibrés sur trois échelles.
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

### Module Collecte et qualité des données (Jour 1, sujet 2)

- **Durée** : 120 min (2h)
- **Fil rouge** : la landing page de **Cédric**, construite dans le module Growth Marketing qui précède celui-ci. Suite directe de leur travail de la semaine précédente. Ce fil rouge se prolonge ensuite dans les modules workflow (Jour 2) et workflows avancés (Jour 3) où on automatise SUR cette donnée propre.
- **Thèse centrale** : "Ne demande que ce que tu ne peux pas déduire."
- **Sources couvertes (5)** : formulaires web, achats/transactions, imports manuels, synchronisations API, saisie manuelle équipe.
- **Cleaning (5 techniques)** : email (lowercase + MX validation), téléphone (E.164 via libphonenumber), nom/prénom (Title Case + trim emojis), doublons (strict + fuzzy), dates et codes postaux (format ISO).
- **Enrichment (4 cas)** : Genderize.io (genre depuis prénom), Clearbit/Apollo (société depuis email pro), IPstack (géoloc depuis IP), Claude/GPT API (structuration de texte libre).
- **Démo live** : pipeline n8n complet du formulaire de Cédric vers le CRM avec cleaning et enrichment automatisés.
- **Workshop** : multi-groupes, chaque groupe reprend la landing page d'un de ses membres et conçoit le flow complet form → cleaning → enrichment → CRM. Bonus : critique IA du pipeline.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 5 |
  | Recap Growth Marketing (Cédric) | 5 |
  | Section Sources et capture | 30s |
  | 5 sources de données | 10 |
  | 4 règles de bonne capture | 10 |
  | Section Cleaning | 30s |
  | 5 techniques de cleaning | 15 |
  | Section Enrichment | 30s |
  | 4 cas d'enrichment (Genderize central) | 15 |
  | Statement pivot | 5 |
  | Section Qualité comme processus | 30s |
  | 3 piliers (métriques, routines, ownership) | 10 |
  | Démo live (Cédric) | 12 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 17 |
  | Restitution + débrief | 5 |

- **Détails Cédric à confirmer** : métier, lead magnet précis, champs du formulaire, outil de construction. À oraliser sur la base des slides existantes du module Growth Marketing le jour J.

### Module Segmentation et activation (Jour 1, sujet 3)

- **Durée** : 120 min (2h)
- **Thèse centrale** : "Segmenter sans activer, c'est perdre son temps."
- **Articulation** : sujet 1 = schéma, sujet 2 = donnée propre, sujet 3 = USAGE de la donnée. Bascule de la matinée structurelle vers l'après-midi opérationnel.
- **Cinq axes de segmentation** : démographique, comportemental, valeur (RFM), cycle de vie, prédictif (IA).
- **Clarification vocabulaire** : persona (modèle mental, ne se filtre pas) vs segment (sous-ensemble filtrable et actionnable).
- **Trois leviers IA** : clustering automatique (HubSpot Lists Auto / Einstein), lookalike (jumeaux statistiques pour ads et prospection), predictive scoring (propension / churn / LTV).
- **Quatre modes d'activation** : séquence email automatisée, email transactionnel déclenché (chirurgical), audience publicitaire (retargeting Meta/LinkedIn/Google), handover commercial.
- **Démo live** : reprise de la base Cédric du sujet 2, création de 3 segments distincts dans Zoho avec activations alignées.
- **Workshop** : multi-groupes, reprise de la boîte désignée au sujet 2 (cohérence du fil rouge). Output : tableau segments × critères × activation × premier message.
- **Structure timing** :

  | Bloc | Durée |
  |------|-------|
  | Cover + Calendar | 5 |
  | Recap (data propre, on l'utilise) | 5 |
  | Section Pourquoi segmenter | 30s |
  | Statement spray and pray | 8 |
  | Section Axes de segmentation | 30s |
  | 5 axes classiques | 15 |
  | TwoColumnTable persona vs segment | 8 |
  | 3 leviers IA | 12 |
  | Section L'activation | 30s |
  | Statement pivot | 5 |
  | 4 modes d'activation | 12 |
  | Section Mettre en pratique | 30s |
  | Démo live (Cédric, 3 segments) | 15 |
  | Workshop brief | 3 |
  | Workshop multi-groupes | 17 |
  | Restitution + débrief | 10 |
