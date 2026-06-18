# CRM, Data & Automation (HEC Lausanne ExecEd, juin 2026)

Contexte de référence du parcours. À consulter avant de toucher un deck. Source de vérité de la structure : le frontmatter de `src/content/parcours/crm-data-automation.mdx`.

## Brochure

- Diplôme : Formation courte (FC), 2.5 crédits ECTS
- Durée : 3 jours sur 1 mois, 9h00 à 17h00, présentiel, français
- Prix : 2'250 CHF (rabais 10% pour Alumni HEC)
- Brochure source : `source/execed-brochure-fc-crma.pdf`

## Public cible

Responsables marketing digital, CRM managers, growth marketers, chefs de projet digital, data analysts marketing, chefs d'entreprise. Audience mixte (de l'association à la multinationale) et non technique.

## Compétences cibles (brochure)

Conduire la gouvernance des données ; diriger l'implémentation CRM ; piloter une stratégie d'automatisation ; modéliser et optimiser les processus ; rationaliser les opérations marketing ; visualiser les performances marketing.

## Structure réelle (14 decks, 3 jours)

| Jour | Thème | Decks (ordre) |
|------|-------|---------------|
| Jour 1 | Les fondations data | introduction, collecte-donnees, architecture-donnees, qualite-donnees, des-donnees-au-crm |
| Jour 2 | CRM et automation | modeliser-les-processus, digitaliser-les-processus, marketing-automation, protection-donnees, workflow |
| Jour 3 | Industrialiser avec l'IA | segmentation-activation, ia-automation, strategie-data-automation, visualisation-donnees, conclusion |

## Couverture des 12 modules de la brochure

| Module brochure | Deck(s) |
|-----------------|---------|
| Modélisation des processus | modeliser-les-processus |
| Architecture des données | architecture-donnees |
| Collecte et nettoyage des données | collecte-donnees + qualite-donnees |
| Segmentation client | segmentation-activation |
| Protection des données | protection-donnees (intervenant externe Yvann Barras / YBCS, support sur Moodle, deck réduit) |
| Implémentation CRM | des-donnees-au-crm + digitaliser-les-processus |
| Data visualisation et dashboards | visualisation-donnees |
| Marketing automation | marketing-automation |
| Lead nurturing | segmentation-activation (fusionné) |
| Workflows avancés | couvert dans workflow + strategie-data-automation (pas de deck dédié) |
| IA & automatisation | ia-automation |
| Suivi des performances | visualisation-donnees |

## Principes pédagogiques

- **Public non technique** : pas de jargon non expliqué (DB, API, MCP...), toujours le « pourquoi » avant le « comment ».
- **Audience mixte** : les exemples doivent parler de l'association à la multinationale.
- **Pas de personnage fil rouge unique imposé** : chaque module prend l'exemple le plus parlant pour son sujet (formulaire générique, centre de langue, maison horlogère, etc.). Les exemples sont illustratifs, pas un récit à suivre d'un bout à l'autre.

### Messages-clés (à tisser dans les modules)

1. **Tool-agnostic** : un CRM, c'est une logique, pas un outil. Le schéma compte plus que l'outil.
2. **PME power** : ce qui était inaccessible il y a cinq ans est trivial aujourd'hui avec les bons outils.
3. **IA partout** : intégrée dans les modules, pas cantonnée à un module isolé.

## Examen

Un seul projet, sur leur propre entreprise (ou un cas au choix), décliné en quatre livrables, chacun quasi l'output d'un workshop :

| Livrable | Poids | Workshop source |
|----------|-------|-----------------|
| Architecture de données (ERD) | 25 % | architecture-donnees |
| Processus modélisés (BPMN) | 25 % | modeliser-les-processus |
| Workflow automatisé | 25 % | workflow |
| Stratégie data & automation | 25 % | strategie-data-automation |

Format : dossier écrit individuel, une section par livrable, rendu après la formation (délai sur Moodle). Présenté dans `introduction` (section « L'examen »).

## Notes

- Tous les decks sont `unlisted` et en `scheme: execed`.
- Les slides de fin (Questions / Merci) sont auto-injectées par la route : ne pas les écrire à la main.
- L'agenda (`AgendaDays`) et le récap de fin (`Recap`) se dérivent automatiquement du frontmatter du parcours et du contenu des decks (workshops et `<Demo>`) : modifier le frontmatter régénère tout au build.
- `protection-donnees` est volontairement réduit (intervenant externe, support sur Moodle).
