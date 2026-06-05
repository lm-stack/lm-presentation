# lm-presentation v3 : extraire les 12 modules de contenu réutilisables

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Convertir les contenus pédagogiques de `source/2025/` (cours Growth Marketing 2025 ExecEd) en 12 modules Astro réutilisables dans `src/components/modules/`. Chaque module compose les layouts du catalogue (livré en v1+v2) avec un contenu spécifique. À la fin, un nouveau deck `growth-marketing-2025` assemble tous les modules pour valider l'ensemble.

**Architecture :** Un fichier `.astro` par module dans `src/components/modules/`. Chaque module rend un ou plusieurs `<section>` Reveal en utilisant les layouts existants (`Cover`, `Title`, `Statement`, `TableSlide`, `NumberedCards`, `NumberedCardWithDetail`, `BigImage`, `Workshop`, `Calendar`, `Quote`, `Custom`, `Closing`). Pas de prop : le contenu est figé dans le module (c'est l'intérêt). Si Thomas veut customiser, on fork ou on ajoute une prop ciblée plus tard.

**Tech Stack :** Inchangé par rapport à v2 (Astro 6, Tailwind v4, Reveal.js 5). Aucune nouvelle dépendance.

**Hors scope (à traiter dans plans suivants) :** rédaction complète du deck CRM Data Auto (plan v4), refonte du deck `crm-data-automation.mdx` actuel pour qu'il consomme les modules, polish design (animations, transitions custom).

**Précondition :** travailler depuis `main`, working tree clean, build OK. Vérifier avant d'attaquer :

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git pull origin main
git status
npm run build
```

---

## Phase 1 : Modules workflow (réutilisent NumberedCardWithDetail)

> Le dossier `src/components/modules/` n'existe pas encore. Pas besoin de le créer manuellement : l'outil d'écriture du premier module crée le dossier parent en même temps. On commence donc directement par les modules.

### Task 1 : `modules/StackPetiteStructure.astro`

**Files :**
- Create : `src/components/modules/StackPetiteStructure.astro`

Module qui encapsule le tableau "stack pour petite structure" déjà présent inline dans `crm-data-automation.mdx`. Source : `35 - Conclusion.pdf` page 3.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/StackPetiteStructure.astro
import TableSlide from '@/components/slides/TableSlide.astro';
---
<TableSlide
  title="Stack pour petite structure"
  subtitle="Moins de 50 CHF par mois"
  highlight="50 CHF"
  intro="C'est une illusion de penser que les outils nécessitent des investissements élevés. Voici une proposition de stack digital pour les petites structures sans budget."
  headers={['Nom', 'Fonction', 'Prix']}
  rows={[
    ['Brevo', 'CRM, Landing page, Emailing, Calendly like', '13 CHF'],
    ['Airtable', 'Base de données', 'Gratuit'],
    ['Zapier', "Outil d'automatisation", 'Gratuit'],
    ['Infomaniak', 'Hébergement, nom de domaine', '11 CHF'],
    ['WordPress', 'Site web', 'Gratuit'],
    ['Bexio', 'Comptabilité et finance', '25 CHF'],
    ['Canva', 'Outil de design', 'Gratuit'],
    ['ChatGPT', 'IA générative', 'Gratuit'],
  ]}
/>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/StackPetiteStructure.astro
git commit -m "feat: module StackPetiteStructure (table outils petite structure)"
```

---

### Task 2 : `modules/Workflow01Engagement.astro`

**Files :**
- Create : `src/components/modules/Workflow01Engagement.astro`

Source : `31 - Funnel marketing.pdf` page 8. Workflow d'analyse d'engagement avec déclencheur/prérequis/actions.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/Workflow01Engagement.astro
import NumberedCardWithDetail from '@/components/slides/NumberedCardWithDetail.astro';
---
<NumberedCardWithDetail
  title="Funnel marketing"
  subtitle="Exemples de workflows d'automatisation"
  number="01"
  cardTitle="Analyse d'engagement"
  cardDescription="Suivi des interactions avec vos contenus et offres"
  details={[
    { label: 'Déclencheur', text: 'Le lead X a visité la page pricing 2 fois en 3 jours.' },
    { label: 'Prérequis', text: 'Tracking des pages (Hubspot, ActiveCampaign, Brevo, etc.).' },
    { label: 'Actions', text: "Envoi d'une offre d'essai spéciale valable deux jours (FOMO)." },
  ]}
  image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&h=900&fit=crop"
/>
```

Note : l'image Unsplash sert de placeholder visuel. Si Thomas veut l'image originale du PDF, il peut l'extraire et la mettre dans `public/assets/modules/workflow-01.jpg` puis ajuster `image="/assets/modules/workflow-01.jpg"`.

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/Workflow01Engagement.astro
git commit -m "feat: module Workflow01Engagement (analyse d'engagement)"
```

---

### Task 3 : `modules/Workflow02Nurturing.astro`

**Files :**
- Create : `src/components/modules/Workflow02Nurturing.astro`

Source : `31 - Funnel marketing.pdf` page 10. Workflow de lead nurturing avec déclencheur webinar.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/Workflow02Nurturing.astro
import NumberedCardWithDetail from '@/components/slides/NumberedCardWithDetail.astro';
---
<NumberedCardWithDetail
  title="Funnel marketing"
  subtitle="Exemples de workflows d'automatisation"
  number="02"
  cardTitle="Lead nurturing"
  cardDescription="Communications régulières et personnalisées"
  details={[
    { label: 'Déclencheur', text: 'Le lead X a participé à un webinar.' },
    { label: 'Prérequis', text: 'Tracking de la participation au webinar (auto, manuel, etc.).' },
    { label: 'Actions', text: 'Envoyer une séquence de trois emails adaptés.' },
  ]}
  image="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&h=900&fit=crop"
/>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/Workflow02Nurturing.astro
git commit -m "feat: module Workflow02Nurturing (lead nurturing)"
```

---

### Task 4 : `modules/Workflow03Matching.astro`

**Files :**
- Create : `src/components/modules/Workflow03Matching.astro`

Source : `31 - Funnel marketing.pdf` page 11. Workflow d'analyse de correspondance.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/Workflow03Matching.astro
import NumberedCardWithDetail from '@/components/slides/NumberedCardWithDetail.astro';
---
<NumberedCardWithDetail
  title="Funnel marketing"
  subtitle="Exemples de workflows d'automatisation"
  number="03"
  cardTitle="Analyse de correspondance"
  cardDescription="Matching avec le profil d'un client idéal"
  details={[
    { label: 'Déclencheur', text: 'Le lead X remplit un formulaire.' },
    { label: 'Prérequis', text: 'Enrichissement des données (Clearbit, Dropcontact, etc.).' },
    { label: 'Actions', text: 'Classification du lead en fonction du matching.' },
  ]}
  image="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&h=900&fit=crop"
/>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/Workflow03Matching.astro
git commit -m "feat: module Workflow03Matching (analyse de correspondance)"
```

---

### Task 5 : `modules/Workflow04Scoring.astro`

**Files :**
- Create : `src/components/modules/Workflow04Scoring.astro`

Source : `31 - Funnel marketing.pdf` page 12. Workflow de lead scoring.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/Workflow04Scoring.astro
import NumberedCardWithDetail from '@/components/slides/NumberedCardWithDetail.astro';
---
<NumberedCardWithDetail
  title="Funnel marketing"
  subtitle="Exemples de workflows d'automatisation"
  number="04"
  cardTitle="Lead scoring"
  cardDescription="Notation des leads selon leurs comportements"
  details={[
    { label: 'Déclencheur', text: 'Le lead X réalise des actions diverses.' },
    { label: 'Prérequis', text: 'Tracking et grille de scoring adaptée à votre organisation.' },
    { label: 'Actions', text: 'Ajout ou suppression de points selon les actions du lead.' },
  ]}
  image="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=900&h=900&fit=crop"
/>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/Workflow04Scoring.astro
git commit -m "feat: module Workflow04Scoring (lead scoring)"
```

---

## Phase 2 : Module FunnelTOFUMOFUBOFU (visuel pyramide)

### Task 6 : `modules/FunnelTOFUMOFUBOFU.astro`

**Files :**
- Create : `src/components/modules/FunnelTOFUMOFUBOFU.astro`

Source : `31 - Funnel marketing.pdf` page 5. Pyramide inversée TOFU/MOFU/BOFU avec 3 niveaux + 3 descriptions à droite. Utilise le layout `Custom` avec HTML/CSS inline.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/FunnelTOFUMOFUBOFU.astro
import SlideTitle from '@/components/SlideTitle.astro';
import { Icon } from 'astro-icon/components';
---
<section class="funnel-tofu" data-layout="funnel-tofu">
  <SlideTitle title="Funnel marketing" subtitle="Étapes importantes" />
  <div class="funnel-tofu__grid">
    <div class="funnel-tofu__pyramid">
      <div class="funnel-tofu__band funnel-tofu__band--top">
        <Icon name="ph:megaphone" />
      </div>
      <div class="funnel-tofu__band funnel-tofu__band--middle">
        <Icon name="ph:target" />
      </div>
      <div class="funnel-tofu__band funnel-tofu__band--bottom">
        <Icon name="ph:handshake" />
      </div>
    </div>
    <ul class="funnel-tofu__legend">
      <li>
        <h3>TOFU</h3>
        <p>Top of the funnel : Attirer</p>
      </li>
      <li>
        <h3>MOFU</h3>
        <p>Middle of the funnel : Convertir</p>
      </li>
      <li>
        <h3>BOFU</h3>
        <p>Bottom of the funnel : Conclure</p>
      </li>
    </ul>
  </div>
</section>

<style>
  .funnel-tofu {
    justify-content: flex-start !important;
  }
  .funnel-tofu__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 96px;
    align-items: center;
    max-width: 1500px;
    margin: 0 auto;
    width: 100%;
  }
  .funnel-tofu__pyramid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .funnel-tofu__band {
    background: #191919;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 130px;
  }
  .funnel-tofu__band :global(svg) {
    width: 56px;
    height: 56px;
  }
  .funnel-tofu__band--top {
    width: 100%;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
  }
  .funnel-tofu__band--middle {
    width: 80%;
    clip-path: polygon(6.25% 0, 93.75% 0, 81.25% 100%, 18.75% 100%);
  }
  .funnel-tofu__band--bottom {
    width: 60%;
    clip-path: polygon(8.33% 0, 91.67% 0, 50% 100%, 50% 100%);
    height: 130px;
  }
  .funnel-tofu__legend {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .funnel-tofu__legend h3 {
    font-size: 32px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 4px;
  }
  .funnel-tofu__legend p {
    font-size: 22px;
    color: #6B6F84;
    margin: 0;
  }
</style>
```

Note : la pyramide utilise des `clip-path` polygons pour créer l'effet trapèze inversé. Si le rendu n'est pas pixel-perfect par rapport au PDF original, ajuster les coordonnées dans `clip-path`. Les icônes Phosphor `ph:megaphone`, `ph:target`, `ph:handshake` sont disponibles via `@iconify-json/ph` déjà installé.

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/FunnelTOFUMOFUBOFU.astro
git commit -m "feat: module FunnelTOFUMOFUBOFU (pyramide inversee 3 etages)"
```

---

## Phase 3 : Modules pédagogiques multi-slides

### Task 7 : `modules/LeadNurturingPrincipes.astro`

**Files :**
- Create : `src/components/modules/LeadNurturingPrincipes.astro`

Source : `30 - Lead nurturing.pdf` pages 4-10. Module composé de 5 slides : Définition + Statement clé + 2 stats marquantes + 3 objectifs.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/LeadNurturingPrincipes.astro
import Statement from '@/components/slides/Statement.astro';
import SlideTitle from '@/components/SlideTitle.astro';
---
<section class="lead-nurturing-def" data-layout="lead-nurturing-def">
  <SlideTitle title="Lead nurturing" subtitle="Définition" />
  <div class="lead-nurturing-def__body">
    <h3>Stimulation des leads pour <span class="underline">maintenir leur intérêt</span></h3>
    <p>Concerne généralement tous les leads pas encore assez matures pour une conversion.</p>
    <p>Permet d'entretenir la relation et de bâtir une relation de confiance avec la marque.</p>
  </div>
</section>

<Statement>
Dans un monde où nous sommes tous ultra sollicités et où il faut toujours plus de touchpoints pour convertir, le lead nurturing est une formidable occasion de <span class="underline">créer une relation de confiance</span>.
</Statement>

<section class="lead-nurturing-stat" data-layout="lead-nurturing-stat">
  <SlideTitle title="Lead nurturing" subtitle="Pourquoi c'est si important ?" />
  <p class="lead-nurturing-stat__intro">
    Discuter et nourrir la relation avec un lead, c'est d'abord et avant tout comprendre qu'un lead ne veut pas qu'on lui parle, <span class="underline">il veut qu'on l'écoute</span>.
  </p>
  <div class="lead-nurturing-stat__figure">
    <span class="lead-nurturing-stat__big">79%</span>
    <p>des leads marketing ne convertissent jamais en vente à cause d'un manque de lead nurturing</p>
    <cite>MarketingSherpa</cite>
  </div>
</section>

<section class="lead-nurturing-stat" data-layout="lead-nurturing-stat">
  <SlideTitle title="Lead nurturing" subtitle="Pourquoi c'est si important ?" />
  <p class="lead-nurturing-stat__intro">
    C'est aussi un lead qui souhaite bénéficier d'une <span class="underline">expérience transversale, uniforme et ultra personnalisée</span>, quel que soit le touchpoint qu'il privilégie.
  </p>
  <div class="lead-nurturing-stat__figure">
    <span class="lead-nurturing-stat__big">50%</span>
    <p>des SQLs coûtent 33% moins chers grâce au lead nurturing</p>
    <cite>Marketo</cite>
  </div>
</section>

<section class="lead-nurturing-objectifs" data-layout="lead-nurturing-objectifs">
  <SlideTitle title="Lead nurturing" subtitle="Objectifs" />
  <p class="lead-nurturing-objectifs__intro">
    D'après Marketo, une solution de marketing automation, <span class="underline">la moitié des leads</span> dans n'importe quel système ne sont pas encore prêts à passer à l'achat. Dans l'intervalle, il faut les occuper.
  </p>
  <ul class="lead-nurturing-objectifs__cards">
    <li>
      <strong>Comprendre les besoins</strong>
    </li>
    <li>
      <strong>Entretenir la relation</strong>
    </li>
    <li>
      <strong>Qualifier les leads</strong>
    </li>
  </ul>
</section>

<style>
  .lead-nurturing-def {
    justify-content: flex-start !important;
  }
  .lead-nurturing-def__body {
    max-width: 1100px;
    margin: 0 auto;
    text-align: left;
  }
  .lead-nurturing-def__body h3 {
    font-size: 44px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 32px;
    line-height: 1.2;
  }
  .lead-nurturing-def__body p {
    font-size: 22px;
    color: #6B6F84;
    margin: 0 0 16px;
    line-height: 1.5;
  }
  .lead-nurturing-stat {
    justify-content: flex-start !important;
  }
  .lead-nurturing-stat__intro {
    max-width: 1300px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .lead-nurturing-stat__figure {
    text-align: center;
    max-width: 1100px;
    margin: 0 auto;
  }
  .lead-nurturing-stat__big {
    display: block;
    font-size: 220px;
    font-weight: 700;
    color: #5BA8D6;
    line-height: 1;
    margin-bottom: 24px;
  }
  .lead-nurturing-stat__figure p {
    font-size: 26px;
    color: #5BA8D6;
    margin: 0 0 8px;
    font-weight: 500;
  }
  .lead-nurturing-stat__figure cite {
    font-size: 18px;
    color: #6B6F84;
    font-style: normal;
  }
  .lead-nurturing-objectifs {
    justify-content: flex-start !important;
  }
  .lead-nurturing-objectifs__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 22px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .lead-nurturing-objectifs__cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 1500px;
    margin: 0 auto;
  }
  .lead-nurturing-objectifs__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 64px 32px;
    text-align: center;
    font-size: 26px;
    color: #191919;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/LeadNurturingPrincipes.astro
git commit -m "feat: module LeadNurturingPrincipes (definition + 2 stats + objectifs)"
```

---

### Task 8 : `modules/ProtectionDonneesGDPR.astro`

**Files :**
- Create : `src/components/modules/ProtectionDonneesGDPR.astro`

Source : `32 - Protection des données.pdf` pages 3-10. Module en 5 slides : Définition + Législations + Avertissement RGPD + Donnée personnelle + Données sensibles.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/ProtectionDonneesGDPR.astro
import Statement from '@/components/slides/Statement.astro';
import SlideTitle from '@/components/SlideTitle.astro';
---
<Statement title="Protection des données" subtitle="Définition">
La protection des données a pour objectif de <span class="underline">protéger la personnalité et les droits fondamentaux des individus</span> dont les données sont traitées, et non pas de protéger les données elles-mêmes.
</Statement>

<section class="protection-legislations" data-layout="protection-legislations">
  <SlideTitle title="Protection des données" subtitle="Législations applicables" />
  <p class="protection-legislations__intro">
    <span class="underline">Trois cadres légaux</span> encadrent l'utilisation des données personnelles : la LPD au niveau fédéral (Suisse), la LPrD au niveau cantonal (Vaud), et le RGPD au niveau européen.
  </p>
  <ul class="protection-legislations__cards">
    <li>
      <strong>Loi fédérale (LPD)</strong>
      <span>Suisse</span>
    </li>
    <li>
      <strong>Loi vaudoise (LPrD) ou autre(s)</strong>
      <span>Cantonal</span>
    </li>
    <li>
      <strong>Loi européenne (RGPD)</strong>
      <span>Union européenne</span>
    </li>
  </ul>
</section>

<section class="protection-warning" data-layout="protection-warning">
  <SlideTitle title="Protection des données" subtitle="Législations applicables" />
  <p class="protection-warning__intro">
    <span class="underline">Mentionner le RGPD sans y être formellement soumis</span> peut vous exposer inutilement. Soyez précis et cohérent avec votre cadre légal réel.
  </p>
  <div class="protection-warning__cols">
    <div>
      <h4>Erreurs courantes</h4>
      <ul>
        <li>Ajouter la mention « Conforme au RGPD » même si pas obligatoire</li>
        <li>Référencer le RGPD dans la politique de confidentialité par mimétisme</li>
        <li>Utiliser les consentements aux standards RGPD</li>
      </ul>
    </div>
    <div>
      <h4>Conséquences</h4>
      <ul>
        <li>Droits exercés sous l'angle RGPD auto déclaré au lieu de la LPD</li>
        <li>Complexité accrue et incohérence avec certaines obligations suisses</li>
        <li>Risque accru de sanction en cas de non respect du RGPD auto déclaré</li>
      </ul>
    </div>
  </div>
</section>

<section class="protection-donnees" data-layout="protection-donnees">
  <SlideTitle title="Protection des données" subtitle="Données personnelles" />
  <p class="protection-donnees__intro">
    Une donnée personnelle est <span class="underline">toute information permettant d'identifier une personne</span>, directement (par exemple prénom, nom) ou indirectement (par exemple combinaison d'informations).
  </p>
  <ul class="protection-donnees__cards">
    <li><strong>Nom, prénom</strong></li>
    <li><strong>Adresse IP</strong></li>
    <li><strong>Numéro AVS</strong></li>
  </ul>
</section>

<section class="protection-sensibles" data-layout="protection-sensibles">
  <SlideTitle title="Protection des données" subtitle="Données sensibles" />
  <p class="protection-sensibles__intro">
    Certaines données personnelles bénéficient d'une protection renforcée, car leur utilisation pourrait porter atteinte aux droits fondamentaux ou à la vie privée des personnes : ce sont les <span class="underline">données sensibles</span>.
  </p>
  <ul class="protection-sensibles__list">
    <li>Les opinions ou activités <strong>religieuses, philosophiques, politiques</strong> ou syndicales</li>
    <li>Les données relatives à la <strong>santé</strong></li>
    <li>Les données concernant la <strong>sphère intime</strong> ou l'appartenance raciale ou ethnique</li>
    <li>Les <strong>mesures d'aide sociale</strong></li>
    <li>Les informations sur des <strong>poursuites</strong> ou sanctions pénales et administratives</li>
    <li>Les <strong>données génétiques</strong></li>
    <li>Les <strong>données biométriques</strong> permettant d'identifier de manière unique une personne physique</li>
  </ul>
</section>

<style>
  .protection-legislations {
    justify-content: flex-start !important;
  }
  .protection-legislations__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .protection-legislations__cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 1500px;
    margin: 0 auto;
  }
  .protection-legislations__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .protection-legislations__cards strong {
    font-size: 24px;
    color: #191919;
  }
  .protection-legislations__cards span {
    font-size: 18px;
    color: #6B6F84;
  }

  .protection-warning {
    justify-content: flex-start !important;
  }
  .protection-warning__intro {
    max-width: 1400px;
    margin: 0 auto 48px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .protection-warning__cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    max-width: 1500px;
    margin: 0 auto;
  }
  .protection-warning__cols h4 {
    font-size: 24px;
    color: #C73E5A;
    margin: 0 0 16px;
  }
  .protection-warning__cols ul {
    margin: 0;
    padding-left: 24px;
  }
  .protection-warning__cols li {
    font-size: 20px;
    color: #6B6F84;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .protection-donnees {
    justify-content: flex-start !important;
  }
  .protection-donnees__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .protection-donnees__cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 1500px;
    margin: 0 auto;
  }
  .protection-donnees__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 64px 32px;
    text-align: center;
    font-size: 26px;
    color: #191919;
  }

  .protection-sensibles {
    justify-content: flex-start !important;
  }
  .protection-sensibles__intro {
    max-width: 1500px;
    margin: 0 auto 48px;
    text-align: center;
    font-size: 22px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .protection-sensibles__list {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    max-width: 1300px;
  }
  .protection-sensibles__list li {
    font-size: 22px;
    color: #6B6F84;
    line-height: 1.6;
    padding: 8px 0;
    border-bottom: 1px solid rgba(25, 25, 25, 0.06);
  }
  .protection-sensibles__list li:last-child {
    border-bottom: none;
  }
  .protection-sensibles__list strong {
    color: #191919;
  }
</style>
```

Note éditoriale : les tirets cadratins du PDF original ("auto-déclaré", "non-respect") sont remplacés par des espaces normaux pour respecter la convention LM (pas d'em dashes).

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/ProtectionDonneesGDPR.astro
git commit -m "feat: module ProtectionDonneesGDPR (definition + LPD/LPrD/RGPD + sensibles)"
```

---

### Task 9 : `modules/AutomationAvancee.astro`

**Files :**
- Create : `src/components/modules/AutomationAvancee.astro`

Source : `33 - Workflows avancés.pdf` pages 4, 6, 7, 10. Module en 4 slides : Limites des workflows uniques + Solution + Identifier les processus + Devenir flowgrammer.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/AutomationAvancee.astro
import SlideTitle from '@/components/SlideTitle.astro';
---
<section class="automation-limites" data-layout="automation-limites">
  <SlideTitle title="Workflows avancés" subtitle="Limites des workflows uniques" />
  <p class="automation-limites__intro">
    Créer <span class="underline">un workflow pour chaque processus</span> entraîne nécessairement des externalités négatives qu'il convient de mitiger le plus rapidement possible.
  </p>
  <ul class="automation-limites__cards">
    <li>
      <strong>Risque d'erreur</strong>
      <span>Manuel et duplication</span>
    </li>
    <li>
      <strong>Scalabilité limitée</strong>
      <span>Un workflow par processus</span>
    </li>
    <li>
      <strong>Usine à gaz</strong>
      <span>Historicité compliquée</span>
    </li>
  </ul>
</section>

<section class="automation-resume" data-layout="automation-resume">
  <SlideTitle title="Workflows avancés" subtitle="Comment optimiser ce workflow ?" />
  <p class="automation-resume__text">
    En résumé, nous pouvons optimiser ce workflow en <span class="underline">automatisant l'automatisation</span> pour faire en sorte que le workflow soit valable à <strong>chaque</strong> événement que nous organiserons.
  </p>
</section>

<section class="automation-identifier" data-layout="automation-identifier">
  <SlideTitle title="Workflows avancés" subtitle="Identifier les besoins" />
  <div class="automation-identifier__body">
    <h3>Identifiez les processus <span class="underline">avant de les automatiser</span>.</h3>
    <p>Comme lors de l'implémentation d'un CRM, ou de n'importe quel outil digital.</p>
    <p>Modéliser les processus est une <strong>étape cruciale</strong>.</p>
  </div>
</section>

<section class="automation-flowgrammer" data-layout="automation-flowgrammer">
  <SlideTitle title="Workflows avancés" subtitle="Automatiser avec intelligence" />
  <h3 class="automation-flowgrammer__title">C'est en testant que vous deviendrez <em>flowgrammer</em></h3>
  <ul class="automation-flowgrammer__list">
    <li>Créer un workflow est <strong>à la portée de tous</strong></li>
    <li>Les workflows <strong>vont se multiplier</strong> à l'avenir</li>
    <li>Récupérer des workflows est <strong>contre productif</strong></li>
    <li>Adapter les workflows à vous est la <strong>clé</strong></li>
    <li>Les workflows sans <strong>stratégie</strong> mènent au chaos</li>
  </ul>
</section>

<style>
  .automation-limites {
    justify-content: flex-start !important;
  }
  .automation-limites__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .automation-limites__cards {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 1500px;
  }
  .automation-limites__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .automation-limites__cards strong {
    font-size: 24px;
    color: #191919;
  }
  .automation-limites__cards span {
    font-size: 18px;
    color: #6B6F84;
  }

  .automation-resume {
    justify-content: center !important;
    align-items: center !important;
    text-align: center;
  }
  .automation-resume__text {
    max-width: 1400px;
    font-size: 36px;
    color: #191919;
    line-height: 1.4;
    margin: 0;
  }

  .automation-identifier {
    justify-content: flex-start !important;
  }
  .automation-identifier__body {
    max-width: 1100px;
    margin: 0 auto;
  }
  .automation-identifier__body h3 {
    font-size: 44px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 32px;
    line-height: 1.2;
  }
  .automation-identifier__body p {
    font-size: 22px;
    color: #6B6F84;
    margin: 0 0 16px;
    line-height: 1.5;
  }

  .automation-flowgrammer {
    justify-content: flex-start !important;
  }
  .automation-flowgrammer__title {
    text-align: center;
    font-size: 40px;
    color: #191919;
    margin: 0 auto 48px;
    max-width: 1400px;
  }
  .automation-flowgrammer__title em {
    color: #5BA8D6;
    font-style: italic;
  }
  .automation-flowgrammer__list {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    max-width: 1100px;
  }
  .automation-flowgrammer__list li {
    font-size: 24px;
    color: #6B6F84;
    padding: 16px 0;
    border-bottom: 1px solid rgba(25, 25, 25, 0.06);
  }
  .automation-flowgrammer__list li:last-child {
    border-bottom: none;
  }
  .automation-flowgrammer__list strong {
    color: #191919;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/AutomationAvancee.astro
git commit -m "feat: module AutomationAvancee (limites + automatiser l'automatisation + flowgrammer)"
```

---

### Task 10 : `modules/IAAutomation.astro`

**Files :**
- Create : `src/components/modules/IAAutomation.astro`

Source : `34 - IA & Automatisation.pdf` pages 3, 4, 6. Module en 3 slides : 4 leviers + 2 cas d'usage + Workshop.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/IAAutomation.astro
import Workshop from '@/components/slides/Workshop.astro';
import SlideTitle from '@/components/SlideTitle.astro';
---
<section class="ia-leviers" data-layout="ia-leviers">
  <SlideTitle title="IA & automatisation" subtitle="La combinaison ultime" />
  <p class="ia-leviers__intro">
    <span class="underline">L'IA révolutionne le marketing automation</span> en offrant de nouvelles perspectives d'automatisation. Découvrez les nouveaux leviers à exploiter.
  </p>
  <ul class="ia-leviers__cards">
    <li><strong>Contenu</strong></li>
    <li><strong>Personnalisation</strong></li>
    <li><strong>Analyse</strong></li>
    <li><strong>Chatbots</strong></li>
  </ul>
</section>

<section class="ia-cas-usage" data-layout="ia-cas-usage">
  <SlideTitle title="IA & automatisation" subtitle="Présentation de deux cas d'usage" />
  <p class="ia-cas-usage__intro">
    Pour vous permettre de vous représenter les possibilités, voici deux <span class="underline">cas d'usage de l'IA combinée avec l'automatisation</span> que nous allons découvrir ensemble.
  </p>
  <ul class="ia-cas-usage__cards">
    <li>
      <strong>Génération automatique d'articles de blog</strong>
    </li>
    <li>
      <strong>Création d'un chatbot connecté aux données</strong>
    </li>
  </ul>
</section>

<Workshop
  title="IA & automatisation"
  subtitle="Guidelines du workshop"
  subject="Workflow"
  rows={[
    { label: 'Temps', content: '20 minutes' },
    { label: 'Travail', content: ['10 minutes de manière individuelle', '10 minutes de peer sharing'] },
    { label: 'Objectif', content: "Réfléchir à des applications pratiques de l'IA" },
    { label: 'Sujet', content: 'Doit pouvoir être applicable à votre organisation' },
  ]}
/>

<style>
  .ia-leviers {
    justify-content: flex-start !important;
  }
  .ia-leviers__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .ia-leviers__cards {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    max-width: 1500px;
  }
  .ia-leviers__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 64px 16px;
    text-align: center;
    font-size: 24px;
    color: #191919;
  }

  .ia-cas-usage {
    justify-content: flex-start !important;
  }
  .ia-cas-usage__intro {
    max-width: 1400px;
    margin: 0 auto 64px;
    text-align: center;
    font-size: 24px;
    color: #6B6F84;
    line-height: 1.5;
  }
  .ia-cas-usage__cards {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    max-width: 1300px;
  }
  .ia-cas-usage__cards li {
    background: rgba(91, 168, 214, 0.08);
    border-radius: 20px;
    padding: 64px 32px;
    text-align: center;
    font-size: 26px;
    color: #191919;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/IAAutomation.astro
git commit -m "feat: module IAAutomation (4 leviers + 2 cas usage + workshop)"
```

---

## Phase 4 : Modules signature (QuiSuisJe + ContactsLM)

### Task 11 : `modules/QuiSuisJe.astro`

**Files :**
- Create : `src/components/modules/QuiSuisJe.astro`

Module bio Thomas + Lausanne Marketing. À créer (pas de source PDF). Inspiré de la signature Lausanne Marketing.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/QuiSuisJe.astro
import SlideTitle from '@/components/SlideTitle.astro';
---
<section class="qui-suis-je" data-layout="qui-suis-je">
  <SlideTitle title="Qui suis je ?" subtitle="Votre intervenant" />
  <div class="qui-suis-je__grid">
    <div class="qui-suis-je__bio">
      <h3>Thomas Rouaud</h3>
      <p class="qui-suis-je__role">Consultant CRM, Data, IA & Automation</p>
      <ul class="qui-suis-je__points">
        <li>Fondateur de <span class="underline">Lausanne Marketing</span>, agence digitale spécialisée en CRM et automation</li>
        <li>Plus de 10 ans d'expérience auprès de PME et institutions suisses</li>
        <li>Spécialiste Zoho, HubSpot, n8n, Zapier</li>
        <li>Intervenant en formation continue HEC Lausanne</li>
      </ul>
    </div>
    <ul class="qui-suis-je__keywords">
      <li>CRM</li>
      <li>Data</li>
      <li>Automation</li>
      <li>IA</li>
      <li>n8n</li>
      <li>Zoho</li>
    </ul>
  </div>
</section>

<style>
  .qui-suis-je {
    justify-content: flex-start !important;
  }
  .qui-suis-je__grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 64px;
    align-items: center;
    max-width: 1500px;
    margin: 0 auto;
    width: 100%;
  }
  .qui-suis-je__bio h3 {
    font-size: 56px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 8px;
  }
  .qui-suis-je__role {
    font-size: 22px;
    color: #6B6F84;
    margin: 0 0 32px;
  }
  .qui-suis-je__points {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .qui-suis-je__points li {
    font-size: 22px;
    color: #6B6F84;
    line-height: 1.5;
    padding: 12px 0;
    border-bottom: 1px solid rgba(25, 25, 25, 0.06);
  }
  .qui-suis-je__points li:last-child {
    border-bottom: none;
  }
  .qui-suis-je__keywords {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .qui-suis-je__keywords li {
    background: #FFD838;
    color: #191919;
    padding: 16px 24px;
    border-radius: 12px;
    text-align: center;
    font-size: 20px;
    font-weight: 500;
  }
</style>
```

Note : la bio est simplifiée. Si Thomas veut un texte plus précis (parcours, références clients), il l'édite directement dans le module.

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/QuiSuisJe.astro
git commit -m "feat: module QuiSuisJe (bio Thomas + LM)"
```

---

### Task 12 : `modules/ContactsLM.astro`

**Files :**
- Create : `src/components/modules/ContactsLM.astro`

Module slide de contact. À créer.

- [ ] **Step 1 : Écrire le module**

```astro
---
// src/components/modules/ContactsLM.astro
import Closing from '@/components/slides/Closing.astro';
---
<Closing
  variant="contact"
  title="Restons en contact"
  subtitle="Lausanne Marketing"
  email="hello@lausanne.marketing"
  url="https://lausanne.marketing"
/>
```

Note : le composant `Closing` variant `contact` accepte déjà ces props. Si tu veux ajouter LinkedIn ou téléphone plus tard, il faudra étendre les props de `Closing`. Pour l'instant on s'en tient à l'email + URL.

- [ ] **Step 2 : Commit**

```bash
git add src/components/modules/ContactsLM.astro
git commit -m "feat: module ContactsLM (closing contact LM)"
```

---

## Phase 5 : Vérification build après tous les modules

### Task 13 : Build pour valider que tous les modules compilent

- [ ] **Step 1 : Build**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run build
```

Expected : 0 errors, 4 pages buildées comme avant (les modules ne sont pas encore importés dans une présentation).

- [ ] **Step 2 : Pas de commit**

Si le build échoue, lire le message d'erreur et corriger le module concerné, puis re-commit.

---

## Phase 6 : Deck démo `growth-marketing-2025.mdx`

### Task 14 : Créer le deck démo qui assemble tous les modules

**Files :**
- Create : `src/content/presentations/growth-marketing-2025.mdx`

Ce deck sert à valider visuellement chaque module en conditions réelles. Il est marqué `unlisted: true` pour ne pas apparaître sur la landing : c'est un deck de démo interne, pas de contenu publiable.

- [ ] **Step 1 : Écrire le MDX**

```mdx
---
title: "Growth Marketing 2025"
subtitle: "Démo des modules de contenu LM"
short: "Démo modules"
date: 2026-05-08
type: cours
unlisted: true
description: "Deck interne qui assemble les 12 modules de contenu réutilisables. Sert de catalogue visuel."
---

import Cover from '@/components/slides/Cover.astro';
import Title from '@/components/slides/Title.astro';
import Closing from '@/components/slides/Closing.astro';

import QuiSuisJe from '@/components/modules/QuiSuisJe.astro';
import StackPetiteStructure from '@/components/modules/StackPetiteStructure.astro';
import FunnelTOFUMOFUBOFU from '@/components/modules/FunnelTOFUMOFUBOFU.astro';
import Workflow01Engagement from '@/components/modules/Workflow01Engagement.astro';
import Workflow02Nurturing from '@/components/modules/Workflow02Nurturing.astro';
import Workflow03Matching from '@/components/modules/Workflow03Matching.astro';
import Workflow04Scoring from '@/components/modules/Workflow04Scoring.astro';
import LeadNurturingPrincipes from '@/components/modules/LeadNurturingPrincipes.astro';
import ProtectionDonneesGDPR from '@/components/modules/ProtectionDonneesGDPR.astro';
import AutomationAvancee from '@/components/modules/AutomationAvancee.astro';
import IAAutomation from '@/components/modules/IAAutomation.astro';
import ContactsLM from '@/components/modules/ContactsLM.astro';

<Cover
  title="Growth Marketing 2025"
  subtitle="Démo des modules de contenu LM"
  eyebrow="Catalogue interne"
  image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&h=900&fit=crop"
/>

<QuiSuisJe />

<Title chapter="Module 1" title="Stack" subtitle="Outils pour petite structure" />
<StackPetiteStructure />

<Title chapter="Module 2" title="Funnel" subtitle="TOFU / MOFU / BOFU" />
<FunnelTOFUMOFUBOFU />

<Title chapter="Module 3" title="Workflows" subtitle="Quatre exemples d'automatisation" />
<Workflow01Engagement />
<Workflow02Nurturing />
<Workflow03Matching />
<Workflow04Scoring />

<Title chapter="Module 4" title="Lead nurturing" subtitle="Principes et statistiques" />
<LeadNurturingPrincipes />

<Title chapter="Module 5" title="Protection des données" subtitle="LPD, LPrD, RGPD" />
<ProtectionDonneesGDPR />

<Title chapter="Module 6" title="Workflows avancés" subtitle="Automatiser l'automatisation" />
<AutomationAvancee />

<Title chapter="Module 7" title="IA & automatisation" subtitle="La combinaison ultime" />
<IAAutomation />

<ContactsLM />
```

- [ ] **Step 2 : Build pour vérifier**

```bash
npm run build
```

Expected :
- 0 errors
- 5 pages buildées maintenant (4 d'avant + `growth-marketing-2025` qui ajoute `/p/growth-marketing-2025` et `/p/growth-marketing-2025/lecture`)
- Wait : la collection a maintenant 2 entrées, mais comme `unlisted: true`, le deck Growth n'apparaît pas sur la landing. Donc landing reste 1 carte (CRM Data Auto), mais 4 routes côté `/p/...` (2 decks × 2 modes).
- Donc total dist : index + 404 + 2 routes /p/[slug] + 2 routes /p/[slug]/lecture = 6 pages.

Si le build affiche 6 pages au lieu des 4 attendues précédemment, c'est normal (on a ajouté un deck).

- [ ] **Step 3 : Commit**

```bash
git add src/content/presentations/growth-marketing-2025.mdx
git commit -m "feat: deck demo growth-marketing-2025 (assemble les 12 modules)"
```

---

## Phase 7 : Validation visuelle locale

### Task 15 : Vérifier chaque module dans le navigateur

- [ ] **Step 1 : Lancer le dev server**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run dev
```

- [ ] **Step 2 : Ouvrir le deck démo**

Ouvrir `http://localhost:4321/p/growth-marketing-2025` (l'URL ne s'affiche pas sur la landing parce que `unlisted: true`, mais elle existe).

Naviguer slide par slide (touche espace ou flèche droite). Vérifier pour chaque module :

| Module | Vérif visuelle |
|--------|----------------|
| Cover | Image gauche, titre droit |
| QuiSuisJe | Bio Thomas à gauche, 6 keywords gold à droite |
| StackPetiteStructure | TableSlide avec 8 outils, prix CHF |
| FunnelTOFUMOFUBOFU | Pyramide inversée 3 niveaux noirs, légende droite |
| Workflow01-04 | NumberedCardWithDetail avec déclencheur/prérequis/actions |
| LeadNurturingPrincipes | 5 slides : définition, statement, 79%, 50%, objectifs |
| ProtectionDonneesGDPR | 5 slides : statement définition, 3 lois, warning, donnée perso, sensibles |
| AutomationAvancee | 4 slides : limites, résumé, identifier, flowgrammer |
| IAAutomation | 3 slides : 4 leviers, 2 cas usage, workshop |
| ContactsLM | Closing dark avec email + URL gold |

- [ ] **Step 3 : Vérifier le mode lecture**

Cliquer sur le bouton "Lecture" (haut droite) ou ouvrir directement `http://localhost:4321/p/growth-marketing-2025/lecture`.

Expected : toutes les slides s'empilent verticalement, chaque module reste lisible en flux scroll.

- [ ] **Step 4 : Vérifier que la landing n'affiche que CRM Data Auto**

Ouvrir `http://localhost:4321/`.

Expected : une seule carte "CRM, Data & automation". Le deck Growth ne doit PAS apparaître (parce que `unlisted: true`). Si il apparaît, c'est que le filtre `unlisted` n'est pas appliqué dans `src/pages/index.astro` : à corriger.

- [ ] **Step 5 : Si tout est OK, pas de commit**

Si un module a un problème visuel, ajuster le CSS dans le module concerné et faire un commit ciblé "fix: module X (description du fix)".

---

## Phase 8 : Push production

### Task 16 : Push sur main et vérifier le déploiement Cloudflare Pages

- [ ] **Step 1 : Vérifier l'historique des commits**

```bash
git log --oneline -14
```

Expected : voir les 12 commits de Tasks 1-12 (un par module) + Task 14 (deck demo) + éventuels fixes Task 15 (validation visuelle).

- [ ] **Step 2 : Push**

```bash
git push origin main
```

Le push déclenche un déploiement Cloudflare Pages.

- [ ] **Step 3 : Attendre le build CF Pages (1 à 3 minutes)**

Aller sur le dashboard Cloudflare Pages, vérifier que le build passe au vert.

- [ ] **Step 4 : Vérifier en production**

Ouvrir `https://slides.lausanne.marketing/p/growth-marketing-2025` (et `/lecture`).

Expected : le deck démo s'affiche en prod, tous les modules rendent comme en local.

Vérifier aussi `https://slides.lausanne.marketing/` : la landing affiche toujours uniquement CRM Data Auto, le deck Growth n'apparaît pas (parce qu'unlisted).

---

## Récap : ce qu'on a livré en v3

À la fin de ce plan :

- 12 modules de contenu réutilisables dans `src/components/modules/` :
  - **Workflows** : Workflow01Engagement, Workflow02Nurturing, Workflow03Matching, Workflow04Scoring (NumberedCardWithDetail)
  - **Pyramide funnel** : FunnelTOFUMOFUBOFU (Custom + clip-path)
  - **Tableau outils** : StackPetiteStructure (TableSlide)
  - **Pédagogiques multi slides** : LeadNurturingPrincipes (5), ProtectionDonneesGDPR (5), AutomationAvancee (4), IAAutomation (3 + Workshop)
  - **Signature** : QuiSuisJe (bio), ContactsLM (closing contact)
- Deck démo `growth-marketing-2025` qui assemble les 12 modules en conditions réelles, marqué `unlisted: true`
- Build et déploiement à jour sur `slides.lausanne.marketing`

## Hors scope v3, à traiter dans plan v4

- Refactor du deck `crm-data-automation.mdx` actuel pour qu'il consomme les modules là où ça matche (Workflow01, StackPetiteStructure, etc.) au lieu d'avoir le contenu inline
- Rédaction complète du deck CRM Data Auto sur 3 jours, structure définitive section 6.3 du spec
- Polish : remplacer les images Unsplash placeholder des Workflow01-04 par les visuels originaux extraits des PDFs (ou des photos LM)
- Affiner le contenu de QuiSuisJe avec la vraie bio de Thomas (ce plan utilise une version simplifiée)

## Décisions ouvertes à confirmer pendant l'implémentation

- Pour les modules `Workflow01-04`, les images Unsplash sont des placeholders. Si Thomas veut les vraies images des PDFs, il faut les extraire et les déposer dans `public/assets/modules/` puis ajuster `image="..."` dans chaque module.
- Pour `FunnelTOFUMOFUBOFU`, le rendu en pyramide via `clip-path` peut nécessiter quelques itérations CSS pour matcher exactement le visuel ExecEd. Si trop fragile, basculer sur SVG inline.
- Pour `LeadNurturingPrincipes` et `ProtectionDonneesGDPR`, certaines slides utilisent des layouts ad hoc (cards 3 colonnes, stats grand format) qui ne sont pas dans le catalogue. Si on les retrouve dans 2+ modules, on les promeut en layout dédié dans une passe de refactor (plan v3.5 éventuel).
- La couleur de l'accent dans les modules (`#5BA8D6` bleu) reprend le choix v2. À confirmer avec Thomas si gold (`#FFD838`) serait plus cohérent avec la charte LM.
