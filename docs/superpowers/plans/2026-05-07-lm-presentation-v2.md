# lm-presentation v2 : compléter le catalogue de layouts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter le catalogue de layouts de slides en ajoutant les 7 templates manquants au kit livré en v1, pour que la rédaction du contenu CRM Data Auto (futur v3) puisse s'appuyer sur 12 layouts prêts à l'emploi.

**Architecture:** Mêmes patterns que v1 : un `<section>` Reveal par layout, props typées, alias `@/components/slides/...`. Chaque nouveau layout réutilise le helper `SlideTitle` quand pertinent et respecte la grille typo/spacing/couleurs LM. Pas de modification d'infra (pas de nouveau plugin Reveal, pas de nouvelle route, pas de changement de schema content collection).

**Tech Stack:** Inchangée par rapport à v1 (Astro 6, Tailwind v4, Reveal.js 5).

**Hors scope (à traiter dans plans suivants) :** extraction et écriture des 12 modules de contenu depuis `source/2025/` (plan v3), rédaction complète du deck CRM Data Auto sur 3 jours (plan v4), Pagefind UI sur la landing, polish design avancé (transitions custom, animations, optimisations images).

**Précondition :** travailler depuis `main`, working tree clean, dev server local fonctionne. Vérifier avant d'attaquer :

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
git pull origin main
git status
npm run build
```

---

## Phase 1 : Layouts informatifs (numbered cards)

### Task 1 : `slides/NumberedCards.astro`

**Files :**
- Create : `src/components/slides/NumberedCards.astro`

Layout : titre + grille de 1 ou 2 colonnes, chaque cellule contient un grand chiffre 01/02/03/04 en bleu/gold + un titre + une description courte.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/NumberedCards.astro
import SlideTitle from '@/components/SlideTitle.astro';

interface Item {
  number: string;
  title: string;
  description?: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  highlight?: string;
  cols?: 1 | 2;
  items: Item[];
  fragments?: boolean;
}

const { title, subtitle, highlight, cols = 2, items, fragments = false } = Astro.props;
---
<section class="numbered-cards" data-layout="numbered-cards">
  {title && <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />}
  <div class={`numbered-cards__grid numbered-cards__grid--cols-${cols}`}>
    {items.map((item) => (
      <article class={`numbered-card${fragments ? ' fragment fade-in' : ''}`}>
        <span class="numbered-card__number">{item.number}</span>
        <div class="numbered-card__body">
          <h3 class="numbered-card__title">{item.title}</h3>
          {item.description && <p class="numbered-card__description">{item.description}</p>}
        </div>
      </article>
    ))}
  </div>
</section>

<style>
  .numbered-cards {
    justify-content: flex-start !important;
  }
  .numbered-cards__grid {
    display: grid;
    gap: 48px 64px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }
  .numbered-cards__grid--cols-1 {
    grid-template-columns: 1fr;
    max-width: 1100px;
  }
  .numbered-cards__grid--cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  .numbered-card {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 24px;
    align-items: start;
  }
  .numbered-card__number {
    font-family: 'Space Grotesk', monospace;
    font-size: 64px;
    font-weight: 700;
    color: #5BA8D6;
    line-height: 1;
  }
  .numbered-card__title {
    font-size: 28px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 8px;
  }
  .numbered-card__description {
    font-size: 20px;
    color: #6B6F84;
    margin: 0;
    line-height: 1.4;
  }
</style>
```

Note : la couleur `#5BA8D6` du chiffre reprend l'accent bleu observé dans les slides ExecEd. Si Thomas préfère gold (`#FFD838`) ou noir, à changer une seule ligne ici.

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/NumberedCards.astro
git commit -m "feat: layout slide NumberedCards (1 ou 2 colonnes)"
```

---

### Task 2 : `slides/NumberedCardWithDetail.astro`

**Files :**
- Create : `src/components/slides/NumberedCardWithDetail.astro`

Layout : titre + colonne gauche avec un seul numbered card grand format (numéro, titre, sous-titre) suivi de blocs Déclencheur / Prérequis / Actions, et colonne droite avec une image.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/NumberedCardWithDetail.astro
import SlideTitle from '@/components/SlideTitle.astro';

interface Detail {
  label: string;
  text: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  highlight?: string;
  number: string;
  cardTitle: string;
  cardDescription?: string;
  details: Detail[];
  image?: string;
}

const { title, subtitle, highlight, number, cardTitle, cardDescription, details, image } = Astro.props;
---
<section class="numbered-card-detail" data-layout="numbered-card-detail">
  {title && <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />}
  <div class="numbered-card-detail__grid">
    <div class="numbered-card-detail__left">
      <div class="numbered-card-detail__head">
        <span class="numbered-card-detail__number">{number}</span>
        <div>
          <h3 class="numbered-card-detail__card-title">{cardTitle}</h3>
          {cardDescription && <p class="numbered-card-detail__card-desc">{cardDescription}</p>}
        </div>
      </div>
      <dl class="numbered-card-detail__details">
        {details.map((d) => (
          <Fragment>
            <dt>{d.label}</dt>
            <dd>{d.text}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
    {image && (
      <div class="numbered-card-detail__image">
        <img src={image} alt="" loading="lazy" decoding="async" />
      </div>
    )}
  </div>
</section>

<style>
  .numbered-card-detail {
    justify-content: flex-start !important;
  }
  .numbered-card-detail__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
    align-items: start;
  }
  .numbered-card-detail__head {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 24px;
    align-items: start;
    margin-bottom: 40px;
  }
  .numbered-card-detail__number {
    font-family: 'Space Grotesk', monospace;
    font-size: 64px;
    font-weight: 700;
    color: #5BA8D6;
    line-height: 1;
  }
  .numbered-card-detail__card-title {
    font-size: 28px;
    font-weight: 700;
    color: #191919;
    margin: 0 0 4px;
  }
  .numbered-card-detail__card-desc {
    font-size: 18px;
    color: #6B6F84;
    margin: 0;
  }
  .numbered-card-detail__details {
    margin: 0;
    display: grid;
    gap: 24px;
  }
  .numbered-card-detail__details dt {
    font-weight: 700;
    color: #191919;
    font-size: 22px;
    margin: 0;
  }
  .numbered-card-detail__details dd {
    font-size: 20px;
    color: #6B6F84;
    margin: 4px 0 0;
    line-height: 1.5;
  }
  .numbered-card-detail__image {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 12px 0 rgba(26, 26, 26, 0.04);
    aspect-ratio: 4 / 3;
  }
  .numbered-card-detail__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/NumberedCardWithDetail.astro
git commit -m "feat: layout slide NumberedCardWithDetail (declencheur/prerequis/actions + image)"
```

---

## Phase 2 : Layouts visuels

### Task 3 : `slides/BigImage.astro`

**Files :**
- Create : `src/components/slides/BigImage.astro`

Layout : titre optionnel + une image qui occupe quasi tout le slide, avec ou sans cadre arrondi.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/BigImage.astro
import SlideTitle from '@/components/SlideTitle.astro';

interface Props {
  title?: string;
  subtitle?: string;
  highlight?: string;
  image: string;
  alt?: string;
  caption?: string;
  frame?: boolean;
}

const { title, subtitle, highlight, image, alt = '', caption, frame = true } = Astro.props;
---
<section class="big-image" data-layout="big-image">
  {title && <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />}
  <figure class={`big-image__figure${frame ? ' big-image__figure--frame' : ''}`}>
    <img src={image} alt={alt} loading="lazy" decoding="async" />
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
</section>

<style>
  .big-image {
    justify-content: center !important;
  }
  .big-image__figure {
    margin: 0 auto;
    max-width: 1600px;
    width: 100%;
    text-align: center;
  }
  .big-image__figure--frame img {
    border-radius: 20px;
    box-shadow: 0 12px 12px 0 rgba(26, 26, 26, 0.04);
    border: 1px solid rgba(25, 25, 25, 0.06);
  }
  .big-image__figure img {
    max-width: 100%;
    max-height: 720px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .big-image__figure figcaption {
    margin-top: 16px;
    font-size: 18px;
    color: #6B6F84;
    font-style: italic;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/BigImage.astro
git commit -m "feat: layout slide BigImage (image pleine page avec ou sans cadre)"
```

---

## Phase 3 : Layouts pédagogiques

### Task 4 : `slides/Workshop.astro`

**Files :**
- Create : `src/components/slides/Workshop.astro`

Layout : titre + tableau Temps/Travail/Objectif/Sujet/Attentes (ou rows configurables), avec icône crayon.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Workshop.astro
import SlideTitle from '@/components/SlideTitle.astro';
import { Icon } from 'astro-icon/components';

interface Row {
  label: string;
  content: string | string[];
}

interface Props {
  title?: string;
  subtitle?: string;
  highlight?: string;
  subject: string;
  rows: Row[];
}

const { title, subtitle, highlight, subject, rows } = Astro.props;
---
<section class="workshop" data-layout="workshop">
  {title && <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />}
  <div class="workshop__wrapper">
    <span class="workshop__badge" aria-hidden="true">
      <Icon name="ph:pencil-simple" />
    </span>
    <table class="workshop__table">
      <thead>
        <tr>
          <th colspan="2">{subject}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr>
            <th scope="row">{row.label}</th>
            <td>
              {Array.isArray(row.content)
                ? row.content.map((line) => <p>{line}</p>)
                : row.content}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

<style>
  .workshop {
    justify-content: flex-start !important;
  }
  .workshop__wrapper {
    position: relative;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
  .workshop__badge {
    position: absolute;
    top: -24px;
    left: -24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #2EC27E;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  .workshop__badge :global(svg) {
    width: 28px;
    height: 28px;
  }
  .workshop__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 22px;
  }
  .workshop__table thead th {
    background: #191919;
    color: #FFFFFF;
    text-align: left;
    padding: 18px 32px;
    font-weight: 500;
  }
  .workshop__table tbody th {
    background: rgba(25, 25, 25, 0.04);
    text-align: left;
    padding: 16px 32px;
    font-weight: 400;
    color: #6B6F84;
    width: 220px;
  }
  .workshop__table tbody td {
    padding: 16px 32px;
    color: #6B6F84;
  }
  .workshop__table tbody tr {
    background: rgba(25, 25, 25, 0.02);
  }
  .workshop__table tbody td p {
    margin: 0 0 4px;
  }
  .workshop__table tbody td p:last-child {
    margin-bottom: 0;
  }
</style>
```

Note : l'icône Phosphor `ph:pencil-simple` est rendue via `astro-icon` qui consomme `@iconify-json/ph` déjà installé en v1.

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Workshop.astro
git commit -m "feat: layout slide Workshop (icone vert + table guidelines)"
```

---

### Task 5 : `slides/Calendar.astro`

**Files :**
- Create : `src/components/slides/Calendar.astro`

Layout : titre + tableau Horaire/Sujet/Intervenant pour un jour de cours.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Calendar.astro
import SlideTitle from '@/components/SlideTitle.astro';

interface Slot {
  time: string;
  subject: string;
  speaker?: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  highlight?: string;
  day: string;
  slots: Slot[];
  speakerHeader?: string;
  showSpeakerColumn?: boolean;
}

const {
  title = 'Calendrier',
  subtitle,
  highlight,
  day,
  slots,
  speakerHeader = 'Intervenant',
  showSpeakerColumn = true,
} = Astro.props;
---
<section class="calendar" data-layout="calendar">
  <SlideTitle title={title} subtitle={subtitle} highlight={highlight} />
  <div class="calendar__wrapper">
    <span class="calendar__day-label">{day}</span>
    <table class="calendar__table">
      <thead>
        <tr>
          <th>Horaire</th>
          <th>Sujet</th>
          {showSpeakerColumn && <th>{speakerHeader}</th>}
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr>
            <td class="calendar__time">{slot.time}</td>
            <td class="calendar__subject">{slot.subject}</td>
            {showSpeakerColumn && <td class="calendar__speaker">{slot.speaker ?? ''}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

<style>
  .calendar {
    justify-content: flex-start !important;
  }
  .calendar__wrapper {
    display: flex;
    align-items: stretch;
    gap: 24px;
    max-width: 1500px;
    margin: 0 auto;
    width: 100%;
  }
  .calendar__day-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 18px;
    color: #6B6F84;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
    align-self: stretch;
    display: flex;
    align-items: center;
    border: 1px solid rgba(25, 25, 25, 0.08);
    border-radius: 12px;
    padding: 16px 0;
  }
  .calendar__table {
    flex: 1;
    border-collapse: collapse;
    font-size: 20px;
  }
  .calendar__table thead th {
    background: #191919;
    color: #FFFFFF;
    text-align: left;
    padding: 16px 24px;
    font-weight: 500;
  }
  .calendar__table tbody tr:nth-child(odd) {
    background: rgba(25, 25, 25, 0.04);
  }
  .calendar__table tbody tr:nth-child(even) {
    background: rgba(91, 168, 214, 0.06);
  }
  .calendar__table tbody td {
    padding: 14px 24px;
    color: #6B6F84;
  }
  .calendar__time {
    color: #191919 !important;
    font-weight: 500;
    white-space: nowrap;
  }
  .calendar__subject {
    color: #191919 !important;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Calendar.astro
git commit -m "feat: layout slide Calendar (horaire / sujet / intervenant)"
```

---

## Phase 4 : Layouts d'accroche

### Task 6 : `slides/Quote.astro`

**Files :**
- Create : `src/components/slides/Quote.astro`

Layout : citation centrée avec attribution (auteur, rôle, image optionnelle).

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Quote.astro
interface Props {
  text: string;
  author: string;
  role?: string;
  image?: string;
  highlight?: string;
}

const { text, author, role, image, highlight } = Astro.props;

function splitHighlight(t: string, mot?: string) {
  if (!mot) return null;
  const idx = t.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return null;
  return {
    before: t.slice(0, idx),
    match: t.slice(idx, idx + mot.length),
    after: t.slice(idx + mot.length),
  };
}

const textParts = splitHighlight(text, highlight);
---
<section class="quote-slide" data-layout="quote">
  <figure>
    <blockquote class="quote-slide__text">
      <span class="quote-slide__mark" aria-hidden="true">&#x201C;</span>
      {textParts
        ? <span>{textParts.before}<span class="underline">{textParts.match}</span>{textParts.after}</span>
        : <span>{text}</span>}
    </blockquote>
    <figcaption class="quote-slide__attribution">
      {image && (
        <span class="quote-slide__avatar">
          <img src={image} alt={author} loading="lazy" decoding="async" />
        </span>
      )}
      <span class="quote-slide__name-block">
        <span class="quote-slide__author">{author}</span>
        {role && <span class="quote-slide__role">{role}</span>}
      </span>
    </figcaption>
  </figure>
</section>

<style>
  .quote-slide {
    justify-content: center !important;
    align-items: center !important;
    text-align: center;
  }
  .quote-slide figure {
    margin: 0;
    max-width: 1400px;
  }
  .quote-slide__text {
    position: relative;
    font-size: 44px;
    line-height: 1.3;
    font-weight: 700;
    color: #191919;
    margin: 0 0 48px;
    quotes: none;
  }
  .quote-slide__mark {
    position: absolute;
    top: -32px;
    left: -16px;
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 120px;
    line-height: 1;
    color: #FFD838;
    opacity: 0.6;
  }
  .quote-slide__attribution {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    justify-content: center;
  }
  .quote-slide__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
  }
  .quote-slide__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .quote-slide__name-block {
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .quote-slide__author {
    font-size: 22px;
    font-weight: 700;
    color: #191919;
  }
  .quote-slide__role {
    font-size: 18px;
    color: #6B6F84;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Quote.astro
git commit -m "feat: layout slide Quote (citation centree avec attribution)"
```

---

### Task 7 : `slides/Custom.astro`

**Files :**
- Create : `src/components/slides/Custom.astro`

Layout : échappatoire pour mises en page non couvertes par le catalogue. Slot brut + props de styling minimal.

- [ ] **Step 1 : Écrire le composant**

```astro
---
// src/components/slides/Custom.astro
interface Props {
  background?: 'white' | 'dark' | 'gold';
  align?: 'top' | 'center' | 'bottom';
  class?: string;
}

const { background = 'white', align = 'top', class: extraClass } = Astro.props;

const classes = [
  'custom-slide',
  `custom-slide--bg-${background}`,
  `custom-slide--align-${align}`,
  extraClass,
].filter(Boolean).join(' ');
---
<section class={classes} data-layout="custom">
  <slot />
</section>

<style>
  .custom-slide {
    width: 100%;
    height: 100%;
  }
  .custom-slide--bg-white {
    background: #FFFFFF;
    color: #6B6F84;
  }
  .custom-slide--bg-dark {
    background: #191919;
    color: rgba(255, 255, 255, 0.92);
  }
  .custom-slide--bg-gold {
    background: #FFD838;
    color: #191919;
  }
  .custom-slide--align-top {
    justify-content: flex-start !important;
  }
  .custom-slide--align-center {
    justify-content: center !important;
    align-items: center !important;
  }
  .custom-slide--align-bottom {
    justify-content: flex-end !important;
  }
  .custom-slide :global(h1),
  .custom-slide :global(h2),
  .custom-slide :global(h3) {
    color: inherit;
  }
  .custom-slide--bg-dark :global(h1),
  .custom-slide--bg-dark :global(h2),
  .custom-slide--bg-dark :global(h3) {
    color: rgba(255, 255, 255, 0.92);
  }
  .custom-slide--bg-gold :global(h1),
  .custom-slide--bg-gold :global(h2),
  .custom-slide--bg-gold :global(h3) {
    color: #191919;
  }
</style>
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/slides/Custom.astro
git commit -m "feat: layout slide Custom (slot libre, 3 backgrounds, 3 aligns)"
```

---

## Phase 5 : Démo dans le sample deck

### Task 8 : Étendre le sample deck pour démontrer chaque nouveau layout

**Files :**
- Modify : `src/content/presentations/crm-data-automation.mdx`

Ajouter 7 nouveaux slides au deck CRM Data Auto qui exhibent chaque layout en conditions réelles. Cela sert à la fois de démo visuelle et de smoke test du build.

- [ ] **Step 1 : Lire le fichier existant pour insérer les nouvelles slides au bon endroit (entre les slides existantes)**

Ouvrir `src/content/presentations/crm-data-automation.mdx`. La structure actuelle (5 slides) :

```
Cover
Title (Jour 1)
Statement
TableSlide (Stack)
Closing
```

On veut insérer dans cet ordre, juste avant le Closing :

```
Cover
Title (Jour 1)
Statement
Calendar (planning Jour 1)
TableSlide (Stack)
NumberedCards (4 piliers)
NumberedCardWithDetail (Workflow exemple)
BigImage (diagramme funnel)
Workshop (consigne d'atelier)
Quote (citation)
Custom (slide d'accroche dark)
Closing
```

- [ ] **Step 2 : Réécrire le fichier MDX complet**

```mdx
---
title: "CRM, Data & automation"
subtitle: "Formation continue HEC Lausanne"
short: "CRM, Data, Automation"
date: 2026-06-25
type: cours
unlisted: false
description: "Formation Executive Education sur la collecte de données, le choix d'un CRM et l'automatisation des parcours client avec IA et low-code."
---

import Cover from '@/components/slides/Cover.astro';
import Title from '@/components/slides/Title.astro';
import Statement from '@/components/slides/Statement.astro';
import TableSlide from '@/components/slides/TableSlide.astro';
import Calendar from '@/components/slides/Calendar.astro';
import NumberedCards from '@/components/slides/NumberedCards.astro';
import NumberedCardWithDetail from '@/components/slides/NumberedCardWithDetail.astro';
import BigImage from '@/components/slides/BigImage.astro';
import Workshop from '@/components/slides/Workshop.astro';
import Quote from '@/components/slides/Quote.astro';
import Custom from '@/components/slides/Custom.astro';
import Closing from '@/components/slides/Closing.astro';

<Cover
  title="CRM, Data & automation"
  subtitle="Formation continue HEC Lausanne"
  eyebrow="Juin 2026"
  image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop"
/>

<Title
  chapter="Jour 1"
  title="Data"
  subtitle="Collecter, structurer, intégrer la donnée client"
/>

<Statement>
La donnée est la nouvelle <span class="underline">matière première</span> du marketing.
</Statement>

<Calendar
  title="Calendrier"
  subtitle="Jour 1, données client"
  day="Jour 1"
  slots={[
    { time: '09h00 - 10h30', subject: "Pourquoi la donnée", speaker: 'Thomas' },
    { time: '10h45 - 12h00', subject: 'Sources et collecte', speaker: 'Thomas' },
    { time: '13h00 - 14h30', subject: 'Structuration et qualité', speaker: 'Thomas' },
    { time: '14h45 - 16h00', subject: 'Intégration et synchronisation', speaker: 'Thomas' },
    { time: '16h15 - 17h00', subject: 'Atelier pratique', speaker: 'Thomas' },
  ]}
/>

<TableSlide
  title="Stack pour petite structure"
  subtitle="Moins de 50 CHF par mois"
  highlight="50 CHF"
  intro="Les outils ne nécessitent pas un investissement élevé. Voici une proposition de stack digital pour les petites structures sans budget."
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

<NumberedCards
  title="Faire progresser vos prospects dans le funnel"
  subtitle="Quatre leviers pour automatiser le parcours"
  cols={2}
  items={[
    { number: '01', title: "Analyse d'engagement", description: 'Suivi des interactions avec vos contenus et offres' },
    { number: '02', title: 'Lead nurturing', description: 'Communications régulières et personnalisées' },
    { number: '03', title: 'Analyse de correspondance', description: "Matching avec le profil d'un client idéal" },
    { number: '04', title: 'Lead scoring', description: 'Notation des leads selon leurs comportements' },
  ]}
/>

<NumberedCardWithDetail
  title="Exemples de workflows d'automatisation"
  subtitle="Workflow 01 : analyse d'engagement"
  number="01"
  cardTitle="Analyse d'engagement"
  cardDescription="Suivi des interactions avec vos contenus et offres"
  details={[
    { label: 'Déclencheur', text: 'Le lead X a visité la page pricing 2 fois en 3 jours.' },
    { label: 'Prérequis', text: 'Tracking des pages (HubSpot, ActiveCampaign, Brevo, etc.).' },
    { label: 'Actions', text: "Envoi d'une offre d'essai spéciale valable deux jours (FOMO)." },
  ]}
  image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=900&fit=crop"
/>

<BigImage
  title="Funnel marketing complet"
  subtitle="Vue inbound + outbound, des touchpoints aux résultats"
  image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&h=900&fit=crop"
  caption="Schéma de funnel marketing inbound et outbound"
  frame
/>

<Workshop
  title="Atelier"
  subtitle="Funnel marketing"
  subject="Funnel marketing"
  rows={[
    { label: 'Temps', content: '30 minutes' },
    { label: 'Travail', content: ['10 minutes individuelles', '20 minutes de peer sharing'] },
    { label: 'Objectif', content: ["Identifier tout ou partie du funnel individuellement", "Partager avec la classe pour réaliser un funnel commun"] },
    { label: 'Sujet', content: "Business, objectif et persona d'un participant" },
    { label: 'Attentes', content: ['Faire le lien avec les sujets du cours (Landing page, nurturing, etc.)', 'Couvrir un maximum de canaux'] },
  ]}
/>

<Quote
  text="Sur un projet récent, un client estimait à 10 minutes le temps de création d'une offre commerciale. Je lui ai demandé de chronométrer pendant une semaine. Résultat : 20 minutes par offre. Le double."
  author="Thomas Rouaud"
  role="Consultant CRM, Data, IA & Automation"
  highlight="20 minutes"
/>

<Custom background="dark" align="center">
  <h1 style="color: #FFD838; font-size: 80px; margin: 0;">Pause café</h1>
  <p style="color: rgba(255, 255, 255, 0.7); font-size: 28px; margin-top: 16px;">15 minutes</p>
</Custom>

<Closing variant="qa" />
```

- [ ] **Step 3 : Build pour vérifier**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run build
```

Expected : pas d'erreur, 4 pages générées comme avant (la collection a toujours 1 entrée). Si erreur, lire le message et fixer.

- [ ] **Step 4 : Commit**

```bash
git add src/content/presentations/crm-data-automation.mdx
git commit -m "feat: deck CRM Data Auto etendu pour demo des 7 nouveaux layouts"
```

---

## Phase 6 : Validation visuelle et déploiement

### Task 9 : Vérifier en local et déployer

- [ ] **Step 1 : Lancer le dev server**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation"
npm run dev
```

Ouvrir l'URL affichée (typiquement http://localhost:4321/ ou /4322 si occupé).

- [ ] **Step 2 : Vérifier chaque nouveau layout en navigant le deck**

Aller sur `/p/crm-data-automation`, parcourir au clavier (espace ou flèche droite). Pour chaque slide, vérifier :

- **Calendar** : pastille "Jour 1" verticale gauche + tableau Horaire/Sujet/Intervenant + alternance lignes
- **NumberedCards** : 4 cartes numérotées 01-04 sur 2 colonnes, chiffres en bleu, titres et descriptions lisibles
- **NumberedCardWithDetail** : 1 carte 01 grand format à gauche avec Déclencheur/Prérequis/Actions, image à droite avec coins arrondis
- **BigImage** : image grand format avec cadre arrondi, ombre légère, caption italic en dessous
- **Workshop** : badge vert circulaire avec icône crayon en top-left du tableau, headers Temps/Travail/Objectif/Sujet/Attentes lisibles
- **Quote** : citation 44px gras avec guillemet ouvrant gold transparent, attribution auteur + rôle dessous
- **Custom** : fond noir, "Pause café" 80px gold, "15 minutes" en clair dessous

Tester aussi le mode lecture (clic sur "Lecture" haut-droit) pour vérifier que tous les nouveaux layouts dégradent correctement en scroll vertical.

- [ ] **Step 3 : Build et push**

```bash
npm run build
git push origin main
```

Le push déclenche automatiquement un nouveau déploiement Cloudflare Pages.

- [ ] **Step 4 : Vérifier en production**

Attendre 1 à 2 minutes, ouvrir `https://slides.lausanne.marketing/p/crm-data-automation`. Confirmer que tout s'affiche correctement.

---

## Récap : ce qu'on a livré en v2

À la fin de ce plan :

- 7 nouveaux layouts livrés : NumberedCards, NumberedCardWithDetail, BigImage, Workshop, Calendar, Quote, Custom
- Catalogue de 12 layouts au total (5 v1 + 7 v2), tous documentés dans le spec
- Sample deck CRM Data Auto étendu à 12 slides qui exercent chaque layout
- Build et déploiement à jour sur `slides.lausanne.marketing`

## Hors scope v2, à traiter dans plans suivants

- **Plan v3** : extraction des 12 modules de contenu réutilisables depuis `source/2025/` (StackPetiteStructure, FunnelTOFUMOFUBOFU, Workflow01-04, LeadNurturingPrincipes, ProtectionDonneesGDPR, AutomationAvancee, IAAutomation, QuiSuisJe, ContactsLM)
- **Plan v4** : rédaction complète du deck CRM, Data & automation sur 3 jours, qui consomme les modules v3 et compose le contenu pédagogique réel
- **Plan v5 (optionnel)** : polish, Pagefind UI sur la landing, transitions Reveal customisées, optimisation images

## Décisions ouvertes à confirmer pendant l'implémentation

- Couleur du chiffre dans NumberedCards et NumberedCardWithDetail : actuellement `#5BA8D6` (bleu accent ExecEd). Si Thomas veut gold (`#FFD838`) ou noir (`#191919`), à changer dans 2 fichiers.
- Couleur du badge Workshop : actuellement vert (`#2EC27E`). À garder ou aligner sur la palette LM (probablement gold).
- Calendar : alternance de lignes utilise un bleu clair `rgba(91, 168, 214, 0.06)` pour les lignes paires. À simplifier en gris si trop dissonant avec la charte LM.
