# Agenda dynamique dérivé du parcours : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dériver le slide d'agenda du deck d'introduction depuis la structure `days` du parcours, pour qu'il se régénère au build à chaque modification du parcours, et rendre ce template d'agenda générique pour tous les parcours.

**Architecture:** Un composant couche-données `<Agenda parcours="…">` lit la collection `parcours` au build, mappe chaque jour (`label` + nouveaux champs `theme` / `summary`) en items, et délègue le rendu visuel au composant `<Programme>` existant (laissé strictement inchangé). Les champs `theme` / `summary` sont optionnels au schéma mais validés (échec build bruyant) par `<Agenda>` à l'usage.

**Tech Stack:** Astro 6 (statique), MDX, collections de contenu (`astro:content` + glob loader), TypeScript, Reveal.js (rendu deck). Vérification par `astro build` (pas de runner de tests unitaires dans ce repo : on ne l'introduit pas, YAGNI).

**Spec :** `docs/superpowers/specs/2026-06-13-agenda-dynamique-parcours-design.md`

---

## Contexte git (à lire avant de committer)

L'arbre de travail n'est PAS propre au moment d'écrire ce plan : branche `deck-des-donnees-au-crm`, nombreux fichiers modifiés/non suivis sans rapport avec l'agenda. Conséquences pour l'exécution :

- **Jamais `git add -A` ni `git add .`** : toujours stager nominativement les seuls fichiers de l'agenda, listés dans chaque tâche.
- **`src/content/parcours/crm-data-automation.mdx` porte déjà des modifications non commitées** (travail en cours sur un autre sujet). Le committer (Tâche 2) embarquera donc aussi ces modifications. La stratégie de branche / d'isolement est à confirmer avec l'utilisateur AVANT toute commande git (voir handoff). Tant que ce n'est pas tranché, faire les éditions de fichiers mais **suspendre les `git commit`**.
- Messages de commit accentués : utiliser la forme `git commit -F-` avec heredoc single-quoté (préserve l'UTF-8 sur Windows ; `-m` inline corrompt les accents, cf. CLAUDE.md workspace).

## Pré-requis d'environnement

- Aucun serveur `astro dev` ne doit tourner pendant un `astro build` (sinon boucle de reload Vite, cf. `.claude/CLAUDE.md` du repo). Arrêter le dev avant toute commande build.
- Les commandes build du plan utilisent `npx astro build` (et non `npm run build`) pour **contourner le hook `prebuild`** (extraction de posters vidéo via puppeteer), inutile et lent pour une modification de contenu. Le rendu et la validation des collections sont identiques.

---

## Task 0: Pré-vol, baseline build vert

But : établir que l'arbre build proprement AVANT toute modification, pour que les échecs de build ultérieurs soient imputables à nos changements et pas au travail en cours non lié.

**Files:** aucun (vérification seule).

- [ ] **Step 1: S'assurer qu'aucun `astro dev` ne tourne**

Vérifier qu'il n'y a pas de serveur de dev actif (sinon l'arrêter). 

- [ ] **Step 2: Lancer le build baseline**

Run: `npx astro build`
Expected: build **réussi** (`Complete!` / dossier `dist/` généré, exit 0).

- [ ] **Step 3: Si le build échoue**

Si l'échec vient de fichiers non liés à l'agenda (ex. `modeliser-les-processus.mdx`, `BpmnCanvas.astro`, `Demonstration.astro`, `FilRouge.astro` en cours), **NE PAS tenter de les réparer**. Arrêter et signaler l'état à l'utilisateur (règle « quand ça ne marche pas, s'arrêter et demander »). On ne poursuit le plan que sur un baseline vert.

---

## Task 1: Schéma, champs `theme` et `summary` par jour

**Files:**
- Modify: `src/content.config.ts` (objet `day` de la collection `parcours`, autour des lignes 60-67)

- [ ] **Step 1: Ajouter les deux champs optionnels à l'objet `day`**

Dans `src/content.config.ts`, remplacer le bloc `days` actuel :

```ts
    days: z
      .array(
        z.object({
          label: z.string(),
          decks: z.array(z.string()).min(1),
        })
      )
      .optional(),
```

par :

```ts
    days: z
      .array(
        z.object({
          label: z.string(),
          // Titre éditorial du jour, ex. "Les fondations data". Optionnel au
          // schéma (un parcours sans agenda ne le remplit pas), mais requis dès
          // qu'un <Agenda> est rendu pour ce parcours (validé au build par le
          // composant, échec bruyant si absent).
          theme: z.string().optional(),
          // Description courte du jour, ex. "Collecter, nettoyer, structurer...".
          summary: z.string().optional(),
          decks: z.array(z.string()).min(1),
        })
      )
      .optional(),
```

- [ ] **Step 2: Valider le typage et le schéma**

Run: `npx astro check`
Expected: 0 erreur (le schéma reste rétro-compatible, les champs sont optionnels).

- [ ] **Step 3: Valider le build**

Run: `npx astro build`
Expected: build réussi (aucun parcours existant ne casse, les nouveaux champs étant optionnels).

- [ ] **Step 4: Commit** (suspendu tant que la stratégie git n'est pas confirmée, cf. Contexte git)

```bash
git add src/content.config.ts
git commit -F- <<'EOF'
feat(parcours): champs thème et résumé optionnels par jour

Prépare l'agenda dynamique : chaque jour d'un parcours peut porter un
thème et un résumé, source de vérité du narratif affiché par <Agenda>.
EOF
```

---

## Task 2: Frontmatter du parcours `crm-data-automation`

**Files:**
- Modify: `src/content/parcours/crm-data-automation.mdx` (bloc `days`, lignes 25-31)

- [ ] **Step 1: Relire l'état courant du fichier**

Le fichier est en cours de modification (non commité). Relire son contenu actuel avant d'éditer, pour éditer sur l'état réel sur disque.

- [ ] **Step 2: Ajouter `theme` et `summary` aux trois jours**

Remplacer le bloc `days` :

```yaml
days:
  - label: "Jour 1"
    decks: [introduction, collecte-donnees, qualite-donnees, architecture-donnees, des-donnees-au-crm, modeliser-les-processus, segmentation-activation]
  - label: "Jour 2"
    decks: [protection-donnees, marketing-automation, workflows]
  - label: "Jour 3"
    decks: [lead-nurturing, funnel-marketing, workflows-avances, ia-automation, conclusion]
```

par (narratif repris tel quel du `<Programme>` actuel de l'intro) :

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

- [ ] **Step 3: Valider le build**

Run: `npx astro build`
Expected: build réussi (le frontmatter respecte le schéma de la Tâche 1).

- [ ] **Step 4: Commit** (suspendu, cf. Contexte git ; ATTENTION ce commit embarquera aussi les modifications non liées déjà présentes dans ce fichier)

```bash
git add src/content/parcours/crm-data-automation.mdx
git commit -F- <<'EOF'
content(crm-data-automation): thème et résumé des trois jours

Porte le narratif de l'agenda dans la structure du parcours (source de
vérité unique), en vue de la dérivation par <Agenda>.
EOF
```

---

## Task 3: Composant `<Agenda>`

**Files:**
- Create: `src/components/slides/Agenda.astro`

- [ ] **Step 1: Créer le composant**

Créer `src/components/slides/Agenda.astro` avec ce contenu exact :

```astro
---
// src/components/slides/Agenda.astro
// Agenda dynamique : couche données au-dessus de <Programme>. Lit la
// structure `days` d'un parcours (label + theme + summary) et la rend en
// liste numérotée. La position du slide dans le deck reste éditoriale
// (placer ce composant où l'agenda doit apparaître). Aucun style propre :
// tout le visuel vient de Programme.astro, inchangé.
import { getCollection } from 'astro:content';
import Programme from '@/components/slides/Programme.astro';

interface Props {
  // Slug du parcours (id de collection, ex. "crm-data-automation").
  parcours: string;
  title?: string;
  italicPart?: string;
  // Image latérale ; défaut : cover du parcours si défini, sinon aucune.
  image?: string;
}

const { parcours: slug, title = 'Agenda', italicPart = 'Agenda', image } = Astro.props;

const entry = (await getCollection('parcours')).find((p) => p.id === slug);
if (!entry) {
  throw new Error(
    `<Agenda> : parcours "${slug}" introuvable dans src/content/parcours/.`
  );
}

const days = entry.data.days;
if (!days?.length) {
  throw new Error(`<Agenda> : le parcours "${slug}" n'a pas de "days" défini.`);
}

const items = days.map((d) => {
  if (!d.theme || !d.summary) {
    throw new Error(
      `<Agenda> : le jour "${d.label}" du parcours "${slug}" doit définir "theme" et "summary".`
    );
  }
  return { title: `${d.label} : ${d.theme}`, description: d.summary };
});

// brand / brandSub dérivés comme la route p/[slug].astro pour Questions/Merci.
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

- [ ] **Step 2: Valider le typage**

Run: `npx astro check`
Expected: 0 erreur. (Le composant n'est pas encore utilisé ; ce check valide juste le TS et les imports.)

- [ ] **Step 3: Valider le build**

Run: `npx astro build`
Expected: build réussi (un composant non importé n'affecte pas le rendu).

- [ ] **Step 4: Commit** (suspendu, cf. Contexte git)

```bash
git add src/components/slides/Agenda.astro
git commit -F- <<'EOF'
feat(slides): composant Agenda dérivé de la structure du parcours

Lit la collection parcours au build, mappe les jours (label + theme +
summary) en items et délègue le rendu à <Programme> (inchangé). Échec
build bruyant si parcours/jour/champ manquant.
EOF
```

---

## Task 4: Brancher l'intro sur `<Agenda>`

**Files:**
- Modify: `src/content/presentations/introduction.mdx` (imports en tête + bloc `<Programme>` final)

- [ ] **Step 1: Remplacer l'import `Programme` par `Agenda`**

Dans `src/content/presentations/introduction.mdx`, remplacer la ligne d'import :

```mdx
import Programme from '@/components/slides/Programme.astro';
```

par :

```mdx
import Agenda from '@/components/slides/Agenda.astro';
```

- [ ] **Step 2: Remplacer le slide `<Programme>` en dur par `<Agenda>`**

Remplacer le bloc complet :

```mdx
<Programme
  title="Agenda"
  italicPart="Agenda"
  brand="CRM, Data & Automation"
  brandSub="Executive Education"
  image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=1600&fit=crop"
  items={[
    { title: "Jour 1 : Les fondations data", description: "Collecter, nettoyer, structurer et activer la donnée client." },
    { title: "Jour 2 : CRM et automation", description: "Protection des données, implémentation CRM, dashboards et marketing automation." },
    { title: "Jour 3 : Industrialiser avec l'IA", description: "Lead nurturing, workflows avancés, IA et suivi des performances." },
  ]}
/>
```

par :

```mdx
<Agenda
  parcours="crm-data-automation"
  image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=1600&fit=crop"
/>
```

- [ ] **Step 3: Build**

Run: `npx astro build`
Expected: build réussi.

- [ ] **Step 4: Vérifier que l'agenda dérivé est rendu à l'identique**

Run: `grep -o "Jour [123] : [^<]*" dist/p/introduction/index.html`
Expected (les trois lignes, prouvant la composition `label : theme` depuis le frontmatter) :
```
Jour 1 : Les fondations data
Jour 2 : CRM et automation
Jour 3 : Industrialiser avec l'IA
```

Si le fichier `dist/p/introduction/index.html` n'existe pas, localiser la sortie :
Run: `grep -rl "Les fondations data" dist/p/introduction/`

- [ ] **Step 5: Vérifier qu'une des descriptions dérivées est présente**

Run: `grep -c "Collecter, nettoyer, structurer et activer la donnée client." dist/p/introduction/index.html`
Expected: `1` (la description du Jour 1 vient bien du `summary` du parcours).

- [ ] **Step 6: Commit** (suspendu, cf. Contexte git)

```bash
git add src/content/presentations/introduction.mdx
git commit -F- <<'EOF'
refactor(introduction): agenda dynamique via <Agenda>

Remplace les trois jours écrits en dur par <Agenda parcours="…">, qui
dérive l'agenda de la structure du parcours. Image latérale conservée
pour zéro régression visuelle.
EOF
```

---

## Task 5: Vérifier le mode d'échec bruyant (pas de commit)

But : prouver que `<Agenda>` fait échouer le build avec un message clair si un jour est incomplet. Modification temporaire, restaurée à la fin.

**Files:**
- Modify temporairement puis restaurer : `src/content/parcours/crm-data-automation.mdx`

- [ ] **Step 1: Retirer temporairement le `summary` du Jour 1**

Dans `src/content/parcours/crm-data-automation.mdx`, supprimer la ligne :
```yaml
    summary: "Collecter, nettoyer, structurer et activer la donnée client."
```

- [ ] **Step 2: Build, attendu en échec**

Run: `npx astro build`
Expected: build **échoue**, message contenant :
```
<Agenda> : le jour "Jour 1" du parcours "crm-data-automation" doit définir "theme" et "summary".
```

- [ ] **Step 3: Restaurer la ligne**

Remettre la ligne `summary` du Jour 1 supprimée au Step 1 (valeur exacte : `Collecter, nettoyer, structurer et activer la donnée client.`).

- [ ] **Step 4: Build, attendu vert à nouveau**

Run: `npx astro build`
Expected: build réussi (état identique à la fin de la Tâche 4).

- [ ] **Step 5: Confirmer l'arbre propre sur ce fichier**

Run: `git diff --stat src/content/parcours/crm-data-automation.mdx`
Expected : si ce fichier avait déjà des modifications non commitées non liées, elles restent ; AUCUNE différence introduite par la Tâche 5 (la ligne a été restaurée à l'identique). Aucun commit pour cette tâche.

---

## Task 6: Documenter la convention

**Files:**
- Modify: `.claude/rules/parcours.md` (ajouter une sous-section)

- [ ] **Step 1: Ajouter la section agenda dynamique**

À la fin de `.claude/rules/parcours.md`, avant la section « Pièges (gotchas) » (ou en fin de fichier si plus simple), ajouter :

```markdown
## Agenda dynamique (RÈGLE)

L'agenda d'un deck d'introduction n'est **pas écrit à la main**. On utilise le composant `<Agenda parcours="<slug>" />` (`src/components/slides/Agenda.astro`), qui dérive l'agenda de la structure `days` du parcours au build.

- Chaque jour qui doit apparaître dans l'agenda porte `theme` (titre éditorial du jour, ex. « Les fondations data ») et `summary` (description courte). Ces deux champs sont optionnels au schéma mais **requis dès qu'un `<Agenda>` cible ce parcours** : un jour incomplet fait échouer le build avec un message explicite.
- L'agenda rend une ligne par jour, au format `<label> : <theme>` + `summary`. Le `brand` (titre du parcours) et le `brandSub` (institution selon `scheme`) sont dérivés automatiquement, comme pour les slides de fin.
- Prop `image` optionnelle pour l'illustration latérale (défaut : `cover` du parcours). Le composant de présentation sous-jacent `<Programme>` reste utilisable en manuel (items écrits à la main) pour les one-shots hors parcours.
- Conséquence : modifier l'ordre des jours, un `theme`, un `summary`, ou déplacer un deck d'un jour à l'autre dans le frontmatter du parcours régénère l'agenda au prochain build, sans toucher au deck.
```

- [ ] **Step 2: Commit** (suspendu, cf. Contexte git)

```bash
git add .claude/rules/parcours.md
git commit -F- <<'EOF'
docs(parcours): documenter l'agenda dynamique et les champs jour

Convention <Agenda parcours="…"> + champs theme/summary par jour, et
règle d'échec build si un jour ciblé est incomplet.
EOF
```

---

## Definition of Done

- [ ] `npx astro build` vert avec l'intro rendant l'agenda dérivé (Tâche 4, steps 4-5 OK).
- [ ] Le mode d'échec bruyant est prouvé puis l'arbre restauré (Tâche 5).
- [ ] `src/components/slides/Programme.astro` n'a **pas** été modifié (séparation présentation / données respectée).
- [ ] La route `src/pages/p/[slug].astro` n'a **pas** été modifiée par ce travail.
- [ ] Aucun `git add -A` / `git add .` utilisé ; seuls les fichiers de l'agenda sont stagés.
- [ ] Convention documentée dans `.claude/rules/parcours.md`.

## Hors scope (rappel spec)

Vue par module / hybride, date par jour, auto-détection du parcours, migration des legacy `AgendaFull`/`AgendaLight`, agenda hors slide (page portail). Non traités.
