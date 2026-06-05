---
date: 2026-05-22
status: draft
title: Refonte design vote mobile + slides Poll/WordCloud (charte lm)
author: Thomas Rouaud
---

# Refonte design vote + slides Poll/WordCloud : spec de design

## 1. Contexte et motivation

La feature sondages live (`<Poll>`, `<WordCloud>`) introduite le 2026-05-21 est fonctionnelle mais le rendu visuel reste générique : la page mobile de vote utilise une typographie et des border-radius ad hoc, le nuage de mots est rendu en flex-wrap simple sans packing élégant, les boutons de la slide ne suivent pas le pattern visuel `lm/` (rounded-pill 40px, hover lm).

Le brief Thomas : aligner la chaîne de UX (vote mobile → slide live → slide archivée) sur la charte `lm/` déjà cristallisée dans `lm/src/pages/ds.astro`, pour que les sessions de formation paraissent natives à l'écosystème Lausanne Marketing plutôt que génériques.

### 1.1 Objectifs

1. **Page vote mobile** réutilise le langage visuel `lm/` : logo SVG inline (triangles gold + L), boutons full-width façon `lm/src/components/Button.astro` (rounded-pill 40px, primary gold), inputs rounded-pill.
2. **Slides Poll + WordCloud** : boutons restylés au pattern lm, watermark logo discret.
3. **Nuage de mots** : packing spiral algorithmique (no lib externe), couleurs hiérarchiques selon le rang (top=gold, suivants=dark, queue=grey), rotation 0°/90° stable seedée par hash.

### 1.2 Hors scope

- Refonte du catalogue complet des slides (Cover, Section, ImageGrid, Closing, AgendaLight/Full, Statement, Quote, Timer) : reste inchangé.
- Import littéral du composant Astro `Button.astro` depuis le repo `lm/` : duplication visuelle uniquement (couleurs, radii, typo), pas de dépendance cross-repo.
- Refonte des écrans `merci/erreur/chargement` de la page vote : ils gardent leurs emojis (`✅ ⏳ 🔒 ⚠️`) et leur structure actuelle (scope minimal validé).
- Animations 3D ou effets WebGL sur le nuage de mots.
- Modération du contenu du nuage de mots (déjà hors scope v1 sondages).
- Internationalisation : tout reste en français.
- Mode présentateur : couvert par les commits `2c66cbe` (presenter mode) et `807297e` (secret) du 2026-05-22, pas touché ici.

## 2. Page vote mobile (`src/pages/v/[token].astro`)

### 2.1 Header

Remplacement du texte brand `Lausanne Marketing` par le SVG logo inline copié depuis `lm/src/pages/ds.astro` lignes 798-801 :

- 2 paths triangulaires gold (`#FEE487` et `#FFD838`) + 1 path noir pour la lettre L.
- Dimensions header : 32px × 20px (compact mobile, conserve le ratio 49:32 du logo).
- `viewBox="0 0 49 32"`, `aria-hidden="true"` (le `<a href="/" aria-label>` parent porte le nom accessible).

Status (dot + label) à droite, inchangé.

### 2.2 Boutons options QCM (`renderForm` type=choice)

État actuel : `.vote-option` est full-width (`width: 100%`), `border-radius: 12px`, border 2px dark, tap → fond gold.

État cible :

- `border-radius: 40px` (rounded-pill, match `lm/` Button).
- Padding vertical : 20px (au lieu de 16px) pour la prise tactile.
- `font-weight: 700`, `font-size: 18px` (conservé).
- Margin-bottom : 16px entre options (au lieu de 12px) pour la respiration.
- État hover/active : `transition: all 200ms ease`, ombre légère qui se renforce au tap.
- Tap → fond gold `#FFD838`, texte dark, transition douce.

Stack vertical naturel via `display: block` + margin-bottom (déjà le cas, juste les valeurs ajustées).

### 2.3 Bouton "Envoyer" et input mot (type=word)

État cible :

- Input : `border-radius: 40px` (au lieu de 12px), padding 20px 28px, `font-size: 18px`, autofocus conservé.
- Bouton submit : full-width, `border-radius: 40px`, `background: #FFD838`, `color: #191919`, `font-weight: 700`, hauteur 60px. Au disabled : `opacity: 0.4` (conservé).
- Spacing : `gap: 16px` entre input et bouton (au lieu de 12px).

### 2.4 États écrans (idle/erreur/merci)

Conservés tels quels :

- `vote-message` wrap : `padding: 40px 16px`, centré.
- Emojis 64px (`✅ ⏳ 🔒 ⚠️ ❌ ⏱️ ℹ️`).
- Titre 28px Hanken Grotesk 700.
- Détail 18px grey.
- Bouton action (Réessayer / Envoyer un autre mot) : `border-radius: 40px`, background gold, texte dark, padding 12px 28px.

## 3. Slide Poll (`src/components/slides/Poll.astro`)

### 3.1 Boutons start (états initial + archived)

- Class `.poll-slide__start-btn` actuelle : `font-weight: 800, font-size: 28px, border-radius: 12px, padding 24px 48px, border 2px solid #191919, background #FFD838`.
- Cible : `border-radius: 40px` (rounded-pill), suppression de la border 2px (remplacement par ombre `box-shadow: 0 4px 16px rgba(25, 25, 25, 0.12)`), hover `transform: translateY(-2px); box-shadow: 0 6px 20px rgba(25, 25, 25, 0.2)`.
- Le bouton reste presenter-only via la classe existante.

### 3.2 Actions row (figer + reset + nouvelle session)

Conservée telle quelle : container blanc avec ombre, `border-radius: 10px`, padding 6px, gap 8px, icônes Phosphor SVG inline 20px. Le hover gold sur chaque bouton est conservé.

### 3.3 Watermark logo

Ajout d'un SVG logo lm en bas-droit de la slide, opacité 0.08, dimensions 80px × 50px, `pointer-events: none`. Position : `bottom: 32px; right: 32px`.

Signature discrète, visible mais pas distrayante.

### 3.4 Bars QCM

Conservées telles quelles (gold fill, flash 600ms à chaque vote, transition width 400ms ease-out).

## 4. Slide WordCloud (`src/components/slides/WordCloud.astro` + `Deck.astro:renderPollWordCloud`)

### 4.1 Container chart

Avant : `display: flex; flex-wrap: wrap; min-height: 500px; padding: 24px`.

Cible :

- `position: relative` (positioning des mots en absolute).
- `width: 100%` du grid-area (60% du body, soit ~1020px en 1920x1080).
- `min-height: 600px` (un peu plus haut pour le packing).
- `overflow: hidden`.
- `padding: 0` (le packing gère ses propres marges via maxWidth/maxHeight).

### 4.2 Spiral packing algorithm (custom JS, no lib)

Fonction `packWords(words, container)` dans `Deck.astro`, ~80 lignes :

**Étapes** :

1. Mesurer la bbox de chaque mot via offscreen `<canvas>`, en tenant compte du fontSize calculé (`clamp(28, 28 + count*6, 96)`) et de la rotation.
2. Trier descending par count.
3. Pour chaque mot, parcourir une spirale Archimédienne depuis le centre du container :
   - `t = i * 0.15` (angle incrémental)
   - `r = t * 2` (rayon croissant)
   - `x = cx + r * cos(t)`
   - `y = cy + r * sin(t)`
4. Tester collision AABB (axis-aligned bounding box) avec les mots déjà placés + padding 4px.
5. Si pas de collision : placer le mot, l'ajouter à la liste des bbox occupées.
6. Max 1000 itérations par mot → si pas de fit, le mot est skippé (peu probable avec 30 mots max).

**Rotation seedée** :

```js
function shouldRotate(word) {
  // Hash stable du mot → 30% de chance de rotation 90°
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100 < 30;
}
```

**Top 3 toujours horizontaux** : même si `shouldRotate` retourne true pour un mot du top 3, on force `rotation = 0` (lisibilité du gagnant).

**Bbox avec rotation** : si rotation 90°, swap width/height.

### 4.3 Couleurs hiérarchiques

Fonction `pickColor(rank)` :

- `rank === 0` (top 1) : `#FFD838` (gold)
- `rank === 1 || rank === 2` (top 2-3) : `#191919` (dark)
- `rank >= 3` : `#6B6F84` (grey)

### 4.4 Rendu DOM

Le container `data-poll-chart` reçoit en innerHTML :

```html
<span class="wordcloud-slide__word" style="
  position: absolute;
  left: <x>px;
  top: <y>px;
  font-size: <size>px;
  color: <color>;
  transform: <rotate(-90deg) si rotated>;
  transform-origin: <pivotage cohérent>;
">{word}</span>
```

L'animation `wordcloud-pop` existante (scale 0→1 cubic-bezier 0.34, 1.56, 0.64, 1) est conservée.

### 4.5 Performance

~30 mots × 1000 itérations × ~5 collision checks = 150k ops max, soit < 30ms en JS moderne. Recalcul à chaque polling 1.5s acceptable.

## 5. Fichiers modifiés

1. `src/pages/v/[token].astro` : header SVG logo + restyle inputs/buttons (rounded-pill 40px).
2. `src/layouts/Deck.astro` : nouvelle fonction `packWords()` + nouveau `renderPollWordCloud()` qui utilise le packing.
3. `src/components/slides/Poll.astro` : restyle `.poll-slide__start-btn` (rounded-pill, ombre).
4. `src/components/slides/WordCloud.astro` : restyle `.wordcloud-slide__start-btn` (idem Poll) + container chart `position: relative`.
5. `src/styles/slides.css` : ajout watermark logo lm (positioning + opacity).

Aucun nouveau fichier nécessaire.

## 6. Critères d'acceptation

- Page vote mobile sur iPhone 13 (390×844) : logo SVG visible en haut, options/inputs/boutons full-width avec rounded-pill 40px, tap accessible sans zoom.
- Slide Poll : bouton "Démarrer le sondage" et "Nouvelle session" avec rounded-pill + ombre douce, hover lift, watermark logo bas-droit opacité 0.08.
- Slide WordCloud : avec 8-12 mots de count variable, le mot top 1 est central et gold #FFD838, top 2-3 dark, queue grey. ~30% des mots sont à 90°. Aucun chevauchement. Refresh à 1.5s ne crée pas de flicker (positions stables grâce au hash seed).
- Aucune régression sur les boutons figer/reset/Démarrer (le fix CORS du 2026-05-22 reste opérationnel).
- Tous les états de la page vote (idle/connection/open/closed/error/already-voted/rate-limited) conservent leurs emojis et leurs labels actuels.

## 7. Risques et atténuations

- **Spiral packing trop lent sur device faible** : si > 100ms perçu, ajouter un debounce sur le polling ou cap à 20 mots affichés. Mesurer en réel avant d'optimiser.
- **Mots trop longs qui ne fittent jamais** : si la bbox d'un mot dépasse la moitié du container, on le rétrécit (clamp font-size dynamique). Cap font-size minimal à 24px (en dessous illisible projeté).
- **Hash collision (deux mots différents même rotation pattern)** : non bloquant, c'est un détail esthétique.
- **Top 3 reste vertical** dans le cas où 2+ mots ont le même count (égalité) : règle stricte sur le rang ordonné par tri, pas par count. Comportement déterministe.
