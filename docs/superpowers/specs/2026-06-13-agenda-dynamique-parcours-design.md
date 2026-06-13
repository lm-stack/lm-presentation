# Agenda dynamique dérivé du parcours

Date : 2026-06-13
Repo : `lm-presentation`
Statut : design validé, prêt pour plan d'implémentation

## Problème

L'agenda du parcours est aujourd'hui écrit à la main dans le deck d'introduction
(`src/content/presentations/introduction.mdx`) via le composant `<Programme>`, avec
les trois jours en dur :

```mdx
<Programme
  title="Agenda"
  italicPart="Agenda"
  items={[
    { title: "Jour 1 : Les fondations data", description: "Collecter, nettoyer, structurer et activer la donnée client." },
    { title: "Jour 2 : CRM et automation", description: "Protection des données, implémentation CRM, dashboards et marketing automation." },
    { title: "Jour 3 : Industrialiser avec l'IA", description: "Lead nurturing, workflows avancés, IA et suivi des performances." },
  ]}
/>
```

Or la structure des jours existe déjà comme source de vérité dans le frontmatter du
parcours (`src/content/parcours/crm-data-automation.mdx`, champ `days`). Les deux ne
sont pas liés : modifier l'ordre des jours, déplacer un deck d'un jour à l'autre, ou
renommer un jour dans le parcours ne change rien à l'agenda affiché. Le narratif est
dupliqué et diverge silencieusement.

## Objectif

Dériver l'agenda de la structure `days` du parcours, pour que toute modification du
parcours régénère l'agenda au build, sans toucher au deck. Un seul template d'agenda,
générique, réutilisable par n'importe quel deck d'introduction de n'importe quel
parcours.

## Décisions (validées en brainstorming)

1. **Granularité : vue par jour (résumé).** Une ligne par jour : un thème + une
   description courte. Garde exactement le rendu actuel de l'intro. Le narratif de
   chaque jour devient une donnée du parcours (source de vérité unique).
2. **Référence : prop explicite.** `<Agenda parcours="crm-data-automation" />`.
   L'auteur nomme le slug du parcours. Pas d'auto-détection (évite la magie et
   l'ambiguïté d'un deck appartenant à deux parcours).
3. **Dates : label seul.** L'agenda affiche `Jour 1 : Les fondations data`. Les dates
   globales sont déjà portées par l'`eyebrow` du parcours (`25, 26, 27 juin 2026`).
   Pas de date par jour.

## Architecture

### Approche retenue

Un composant intelligent `<Agenda>` placé dans le MDX à l'endroit éditorial voulu.
Il lit la collection `parcours` au build, mappe les `days` en items, et délègue le
rendu visuel au composant `<Programme>` existant, laissé inchangé.

Approches écartées :

- **Auto-injection par la route** (comme `Questions` / `Merci`) : la position de
  l'agenda dans l'intro est éditoriale (après le tour de table, avant la suite), pas
  une position de fin fixe. Une injection à position figée serait fausse.
- **Script de synchronisation qui réécrit le MDX** : sur-ingénierie. Le build statique
  Astro recompute déjà tout à chaque build (et en live en dev). La dérivation au build
  donne « rebuild à chaque modif » gratuitement.

### Séparation des responsabilités

- `Programme.astro` : composant de **présentation pur**, inchangé. Prend `items`,
  `brand`, `brandSub`, `image`, `title`, `italicPart`. Reste utilisable en manuel pour
  les présentations one-shot (items écrits à la main).
- `Agenda.astro` : **couche données**. Prend un slug de parcours, calcule les items
  depuis `days`, dérive `brand` / `brandSub`, et rend `<Programme>`. Ne porte aucun
  style propre.

## Détail des changements

### 1. Schéma (`src/content.config.ts`)

Ajouter deux champs optionnels à chaque objet `day` de la collection `parcours` :

```ts
days: z
  .array(
    z.object({
      label: z.string(),
      // Titre éditorial du jour, ex. "Les fondations data". Requis dès qu'un
      // <Agenda> est rendu pour ce parcours (validé au build par le composant).
      theme: z.string().optional(),
      // Description courte du jour, ex. "Collecter, nettoyer, structurer...".
      summary: z.string().optional(),
      decks: z.array(z.string()).min(1),
    })
  )
  .optional(),
```

`theme` et `summary` restent **optionnels au schéma** : un parcours qui n'utilise pas
d'agenda (ex. `template-parcours`) n'est pas forcé de les remplir. La validation
stricte (présence obligatoire) est faite par le composant `<Agenda>` au moment où il
est utilisé (échec bruyant, voir plus bas).

### 2. Frontmatter du parcours (`src/content/parcours/crm-data-automation.mdx`)

Porter le narratif existant (repris tel quel du `<Programme>` actuel) dans `days` :

```yaml
days:
  - label: "Jour 1"
    theme: "Les fondations data"
    summary: "Collecter, nettoyer, structurer et activer la donnée client."
    decks: [introduction, collecte-donnees, qualite-donnees, architecture-donnees, des-donnees-au-crm, modeliser-les-processus, segmentation-activation]
  - label: "Jour 2"
    theme: "CRM et automation"
    summary: "Protection des données, implémentation CRM, dashboards et marketing automation."
    decks: [protection-donnees, marketing-automation, workflows]
  - label: "Jour 3"
    theme: "Industrialiser avec l'IA"
    summary: "Lead nurturing, workflows avancés, IA et suivi des performances."
    decks: [lead-nurturing, funnel-marketing, workflows-avances, ia-automation, conclusion]
```

### 3. Composant `<Agenda>` (`src/components/slides/Agenda.astro`)

Props :

| Prop | Type | Requis | Rôle |
|------|------|--------|------|
| `parcours` | `string` | oui | Slug du parcours (id de la collection, ex. `crm-data-automation`). |
| `title` | `string` | non | Titre du slide. Défaut `"Agenda"`. |
| `italicPart` | `string` | non | Partie du titre mise en valeur. Défaut `"Agenda"`. |
| `image` | `string` | non | Image latérale. Défaut : `cover` du parcours (si défini), sinon aucune. |

Logique (au build, dans le script du composant) :

1. `getCollection('parcours')` puis `find((p) => p.id === parcours)`.
2. Mapper chaque `day` en `{ title: \`${label} : ${theme}\`, description: summary }`.
3. Dériver `brand` = `entry.data.title` ; `brandSub` = institution selon
   `entry.data.scheme` (`execed` -> `"Executive Education"`, `lm` -> `"Lausanne
   Marketing"`), même table que `src/pages/p/[slug].astro` pour `Questions` / `Merci`.
4. Rendre `<Programme title italicPart items image brand brandSub />`.

Esquisse :

```astro
---
import { getCollection } from 'astro:content';
import Programme from '@/components/slides/Programme.astro';

interface Props {
  parcours: string;
  title?: string;
  italicPart?: string;
  image?: string;
}
const { parcours: slug, title = 'Agenda', italicPart = 'Agenda', image } = Astro.props;

const entry = (await getCollection('parcours')).find((p) => p.id === slug);
if (!entry) {
  throw new Error(`<Agenda> : parcours "${slug}" introuvable dans src/content/parcours/.`);
}
const days = entry.data.days;
if (!days?.length) {
  throw new Error(`<Agenda> : le parcours "${slug}" n'a pas de "days".`);
}
const items = days.map((d) => {
  if (!d.theme || !d.summary) {
    throw new Error(`<Agenda> : le jour "${d.label}" (${slug}) doit définir "theme" et "summary".`);
  }
  return { title: `${d.label} : ${d.theme}`, description: d.summary };
});

const INSTITUTION: Record<string, string> = {
  execed: 'Executive Education',
  lm: 'Lausanne Marketing',
};
const brand = entry.data.title;
const brandSub = INSTITUTION[entry.data.scheme];
const sideImage = image ?? entry.data.cover;
---
<Programme
  title={title}
  italicPart={italicPart}
  items={items}
  image={sideImage}
  brand={brand}
  brandSub={brandSub}
/>
```

### 4. Mode d'échec (bruyant)

Toute incohérence fait **échouer le build** avec un message explicite, jamais de rendu
silencieux faux. Cohérent avec la règle existante « un deck sans jour fait échouer le
build » (`parcours.md`). Trois cas :

- `parcours` introuvable.
- Parcours sans `days`.
- Un jour sans `theme` ou sans `summary`.

### 5. Intro (`src/content/presentations/introduction.mdx`)

Remplacer le bloc `<Programme items={[...12 lignes en dur...]}/>` par :

```mdx
<Agenda
  parcours="crm-data-automation"
  image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=1600&fit=crop"
/>
```

L'`image` est conservée explicitement pour ne pas changer le visuel actuel (l'image
latérale n'est ni la cover du deck ni celle du parcours, c'est un choix éditorial).
L'import `Programme` devient inutile dans ce deck : remplacé par l'import `Agenda`.

## Fichiers touchés

| Fichier | Changement |
|---------|-----------|
| `src/content.config.ts` | + `theme` et `summary` (optionnels) sur l'objet `day`. |
| `src/content/parcours/crm-data-automation.mdx` | + `theme` / `summary` sur les 3 jours. |
| `src/components/slides/Agenda.astro` | Nouveau composant (couche données -> `Programme`). |
| `src/content/presentations/introduction.mdx` | `<Programme items=…>` remplacé par `<Agenda parcours=…>` ; import ajusté. |
| `.claude/rules/parcours.md` | + note : `theme` / `summary` par jour, et `<Agenda parcours="…">` pour l'agenda dynamique. |

## Comportement « rebuild à chaque modification »

Acquis par construction : l'agenda est dérivé au build de la collection `parcours`.
Modifier l'ordre des jours, un `theme`, un `summary`, ou déplacer un deck d'un jour à
l'autre dans le frontmatter du parcours, puis `npm run build` (ou le serveur de dev en
live), régénère l'agenda. Aucune édition du deck d'intro nécessaire.

## Vérification

- `npm run build` passe (le deck d'intro rend l'agenda dérivé sans erreur).
- L'agenda rendu est visuellement identique à l'actuel (3 lignes, mêmes textes, même
  image latérale, même header de marque).
- Test du mode d'échec : retirer temporairement un `summary` d'un jour -> le build
  échoue avec le message attendu. (À retirer après vérification.)
- Vérifier qu'un parcours sans `days` (`template-parcours`) build toujours (il
  n'utilise pas `<Agenda>`).

## Hors scope (YAGNI)

- Vue par module ou hybride (listing des decks sous chaque jour) : écartées au profit
  de la vue par jour.
- Date par jour dans l'agenda : écartée (label seul).
- Auto-détection du parcours depuis le deck courant : écartée (prop explicite).
- Migration des composants legacy `AgendaFull` / `AgendaLight` (déjà marqués « à
  archiver » dans `typographie.md`) : hors sujet.
- Génération de l'agenda ailleurs que dans un slide (ex. page portail du parcours, qui
  liste déjà les decks) : non demandé.
