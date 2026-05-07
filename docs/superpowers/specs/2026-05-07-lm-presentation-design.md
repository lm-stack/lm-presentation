---
date: 2026-05-07
status: draft
title: lm-presentation, site de présentations LM
author: Thomas Rouaud
---

# lm-presentation : spec de design

## 1. Contexte et objectifs

### 1.1 Pourquoi ce repo

Thomas Rouaud (Lausanne Marketing, Intuify) a besoin d'un système unique pour ses supports de présentation, qui couvre trois usages :

1. Cours de formation continue (ex : "CRM, Data & automation" à HEC Lausanne ExecEd, dès juin 2026)
2. PPT commerciaux LM (présentations clients, propositions, pitchs)
3. Événements et workshops (n8n Suisse, conférences, etc.)

Le système actuel (PowerPoint, slides ExecEd-branded) ne permet pas la réutilisation de contenu entre présentations, ne garde pas de version, et impose un cycle "modifier le PPT, exporter en PDF".

### 1.2 Objectifs

- **Site web** : chaque présentation a une URL pérenne, indexable, partageable.
- **Mode plein écran** : utilisable comme un PowerPoint en cours (navigation clavier, fullscreen, presenter view).
- **Bibliothèque réutilisable** : un module créé pour un cours peut être inclus dans une présentation commerciale, et inversement.
- **Charte LM 100%** : couleurs, polices, signature underline gold, ton éditorial. Pas de branding ExecEd.
- **Cohérence avec l'écosystème LM** : Astro 5 + Tailwind v4 + Cloudflare Pages, comme `lm/` et `lm-diagrams/`.

### 1.3 Hors scope (v1)

- Authentification / contenu vraiment privé (Cloudflare Access ajouté plus tard si besoin).
- CMS Sveltia (édition directe des fichiers `.mdx` via éditeur de code, pas d'interface no-code).
- Timer overlay pour le mode présentation (peut être ajouté en v2).
- Multi-langue (uniquement français pour l'instant).
- Plugin de pointer/laser Reveal (à ajouter à la demande).

## 2. Architecture en trois niveaux

Le concept central pour la "bibliothèque réutilisable" : séparer trois types de bricks.

### 2.1 Layouts de slides (`src/components/slides/`)

Composants Astro qui rendent un `<section>` Reveal avec une structure visuelle générique. Ils prennent du contenu en props ou via slot. Pas de contenu spécifique.

Liste cible (kit initial) :

| Layout | Usage | Props clés |
|--------|-------|------------|
| `Cover` | Page de garde de présentation ou de chapitre | `title`, `subtitle?`, `image`, `eyebrow?` |
| `Title` | Slide de transition entre chapitres | `title`, `subtitle?`, `chapter?` |
| `Statement` | Phrase forte centrée, image décorative optionnelle | `highlight?`, `image?`, slot |
| `NumberedCards` | 2 ou 4 blocs numérotés 01/02/03/04 | `cols: 1 \| 2`, `items: [{ number, title, description }]` |
| `NumberedCardWithDetail` | 1 numéro + Déclencheur/Prérequis/Actions + visuel | `number`, `title`, `description`, `details: [{ label, text }]`, `image?` |
| `TableSlide` | Tableau header navy + rows alternées | `headers: string[]`, `rows: string[][]`, `leftLabel?` |
| `BigImage` | Slide pleine page avec une image (diagramme, screenshot) | `image`, `caption?`, `frame?: true` |
| `Workshop` | Icône + tableau Temps/Travail/Objectif/Sujet/Attentes | `subject`, `rows: [{ label, content }]` |
| `Calendar` | Calendrier de session (Horaire/Sujet/Intervenant) | `day`, `slots: [{ time, subject, speaker }]` |
| `Quote` | Citation + attribution | `text`, `author`, `role?`, `image?` |
| `Closing` | Slide finale (Q&A, merci, contact) | `variant: 'qa' \| 'thanks' \| 'contact'` |
| `Custom` | Échappatoire : `<section>` brut avec slot | slot |

Composant utilitaire transversal : `<SlideTitle title="..." subtitle="..." highlight="..." />` repris dans la majorité des layouts content. Rend H2 navy + sous-titre gris + petite barre underline gold (rappel charte LM) + mot-clé du sous-titre soulignable.

### 2.2 Modules de contenu (`src/components/modules/`)

Composants Astro qui combinent un layout avec du contenu spécifique. **C'est ça la bibliothèque.** Écrit une fois, importable dans plusieurs présentations.

Exemples (kit initial à extraire des PDF Growth Marketing 2025) :
- `StackPetiteStructure` (table outils -50 CHF/mois)
- `FunnelTOFUMOFUBOFU` (3 étapes du funnel)
- `Workflow01Engagement` ... `Workflow04Scoring` (4 workflows pratiques)
- `LeadNurturingPrincipes`
- `ProtectionDonneesGDPR`
- `AutomationAvancee`
- `IAAutomation`
- `QuiSuisJe` (bio Thomas + LM, à créer)
- `ContactsLM` (slide de contact, à créer)

Convention : un module rend un ou plusieurs `<section>` Reveal en utilisant les layouts du catalogue.

### 2.3 Présentations (`src/content/presentations/`)

Content collection Astro. Un fichier `.mdx` par présentation, qui assemble layouts + modules + slides spécifiques. Frontmatter pour les métadonnées.

Exemple :

```mdx
---
title: "CRM, Data & automation"
subtitle: "Formation continue HEC Lausanne"
date: 2026-06-25
type: cours
unlisted: false
cover: /assets/crm-data-automation/cover.jpg
short: "CRM, Data, Automation"
---

import Cover from '@/components/slides/Cover.astro';
import Statement from '@/components/slides/Statement.astro';
import StackPetiteStructure from '@/components/modules/StackPetiteStructure.astro';

<Cover title="CRM, Data & automation" image="/assets/crm-data-automation/cover.jpg" />

<Statement highlight="matière première">
La donnée est la nouvelle matière première du marketing.
</Statement>

<StackPetiteStructure />
```

Schema Zod dans `src/content.config.ts` pour valider le frontmatter (champ `type` enum : `cours | commercial | workshop | evenement`).

## 3. Routing et modes d'affichage

### 3.1 URLs

```
/                          # landing : grille des présentations publiques
/p/:slug                   # mode présentation (Reveal.js init)
/p/:slug/lecture           # mode lecture (scroll vertical)
```

`getStaticPaths()` génère une route par entrée de la collection. Build statique pour Cloudflare Pages.

### 3.2 Mode par défaut

Quand un lien `/p/:slug` est partagé, l'utilisateur arrive en **mode présentation** (Reveal initialisé, navigation clavier active). Petit bouton fixe haut-droit pour basculer en mode lecture.

### 3.3 Mode lecture

Page Astro alternative qui rend les mêmes composants slide MDX dans un layout différent (sans Reveal init). Les slides s'empilent verticalement, lisibles comme un article long. Indexé par Pagefind pour la recherche full-text. Utile pour révision après cours, partage par email, accessibilité mobile.

### 3.4 Visibilité

Frontmatter `unlisted: true` : la présentation existe à son URL mais n'apparaît pas sur la landing. Utile pour PPT commerciaux pas confidentiels mais pas à étaler. Les vrais cas privés (confidentiel client) iront derrière Cloudflare Access plus tard, à la demande.

### 3.5 Deeplinks

`/p/crm-data-automation#5` ouvre directement la slide 5 (géré nativement par Reveal).

## 4. Stack technique

### 4.1 Dépendances

```
astro                ^5
@astrojs/tailwind    latest
@astrojs/mdx         latest
tailwindcss          ^4
reveal.js            ^5
@iconify-json/ph     latest    (icônes Phosphor, comme lm/)
astro-icon           latest
```

### 4.2 Intégration Reveal.js dans Astro

- Astro rend le HTML server-side : `<div class="reveal"><div class="slides"><section>...</section>...</div></div>`.
- Au runtime client, Reveal.js initialise et prend le contrôle (navigation, transitions, fullscreen).
- Le layout `Deck.astro` contient l'init Reveal et le `<slot />` pour les sections.

```astro
---
// src/layouts/Deck.astro
interface Props {
  title: string;
  subtitle?: string;
  short?: string;
}
const { title, subtitle, short } = Astro.props;
---
<html lang="fr">
  <head>
    <title>{title} : Lausanne Marketing</title>
    <link rel="stylesheet" href="/styles/slides.css" />
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <slot />
      </div>
    </div>
    <footer class="deck-footer">
      <span class="deck-brand">Lausanne Marketing</span>
      <span class="deck-title">{short ?? title}</span>
      <span class="deck-counter"></span>
    </footer>
    <script>
      import Reveal from 'reveal.js';
      const deck = new Reveal({
        hash: true,
        slideNumber: 'c/t',
        transition: 'fade',
        center: false,
        width: 1920,
        height: 1080,
      });
      deck.initialize();
    </script>
  </body>
</html>
```

### 4.3 Theme LM custom

Pas de theme Reveal par défaut. On importe juste `reveal.js/dist/reveal.css` (layout, transitions, presenter mode) puis on overrride dans `src/styles/slides.css` qui consomme les tokens LM via Tailwind v4 :

```css
@import 'reveal.js/dist/reveal.css';
@import 'tailwindcss';

.reveal {
  font-family: 'Hanken Grotesk', sans-serif;
  background: #FFFFFF;
  color: #6B6F84;
}
.reveal h1, .reveal h2 {
  font-weight: 700;
  color: #191919;
}
.reveal .underline { /* signature gold rotative LM, copie de lm/ global.css */ }
.reveal section { padding: 80px; }
/* ... */
```

Polices Hanken Grotesk + Space Grotesk self-hosted dans `public/fonts/`, via `@font-face` (calque sur `lm/`).

### 4.4 Plugins Reveal activés

- **Notes** (built-in) : speaker notes via touche `S`, contenu dans `<aside class="notes">` à l'intérieur d'un layout.
- **Fragments** (built-in) : apparitions progressives via `class="fragment"` ; les layouts qui supportent reçoivent une prop `fragments: boolean`.

### 4.5 Plugins explicitement non activés (v1)

- Pas de plugin Markdown Reveal : on utilise des composants Astro / MDX.
- Pas de plugin Highlight Reveal : si du code apparaît dans une slide, on utilise Shiki via Astro (build-time, plus propre).
- Pas de plugin Pointer/Laser pour l'instant (à ajouter à la demande).

### 4.6 Export PDF

Fonctionne nativement avec Reveal : `https://slides.lausanne.marketing/p/crm-data-automation?print-pdf` ouvre une vue print-friendly, l'utilisateur fait File > Print > Save as PDF dans son navigateur. Format slide 16:9. Pas de dépendance externe.

## 5. Stratégie de migration des slides existantes

### 5.1 Que faire des 9 PDF dans `source/2025/`

Les 9 decks Growth Marketing 2025 (Marketing automation, Workflow, Lead nurturing, Funnel marketing, Protection des données, Workflows avancés, IA & Automatisation, Conclusion) restent dans `source/2025/` comme archive, jamais publiés, ignorés du build.

On ne porte pas Growth Marketing 2025 à l'identique. On en extrait le contenu utile pour :
1. Construire le nouveau cours CRM, Data & automation
2. Alimenter la bibliothèque de modules

### 5.2 Classement par slide

Pour chaque slide source :
- **Réutilisable** (apparaîtra dans 2+ présentations) : devient un module dans `src/components/modules/`
- **Spécifique au nouveau cours** : recréée inline dans `crm-data-automation.mdx` avec un layout du catalogue
- **Obsolète** (calendrier Jour 3 daté, redites) : on jette

### 5.3 Passe 2 (optionnelle, plus tard)

Si Thomas veut faire exister `growth-marketing-2025` en LM-branded comme archive vivante, on l'assemble dans un second temps avec les modules existants + ce qui restait de spécifique. `unlisted: true` par défaut.

### 5.4 Workflow de création d'un module

1. Repérer un contenu réutilisable.
2. Créer `src/components/modules/NomModule.astro`.
3. Le module rend un ou plusieurs `<section>` Reveal en composant les layouts du catalogue.
4. L'importer dans n'importe quelle présentation MDX.

Exemple complet (`StackPetiteStructure`) :

```astro
---
// src/components/modules/StackPetiteStructure.astro
import TableSlide from '@/components/slides/TableSlide.astro';
---
<TableSlide
  title="Présentation de stack pour petite structure"
  subtitle="C'est une illusion de penser que les outils nécessitent des investissements élevés"
  intro="Voici une proposition de stack digital pour les petites structures sans budget (-50 CHF/mois)."
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

## 6. Première présentation : CRM, Data & automation

### 6.1 Métadonnées (depuis la page ExecEd officielle)

- Titre : "CRM, Data & automation"
- Sous-titre : "Formation continue HEC Lausanne"
- Durée : 3 jours sur 1 mois
- Sessions à venir : 25-27 juin 2026, puis 17-19 juin 2027
- Prix : 2'250 CHF
- Format : présentiel, français
- Intervenant : Thomas Rouaud
- Public : marketers, responsables relation client / digital, consultants en transformation digitale

### 6.2 Trois objectifs pédagogiques officiels

1. Collecter, structurer et intégrer la donnée client pour enrichir un CRM
2. Évaluer et maintenir une solution CRM (HubSpot, Salesforce, Zoho)
3. Créer des workflows automatisés intégrant l'IA et le low-code/no-code (Zapier, n8n)

### 6.3 Squelette du deck (à affiner avant implémentation)

**Jour 1 : Data**
- Cover, Calendar Jour 1, Statement d'intro
- Pourquoi la donnée (foundations)
- Sources et collecte (consent, web, CRM, ERP)
- Structuration et qualité
- Intégration (API, ETL, synchronisations)
- Protection des données / GDPR (réutilise module existant)
- Workshop participants

**Jour 2 : CRM**
- Cover Jour 2, Calendar
- Définition et rôle du CRM
- Comparatif HubSpot / Salesforce / Zoho / Brevo
- Choix d'outil selon contexte
- Module `StackPetiteStructure` (réutilisé)
- Implémentation et adoption
- Maintenance et qualité de base
- Workshop : choix CRM par participant

**Jour 3 : Automation & IA**
- Cover Jour 3, Calendar
- Plateformes (Zapier, n8n, Make)
- Workflows pratiques : modules `Workflow01-04` réutilisés (Engagement, Nurturing, Matching, Scoring)
- Module `LeadNurturingPrincipes`
- Module `AutomationAvancee`
- Module `IAAutomation`
- Optimisation parcours client
- KPIs et mesure
- Closing / Q&A

### 6.4 Kit initial de modules à extraire

Premier batch à transformer en composants réutilisables avant d'attaquer le deck CRM :

| Module | Source PDF | Cible CRM-Data-Auto |
|--------|-----------|---------------------|
| `StackPetiteStructure` | Conclusion p.3 | Jour 2 |
| `FunnelTOFUMOFUBOFU` | Funnel p.5 | Jour 1 ou 3 |
| `Workflow01Engagement` | Funnel p.7-8 | Jour 3 |
| `Workflow02Nurturing` | Funnel p.10 | Jour 3 |
| `Workflow03Matching` | Funnel p.11 | Jour 3 |
| `Workflow04Scoring` | Funnel p.12 | Jour 3 |
| `LeadNurturingPrincipes` | Lead nurturing | Jour 3 |
| `ProtectionDonneesGDPR` | Protection des données | Jour 1 |
| `AutomationAvancee` | Workflows avancés | Jour 3 |
| `IAAutomation` | IA & Automatisation | Jour 3 |
| `QuiSuisJe` | À créer (bio Thomas + LM) | Début |
| `ContactsLM` | À créer | Closing |

## 7. Hosting et déploiement

### 7.1 Cloudflare Pages

Déploiement sur Cloudflare Pages comme `lm/` et `lm-diagrams/`. Domaine : `slides.lausanne.marketing` (CNAME vers `lm-presentation.pages.dev`, proxy actif).

### 7.2 Build

```
npm run dev      # serveur local Astro avec hot reload
npm run build    # build statique dans dist/, indexation Pagefind
npm run preview  # preview du build
```

### 7.3 Cloudflare Pages config

| Paramètre | Valeur |
|-----------|--------|
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | 20 |

## 8. Conventions éditoriales

### 8.1 Charte LM (héritée de `lm/`)

- Couleurs : primary `#FFD838` (gold), secondary `#191919` (noir), text `#6B6F84`, dark-bg `#2C3049`.
- Polices : Hanken Grotesk (sans-serif principale), Space Grotesk (mono / accent), Qwitcher Grypen (decorative, optionnelle).
- Signature visuelle : `<span class="underline">mot</span>` pour souligner un mot-clé en gold rotatif sur les titres.
- Footer obligatoire : "Fait avec passion par Lausanne Marketing" sur la landing page (pas sur les slides individuelles).

### 8.2 Style éditorial

- Pas de tirets cadratins ni demi-cadratins dans les textes des slides (remplacer par deux-points, virgules, parenthèses, ou reformuler).
- Français suisse pour les nombres : `2'250 CHF`, `1'500 leads`.
- Devise CHF par défaut.
- Pas d'hyperbole vide ("révolutionnaire", "game-changer").
- Pas d'emojis dans les slides.
- Encodage UTF-8 strict avec accents complets.

### 8.3 Nommage des modules

PascalCase, descriptif et préfixé par catégorie quand utile. Exemples : `StackPetiteStructure`, `Workflow01Engagement`, `IAAutomation`. Pas de noms génériques type `Slide1`.

### 8.4 Nommage des présentations

kebab-case en slug, basé sur le titre. Exemples : `crm-data-automation`, `growth-marketing-2025`, `lm-pitch-2026`, `workshop-n8n-suisse`.

## 9. Structure repo finale

```
lm-presentation/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── wrangler.toml
├── .claude/
│   └── CLAUDE.md
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-07-lm-presentation-design.md
├── public/
│   ├── assets/                       # images de présentations
│   │   └── crm-data-automation/
│   ├── fonts/                        # Hanken Grotesk, Space Grotesk
│   └── reveal/                       # assets Reveal si besoin
├── source/                           # archive originaux, gitignored sauf si small
│   └── 2025/                         # PDF/PPTX Growth Marketing 2025
├── src/
│   ├── components/
│   │   ├── slides/                   # layouts visuels génériques
│   │   │   ├── Cover.astro
│   │   │   ├── Title.astro
│   │   │   ├── Statement.astro
│   │   │   ├── NumberedCards.astro
│   │   │   ├── NumberedCardWithDetail.astro
│   │   │   ├── TableSlide.astro
│   │   │   ├── BigImage.astro
│   │   │   ├── Workshop.astro
│   │   │   ├── Calendar.astro
│   │   │   ├── Quote.astro
│   │   │   ├── Closing.astro
│   │   │   └── Custom.astro
│   │   ├── modules/                  # contenu réutilisable
│   │   │   ├── StackPetiteStructure.astro
│   │   │   ├── FunnelTOFUMOFUBOFU.astro
│   │   │   ├── Workflow01Engagement.astro
│   │   │   ├── ... (autres modules du kit initial)
│   │   ├── SlideTitle.astro          # composant transversal
│   │   └── PresentationCard.astro    # carte sur la landing
│   ├── content/
│   │   ├── content.config.ts         # schema Zod
│   │   └── presentations/
│   │       └── crm-data-automation.mdx
│   ├── layouts/
│   │   ├── Site.astro                # landing + meta pages
│   │   ├── Deck.astro                # mode présentation (Reveal init)
│   │   └── DeckReading.astro         # mode lecture (scroll)
│   ├── pages/
│   │   ├── index.astro               # landing
│   │   ├── p/
│   │   │   ├── [slug].astro          # mode présentation
│   │   │   └── [slug]/
│   │   │       └── lecture.astro     # mode lecture
│   │   └── 404.astro
│   └── styles/
│       ├── global.css                # @import tailwindcss + base
│       ├── slides.css                # theme LM Reveal
│       └── fonts.css                 # @font-face
└── README.md
```

## 10. Plan de livraison v1 (haut niveau)

Étapes principales pour la première version utilisable :

1. **Init repo** : Astro 5 + Tailwind v4 + MDX + Reveal.js + structure dossiers, `.claude/CLAUDE.md` calqué sur `lm/`, `wrangler.toml`, README.
2. **Theme LM** : `slides.css`, fonts, tokens Tailwind, exemple de slide qui valide le theme.
3. **Layouts kit initial** : 12 composants `slides/`.
4. **Landing minimale** : `/` avec liste depuis content collection.
5. **Routes Deck + Reading** : `/p/[slug]` et `/p/[slug]/lecture`.
6. **Premier deck minimal** : `crm-data-automation.mdx` avec 3 slides factices pour valider le pipeline.
7. **Modules kit initial** : extraction des 12 modules listés section 6.4.
8. **Deck CRM Data Auto complet** : assemblage final avec squelette section 6.3.
9. **Deploy CF Pages** : domaine `slides.lausanne.marketing`.
10. **Polish** : footer landing, page 404, robots.txt, sitemap, OG tags.

Le plan détaillé d'implémentation sera produit dans une étape séparée (skill `writing-plans`).

## 11. Décisions ouvertes / à confirmer en cours d'implémentation

- Squelette précis du Jour 1 / Jour 2 / Jour 3 du cours CRM Data Automation (section 6.3 est une proposition, à valider avec Thomas avant écriture du contenu).
- Couleur exacte du fond des slides en mode présentation : blanc pur ou très légèrement off-white pour confort visuel ?
- Affichage du numéro de slide : pastille noire top-right (style ExecEd repris) ou format LM moins intrusif ?
- Décision sur l'ajout d'un sous-domaine de preview (`preview-slides.lausanne.marketing`) pour partage avant validation ou pas.
