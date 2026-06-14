# Bascule du fil rouge : traiteur → centre de langue

Date : 2026-06-14
Parcours : CRM, Data & Automation (HEC Lausanne ExecEd, juin 2026)
Statut : design validé (brainstorming), implémentation à venir.

## Contexte et décision

Le parcours utilise un **fil rouge métier unique**, aujourd'hui un **traiteur**, posé
dans le deck `architecture-donnees` (slide « Les 4 entités fréquentes » : *« Ce schéma
sera notre fil rouge tout au long du cours »*) et repris dans deux autres decks.

Décision (validée avec Thomas) : **basculer ce fil rouge vers un centre de langue**, de
façon cohérente sur **les 3 decks concernés**. On en profite pour **ajouter un slide
« landing page + formulaire »** au début de la section construction du modèle, comme
point de départ tangible (« partir du formulaire réel, pas d'un modèle théorique »).

Périmètre confirmé : les 3 decks. Implémentation **`architecture-donnees` d'abord**
(le cœur du modèle), puis les deux autres quand leurs fichiers seront libres (voir
« Contraintes multi-agent »).

## Concept

Un **centre de langue** qui vend des cours à des **particuliers ET des entreprises**
(formations linguistiques pour les employés). Le double public B2C + B2B est ce qui
**justifie de conserver l'entité Société** : le modèle ne se restructure pas.

Intérêt pédagogique : montrer le **même schéma** (Prospect, Contact, Société, Offre)
sur un métier radicalement différent renforce le message clé du module, *« le schéma
compte plus que l'outil »*. La bascule est donc surtout du **reskin de contenu**, pas
une refonte structurelle.

Nom de travail (pour le réalisme de la landing : URL, hero) : **« Lingua Léman »**.
Modifiable.

## Modèle de données (ERD)

Les 4 entités et toutes les relations sont **inchangées** (déjà génériques). Un seul
champ change :

- `Offre.menu` (texte) → `Offre.cours` (texte), ex. valeur « Anglais B1 ».

Tout le reste du `const ERD` (Prospect, Contact, Société, relations « appartient à /
devient / pour / adressée à ») reste identique.

## Le formulaire (landing) et son mapping

Champs du formulaire et rôle dans le modèle :

| Champ formulaire | Entité / champ cible |
|---|---|
| Prénom, Nom, Email, Téléphone | Identité (Prospect.nom, puis Contact) |
| Langue visée, Niveau actuel, Objectif (pro / examen / voyage) | Prospect.besoin |
| Format (privé / groupe / en ligne) | Prospect.besoin (ou Offre.cours) |
| Particulier ou Entreprise | Prospect.type_client (décide la création d'une Société) |
| (si entreprise) Société, nb de participants | Société |
| (implicite) le formulaire lui-même | Prospect.source |
| Consentement LPD | bonne pratique (clin d'œil consentement par statut) |

Ce mapping recouvre exactement les champs `source` + `type_client` + `besoin` de
l'entité **Prospect** décrite à l'étape 1/4 (« Sa source, son type, le besoin qu'elle
exprime »). Le slide ERD suivant reste valide sans toucher à sa logique.

## Nouveau slide : la landing page

Composant : `Mockup` (mode `webform`), **existant**, déjà prévu pour rendre un faux
site avec barre d'URL, hero et formulaire.

Emplacement : dans `architecture-donnees.mdx`, **juste après** l'intercalaire
`<SubSection kicker="Mise en pratique" index="04" ...>` et **avant** le premier
`<Erd>` (« Identifier les champs collectés »).

Props envisagées (à caler visuellement sur :5000) :

- `device="mobile"` par défaut (CSS pur, **aucune dépendance d'asset**). Variantes
  `iphone` (PNG photoréaliste) ou `duo` (deux téléphones) possibles **si** les assets
  `/decks/mockups/*.png` existent : à vérifier avant de les choisir.
- `title="Tout part d'un formulaire"`, `italicPart="formulaire"`.
- `subtitle` + `bullets` (colonne gauche) expliquant que chaque champ devient une
  donnée, et que ces signaux forment le futur Prospect.
- `webform` :
  - `url="lingua-leman.ch"`
  - `headline="Apprenez une langue à votre rythme"`
  - `blurb="Dites-nous votre objectif, on vous répond sous 24h avec une proposition adaptée."`
  - `fields=["Prénom", "Nom", "Email", "Langue souhaitée", "Niveau actuel", "Particulier ou entreprise"]` (6 champs lisibles)
  - `button="Demander une information"`

Point d'implémentation : le webform de `Mockup.astro` a un eyebrow **« Guide offert »
codé en dur** (et des défauts « cedric.ch » / « Recevez le guide gratuit »). Les défauts
sont surchargés par les props, mais pas l'eyebrow. Deux options :
1. accepter « Guide offert » ;
2. ajouter une prop optionnelle `eyebrow` à l'interface `WebForm` (modif
   **rétro-compatible** : défaut « Guide offert »), pour afficher « Demande d'info ».
   À ne faire que si `Mockup.astro` est libre (composant partagé).

Recommandation : option 2 si le composant est libre, sinon option 1 en repli.

## Changements de contenu par deck

Règles de contenu à respecter partout (cf. `.claude/rules/`) : UTF-8 accents complets,
**pas d'em-dash** dans les slides, **guillemets français « » avec espace insécable
U+00A0**, nombres CHF suisses (`2'250 CHF`), pas d'emojis.

### 1. `architecture-donnees.mdx` (priorité, le cœur)

- Commentaires d'en-tête (use case traiteur) et bloc commentaire avant les Erd :
  « traiteur » → « centre de langue », « menu, couverts, prix » → « langue, niveau, prix ».
- `const ERD` : `Offre.menu` → `Offre.cours`.
- **Ajout** du slide `Mockup` (landing) après le SubSection §04.
- Slide « Les 4 entités fréquentes » (`Statement`) :
  - bullet Prospect : « une demande de devis » → « une demande d'information ».
  - bullet Offre : « le devis (menu, couverts, prix) » → « la proposition de cours
    (langue, niveau, prix) ».
- Erd 1/4 : « Fil rouge : un traiteur. » → « Fil rouge : un centre de langue. » (reste
  du sous-titre inchangé). Caption : renvoyer au formulaire qu'on vient de voir.
- Erd 2/4 : « Pour un événement d'entreprise (séminaire, inauguration) » → « Pour une
  formation en entreprise (cours pour les employés) ».
- Erd 3/4 : « on ne rédige un devis que pour une demande qualifiée » → « on ne fait une
  proposition de cours que pour une demande qualifiée ».
- Erd 4/4 : titre « Le devis, c'est une Offre » → « La proposition, c'est une Offre » ;
  sous-titre « Le menu proposé, le nombre de couverts, le prix... Le modèle du traiteur
  est complet » → « La langue, le niveau, le format, le prix... Le modèle du centre de
  langue est complet ».
- Slide pièges 2/2 : exemple picklist « resto / Restaurant / restauration » → exemple
  langue (« anglais / Anglais / ANG »). Optionnel, mineur.
- Slide `Capture` « Même schéma, trois tailles » : déjà générique (Contact + Société +
  Offre), aucun changement nécessaire.

### 2. `des-donnees-au-crm.mdx`

- Slide `Table` (CDP/CRM/ERP), ligne « Côté traiteur » → « Côté centre de langue » :
  adapter les 3 cellules (« Suivre les devis / inscriptions, relancer les prospects » ;
  « Réconcilier l'apprenant (web, tél, salon) » ; « Facturation, paie des formateurs »).
- Slide `DataPipeline` : l'exemple « Le Pont / restaurant / 40 couverts / Restauration /
  lepont.ch » → un prospect entreprise du centre de langue, ex. « TechCorp / techcorp.ch /
  Informatique / 50 employés / Lausanne ». Adapter les `data[]` brutes/nettoyées/enrichies
  et les `fields` de la fiche CRM.

### 3. `modeliser-les-processus.mdx`

- `SubSection` : « de la demande de devis à la réception, chez un traiteur » → « de la
  demande d'info au démarrage des cours, dans un centre de langue ».
- `Capture` (Blueprint Zoho) : sous-titre et rows :
  - États « Demande reçue, Qualifiée, Devis envoyé, Accepté, Dégustation, Réception » →
    « Demande reçue, Qualifiée, Proposition envoyée, Acceptée, Cours d'essai, Démarrage ».
  - Gateway « Devis accepté ? » → « Proposition acceptée ? ».
- À VÉRIFIER : `BpmnCanvas.astro` rend une démo de processus. Si les libellés du processus
  (activités, états) sont **codés en dur dans le composant**, il faut les adapter là
  (composant possiblement spécifique à ce deck). Lire `BpmnCanvas.astro` avant.

## Ordre d'implémentation et contraintes multi-agent

Plusieurs agents travaillent sur la même branche, port 5000 partagé.

1. **`architecture-donnees.mdx` est actuellement modifié non commité** par un autre agent
   (ainsi que `Statement.astro`). Ne pas l'éditer tant qu'il n'est pas commité / libéré :
   éditer par-dessus écraserait son travail. **Revérifier juste avant** (git status +
   mtime).
2. **`des-donnees-au-crm.mdx`** était également modifié non commité : même prudence.
3. `modeliser-les-processus.mdx` était propre au dernier point : à reconfirmer.
4. Ne pas relancer de serveur sur le port 5000 (déjà actif). Ne pas `npm run build`
   pendant qu'`astro dev` tourne (boucle de reload Vite).
5. Git : aucun `git add -A` / `pull` / `push` à l'aveugle. Commits ciblés par path
   uniquement, et seulement sur demande explicite.

Séquence : (a) architecture-donnees dès qu'il est libre ; (b) des-donnees-au-crm ;
(c) modeliser-les-processus (après lecture de BpmnCanvas.astro).

## Points à vérifier avant / pendant l'implémentation

- Assets `/decks/mockups/*.png` (pour `device="iphone"` ou `"duo"`) ; sinon `"mobile"`.
- `Mockup.astro` libre si on ajoute la prop `eyebrow`.
- `BpmnCanvas.astro` : libellés de processus en dur ?
- Hauteur de la carte ERD avec `Offre.cours` (1 champ, pas de risque de débordement).

## Vérification (definition of done)

- Rendu visuel sur `http://localhost:5000` des 3 decks : aucune mention résiduelle de
  traiteur / menu / couverts / dégustation.
- Le nouveau slide landing s'affiche entre le SubSection §04 et le 1er Erd, formulaire
  lisible.
- Cohérence du fil rouge centre de langue de bout en bout du parcours.
- Respect des règles de contenu (accents, pas d'em-dash, guillemets insécables).
- `npm run build` propre (lancé seulement après avoir stoppé le dev).
