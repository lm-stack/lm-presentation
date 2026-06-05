# Refonte design vote mobile + slides Poll/WordCloud — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner la chaîne UX vote (page mobile → slide live → slide archivée) sur la charte lm : logo SVG inline, boutons rounded-pill 40px, et nuage de mots avec spiral packing custom + couleurs hiérarchiques + rotation 0°/90° seedée.

**Architecture:** Modifications CSS et JS dans 5 fichiers existants. Pas de nouvelle dépendance npm. L'algorithme de packing custom (~80 lignes) remplace l'ancien flex-wrap dans `renderPollWordCloud()`. Le SVG logo lm est copié inline (pas d'import cross-repo).

**Tech Stack:** Astro 6, Reveal.js 6 (existant), DOM API native, canvas.measureText pour bbox.

**Spec:** `docs/superpowers/specs/2026-05-22-vote-design-refresh-design.md` (commit `7ace300`).

---

## File Structure

Fichiers modifiés (existants) :

- `src/layouts/Deck.astro` — Helpers de packing + nouveau `renderPollWordCloud()`
- `src/components/slides/WordCloud.astro` — CSS container `.wordcloud-slide__chart` + `.wordcloud-slide__word` + bouton start
- `src/components/slides/Poll.astro` — CSS bouton start + watermark SVG
- `src/pages/v/[token].astro` — Header SVG logo + restyle inputs/buttons inline `<style>`
- `src/styles/slides.css` — Ajout `.deck-logo-watermark`

Aucun nouveau fichier. Pas de tests automatisés (lm-presentation n'a pas de runner de tests — vérification via `npm run dev` + observation visuelle).

---

## Task 1: Spiral packing helpers + nouvelle fonction `renderPollWordCloud` dans Deck.astro

**Files:**
- Modify: `src/layouts/Deck.astro` (autour des lignes 690-720 actuelles)

- [ ] **Step 1: Ouvrir le fichier et localiser les fonctions wordcloud**

Lire `src/layouts/Deck.astro` autour des lignes 674-720 pour confirmer la position de `renderPollResults` (~ligne 674) et `renderPollWordCloud` (~ligne 709). Vérifier que `sumVotes` (~ligne 734) sert de point de référence pour insérer les helpers juste avant.

- [ ] **Step 2: Insérer les 4 helpers de packing juste avant `function sumVotes`**

Insérer ce bloc avant `function sumVotes` (env. ligne 734). Le bloc déclare le canvas de mesure au niveau du script (pas dans chaque appel).

```typescript
      // ================================================================
      // Spiral packing pour le wordcloud (custom, no lib).
      // Algorithme Archimédien : on trie les mots par count desc, on place
      // le premier au centre, les suivants spiralent depuis le centre en
      // cherchant la première position sans collision (AABB + padding 4px).
      // Rotation 0°/90° seedée par hash du mot pour stabilité au refresh.
      // Top 3 toujours horizontaux pour lisibilité.
      // ================================================================

      const wordCloudMeasureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      const wordCloudMeasureCtx = wordCloudMeasureCanvas?.getContext('2d') ?? null;

      function hashStr(s: string): number {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
          h = ((h << 5) - h) + s.charCodeAt(i);
          h |= 0;
        }
        return Math.abs(h);
      }

      function shouldRotateWord(word: string, rank: number): boolean {
        if (rank < 3) return false; // top 3 toujours horizontal
        return hashStr(word) % 100 < 30;
      }

      function pickWordColor(rank: number): string {
        if (rank === 0) return '#FFD838';
        if (rank <= 2) return '#191919';
        return '#6B6F84';
      }

      type WordInput = { word: string; count: number; fontSize: number };
      type WordPlacement = {
        word: string;
        x: number;
        y: number;
        w: number;
        h: number;
        rotated: boolean;
        fontSize: number;
        color: string;
      };

      function measureWordBbox(word: string, fontSize: number, rotated: boolean): { w: number; h: number } {
        if (!wordCloudMeasureCtx) return { w: fontSize * word.length * 0.6, h: fontSize };
        wordCloudMeasureCtx.font = `800 ${fontSize}px "Hanken Grotesk", sans-serif`;
        const m = wordCloudMeasureCtx.measureText(word);
        const textW = m.width;
        const textH = fontSize * 1.0;
        return rotated ? { w: textH, h: textW } : { w: textW, h: textH };
      }

      function packWords(words: WordInput[], width: number, height: number): WordPlacement[] {
        const placed: WordPlacement[] = [];
        const cx = width / 2;
        const cy = height / 2;
        const PADDING = 4;
        const MAX_STEPS = 1000;

        words.forEach((w, rank) => {
          const rotated = shouldRotateWord(w.word, rank);
          const color = pickWordColor(rank);
          const bbox = measureWordBbox(w.word, w.fontSize, rotated);

          for (let i = 0; i < MAX_STEPS; i++) {
            const t = i * 0.15;
            const r = t * 2;
            const x = cx + r * Math.cos(t) - bbox.w / 2;
            const y = cy + r * Math.sin(t) - bbox.h / 2;

            if (x < 0 || y < 0 || x + bbox.w > width || y + bbox.h > height) continue;

            let collide = false;
            for (const p of placed) {
              if (
                x < p.x + p.w + PADDING &&
                x + bbox.w + PADDING > p.x &&
                y < p.y + p.h + PADDING &&
                y + bbox.h + PADDING > p.y
              ) {
                collide = true;
                break;
              }
            }

            if (!collide) {
              placed.push({ word: w.word, x, y, w: bbox.w, h: bbox.h, rotated, fontSize: w.fontSize, color });
              break;
            }
          }
        });

        return placed;
      }
```

- [ ] **Step 3: Remplacer la fonction `renderPollWordCloud` existante**

Localiser la fonction `renderPollWordCloud` (env. ligne 709) et remplacer son corps complet par cette nouvelle implémentation. La signature reste identique pour ne pas casser les appelants.

```typescript
      function renderPollWordCloud(s: PollSlideState, votes: Record<string, number>) {
        const chart = s.section.querySelector<HTMLElement>('[data-poll-chart]')!;
        const sorted = Object.entries(votes).sort(([, a], [, b]) => b - a).slice(0, 30);
        if (sorted.length === 0) {
          chart.innerHTML = '';
          return;
        }

        const words: WordInput[] = sorted.map(([word, count]) => ({
          word,
          count,
          fontSize: Math.min(96, Math.max(28, 28 + count * 6)),
        }));

        const width = chart.clientWidth || 1000;
        const height = chart.clientHeight || 600;

        const placements = packWords(words, width, height);

        chart.innerHTML = '';
        placements.forEach((p) => {
          const span = document.createElement('span');
          span.className = p.rotated ? 'wordcloud-slide__word wordcloud-slide__word--v' : 'wordcloud-slide__word';
          span.textContent = p.word;
          span.style.position = 'absolute';
          span.style.fontSize = `${p.fontSize}px`;
          span.style.color = p.color;
          span.style.lineHeight = '1';
          span.style.whiteSpace = 'nowrap';
          if (p.rotated) {
            span.style.left = `${p.x}px`;
            span.style.top = `${p.y + p.h}px`;
            span.style.transformOrigin = 'left top';
          } else {
            span.style.left = `${p.x}px`;
            span.style.top = `${p.y}px`;
          }
          chart.appendChild(span);
        });
      }
```

- [ ] **Step 4: Vérifier le typage TypeScript**

Lancer le check TS (rapide) :

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && npx astro check 2>&1 | tail -20
```

Expected : zéro erreur sur Deck.astro. Si erreurs typing : corriger les `as HTMLElement` ou imports manquants avant de continuer.

- [ ] **Step 5: Démarrer le dev server et vérifier la slide WordCloud**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && npm run dev
```

Ouvrir `http://localhost:4321/p/template/?presenter=YQX4W5TFARPD` dans Chrome, naviguer jusqu'à la slide WordCloud du template. Lancer un sondage, soumettre quelques mots via `/v/<token>`. Le wordcloud devrait apparaître avec spiral packing (top central gold, suivants dark, queue grey), certains mots à 90°.

Note : le styling positionnel ne fonctionne qu'après l'étape Task 2 qui passe le container en `position: relative`. À ce stade, les `<span position:absolute>` se positionnent par rapport au plus proche parent positionné (le slide ou le body), pas par rapport au container. C'est attendu pour l'instant.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git add src/layouts/Deck.astro && git commit -m "$(cat <<'EOF'
feat(deck): spiral packing custom pour le wordcloud

Remplace le rendu flex-wrap par un algorithme Archimedien custom (no lib).
Mesure des bbox via canvas.measureText, collision AABB + padding 4px,
rotation 0/90deg seedee par hash du mot pour stabilite sur refresh.

Couleurs hierarchiques : top=gold, 2-3=dark, queue=grey. Top 3 forces
horizontaux pour lisibilite. Plein effet visible apres Task 2 qui passe
le container en position:relative.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Container chart + CSS WordCloud.astro

**Files:**
- Modify: `src/components/slides/WordCloud.astro` (CSS section lignes 81-224)

- [ ] **Step 1: Remplacer `.wordcloud-slide__chart` (lignes ~91-100)**

Bloc actuel à remplacer :

```css
  .wordcloud-slide__chart {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    align-self: center;
    min-height: 500px;
    padding: 24px;
  }
```

Nouveau bloc :

```css
  .wordcloud-slide__chart {
    position: relative;
    width: 100%;
    min-height: 600px;
    overflow: hidden;
    align-self: center;
  }
```

- [ ] **Step 2: Remplacer `.wordcloud-slide__word` et son keyframe**

Bloc actuel (lignes ~102-115) :

```css
  .wordcloud-slide__word {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    line-height: 1.2;
    animation: wordcloud-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .wordcloud-slide__word--c0 { color: #FFD838; }
  .wordcloud-slide__word--c1 { color: #191919; }
  .wordcloud-slide__word--c2 { color: #6B6F84; }

  @keyframes wordcloud-pop {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
```

Nouveau bloc (les couleurs sont posées inline par JS, les sous-classes c0/c1/c2 sont retirées) :

```css
  .wordcloud-slide__word {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
    animation: wordcloud-pop-h 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .wordcloud-slide__word--v {
    animation: wordcloud-pop-v 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    transform-origin: left top;
  }

  @keyframes wordcloud-pop-h {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes wordcloud-pop-v {
    from { transform: rotate(-90deg) scale(0); opacity: 0; }
    to { transform: rotate(-90deg) scale(1); opacity: 1; }
  }
```

- [ ] **Step 3: Restyler `.wordcloud-slide__start-btn`**

Bloc actuel (lignes ~136-148) :

```css
  .wordcloud-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: 2px solid #191919;
    border-radius: 12px;
    padding: 24px 48px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .wordcloud-slide__start-btn:hover { transform: translateY(-2px); }
```

Nouveau bloc (rounded-pill 40px + shadow, pas de border 2px) :

```css
  .wordcloud-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: none;
    border-radius: 40px;
    padding: 24px 48px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(25, 25, 25, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .wordcloud-slide__start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(25, 25, 25, 0.2);
  }
```

- [ ] **Step 4: Vérifier sur le dev server**

Le dev server tourne déjà depuis Task 1. Reload la slide WordCloud `/p/template/`. Le bouton "Démarrer le sondage" doit être pilule (rounded-pill) avec ombre douce. Une fois un sondage lancé et des mots soumis, le wordcloud devrait packer correctement dans le container 60% × 600px.

Si les positions paraissent décalées : ouvrir devtools, sélectionner le `<span>` du mot top, vérifier que son `left`/`top` correspond au coin visuel attendu. Pour les mots à 90°, le `transform-origin: left top` + `top: y+h` doit caler la bbox visuelle au bon endroit.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git add src/components/slides/WordCloud.astro && git commit -m "$(cat <<'EOF'
feat(wordcloud): container position:relative + animations rotated

Container chart en absolu positionne, min-height 600px. Couleurs inline
JS (suppression des classes --c0/c1/c2). Deux keyframes distinctes pour
horizontal et vertical (rotation preservee pendant l'animation pop).

Bouton Demarrer en rounded-pill 40px avec ombre douce, hover lift.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Restyle bouton start dans Poll.astro

**Files:**
- Modify: `src/components/slides/Poll.astro` (CSS section, lignes ~186-200)

- [ ] **Step 1: Remplacer `.poll-slide__start-btn`**

Bloc actuel (lignes ~186-200) :

```css
  .poll-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: 2px solid #191919;
    border-radius: 12px;
    padding: 24px 48px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .poll-slide__start-btn:hover {
    transform: translateY(-2px);
  }
```

Nouveau bloc :

```css
  .poll-slide__start-btn {
    font-family: 'Hanken Grotesk', sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: #191919;
    background: #FFD838;
    border: none;
    border-radius: 40px;
    padding: 24px 48px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(25, 25, 25, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .poll-slide__start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(25, 25, 25, 0.2);
  }
```

- [ ] **Step 2: Vérifier sur le dev server**

Naviguer vers une slide Poll (`/p/template/` → slide exemple QCM). Le bouton "Démarrer le sondage" doit avoir le même style que celui du WordCloud (Task 2) : pilule + ombre + hover lift.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git add src/components/slides/Poll.astro && git commit -m "$(cat <<'EOF'
feat(poll): bouton Demarrer/Nouvelle session en rounded-pill 40px

Aligne le style du bouton start de Poll.astro sur celui du WordCloud :
pilule, ombre douce, hover lift. Coherent avec le pattern lm/Button.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Vote page mobile — logo SVG + restyle inputs/buttons

**Files:**
- Modify: `src/pages/v/[token].astro`

- [ ] **Step 1: Remplacer le brand text par le SVG logo dans le header**

Localiser la ligne actuelle (~ligne 168) :

```astro
      <span class="vote-brand">Lausanne Marketing</span>
```

Remplacer par :

```astro
      <a href="/" class="vote-brand" aria-label="Accueil — Lausanne Marketing">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 49 32" fill="none" aria-hidden="true">
          <path d="M25.9557 0L38.391 21.78H13.5204L25.9557 0Z" fill="#FEE487"></path>
          <path d="M36.3557 0L48.791 21.78H23.9204L36.3557 0Z" fill="#FFD838"></path>
          <path d="M1.77273 31.2C1.15227 31.2 0.694318 30.9765 0.398864 30.5295C0.132955 30.0825 0 29.4716 0 28.6968C0 28.2499 0.0443182 27.7582 0.132955 27.2218C0.221591 26.6854 0.325 26.1192 0.443182 25.5232C0.797727 23.9438 1.34432 22.2006 2.08295 20.2934C2.85114 18.3564 3.72273 16.3748 4.69773 14.3484C5.70227 12.2923 6.70682 10.2957 7.71136 8.35874C8.74545 6.42178 9.70568 4.64871 10.592 3.03954C10.6511 2.92034 10.7693 2.69685 10.9466 2.36905C11.1534 2.04126 11.3159 1.80287 11.4341 1.65387C10.2818 1.68367 9.48409 1.63586 8.15454 1.90406C6.85454 2.14245 7.21136 2.15298 6 2.59998C6 2.59998 8.64091 0.0999756 10 0.0999756L18.2148 0C17.5648 0.506589 16.7966 1.43037 15.9102 2.77135C15.0239 4.08252 14.108 5.57249 13.1625 7.24126C12.7489 7.98625 12.2318 8.95473 11.6114 10.1467C10.9909 11.3387 10.3409 12.6648 9.66136 14.1249C8.98182 15.5553 8.33182 17.0006 7.71136 18.4607C7.09091 19.9209 6.55909 21.3066 6.11591 22.6178C5.67273 23.8991 5.39205 25.0017 5.27386 25.9255C5.24432 26.0745 5.22955 26.2235 5.22955 26.3725C5.22955 26.4917 5.22955 26.6258 5.22955 26.7748C5.22955 27.6092 5.45114 28.3095 5.89432 28.8756C6.3375 29.412 7.16477 29.6802 8.37614 29.6802C9.94204 29.6206 11.5227 29.6206 13.1182 29.5014C14.7432 29.3524 16.3239 29.0544 17.8602 28.6074C19.1602 28.2201 20.342 27.6986 21.4057 27.043C22.4693 26.3874 23.2375 25.5679 23.7102 24.5845C23.7693 24.4653 23.8432 24.4057 23.9318 24.4057C24.1386 24.4057 24.242 24.5696 24.242 24.8974C24.242 24.957 24.2273 25.0315 24.1977 25.1209C24.1977 25.2103 24.1829 25.3146 24.1534 25.4338C23.917 26.2086 23.6364 26.894 23.3114 27.49C22.9864 28.086 22.6614 28.5925 22.3364 29.0097C21.5091 30.0229 20.4307 30.6487 19.1011 30.8871C17.8011 31.0957 16.5011 31.2 15.2011 31.2H1.77273Z" fill="#191919"></path>
        </svg>
      </a>
```

- [ ] **Step 2: Adapter le style `.vote-brand`**

Bloc actuel (~lignes 46-50) :

```css
      .vote-brand {
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 16px;
      }
```

Nouveau bloc (devient un lien display:inline-flex pour aligner le SVG) :

```css
      .vote-brand {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }
      .vote-brand svg {
        display: block;
      }
```

- [ ] **Step 3: Restyler `.vote-option` (boutons QCM)**

Bloc actuel (~lignes 81-100) :

```css
      .vote-option {
        display: block;
        width: 100%;
        min-height: 72px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 18px;
        text-align: left;
        background: #FFFFFF;
        color: #191919;
        border: 2px solid #191919;
        border-radius: 12px;
        padding: 16px 24px;
        margin-bottom: 12px;
        cursor: pointer;
        box-sizing: border-box;
      }
      .vote-option:active,
      .vote-option.is-selected {
        background: #FFD838;
      }
```

Nouveau bloc :

```css
      .vote-option {
        display: block;
        width: 100%;
        min-height: 64px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 18px;
        text-align: left;
        background: #FFFFFF;
        color: #191919;
        border: 2px solid #191919;
        border-radius: 40px;
        padding: 20px 28px;
        margin-bottom: 16px;
        cursor: pointer;
        box-sizing: border-box;
        transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
      }
      .vote-option:active,
      .vote-option.is-selected {
        background: #FFD838;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(25, 25, 25, 0.12);
      }
```

- [ ] **Step 4: Restyler `.vote-input` et `.vote-submit`**

Blocs actuels (~lignes 103-129) :

```css
      .vote-input {
        width: 100%;
        height: 60px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-size: 18px;
        padding: 16px;
        box-sizing: border-box;
        border: 2px solid #191919;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .vote-submit {
        width: 100%;
        height: 60px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 800;
        font-size: 18px;
        background: #191919;
        color: #FFD838;
        border: none;
        border-radius: 12px;
        cursor: pointer;
      }
      .vote-submit:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
```

Nouveaux blocs (rounded-pill 40px, submit en gold/dark conforme lm Button primary) :

```css
      .vote-input {
        width: 100%;
        height: 64px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-size: 18px;
        padding: 20px 28px;
        box-sizing: border-box;
        border: 2px solid #191919;
        border-radius: 40px;
        margin-bottom: 16px;
        outline: none;
      }
      .vote-input:focus {
        box-shadow: 0 0 0 4px rgba(255, 216, 56, 0.4);
      }
      .vote-submit {
        width: 100%;
        height: 64px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 800;
        font-size: 18px;
        background: #FFD838;
        color: #191919;
        border: none;
        border-radius: 40px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(25, 25, 25, 0.12);
        transition: transform 0.15s ease, box-shadow 0.2s ease;
      }
      .vote-submit:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(25, 25, 25, 0.2);
      }
      .vote-submit:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
```

- [ ] **Step 5: Restyler `.vote-message__action`**

Bloc actuel (~lignes 153-163) :

```css
      .vote-message__action {
        margin-top: 24px;
        background: #FFD838;
        border: 2px solid #191919;
        border-radius: 12px;
        padding: 12px 24px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
      }
```

Nouveau bloc :

```css
      .vote-message__action {
        margin-top: 24px;
        background: #FFD838;
        color: #191919;
        border: none;
        border-radius: 40px;
        padding: 16px 32px;
        font-family: 'Hanken Grotesk', sans-serif;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(25, 25, 25, 0.12);
        transition: transform 0.15s ease, box-shadow 0.2s ease;
      }
      .vote-message__action:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(25, 25, 25, 0.2);
      }
```

- [ ] **Step 6: Tester sur viewport mobile**

Le dev server tourne. Ouvrir Chrome DevTools, activer le device mode (Ctrl+Shift+M), choisir "iPhone 13" (390x844). Naviguer vers `http://localhost:4321/v/AAAAAA` (un token quelconque retournera "Sondage non démarré" mais le header logo doit être visible). Puis tester un vrai token avec un sondage actif :

1. Vérifier que le logo SVG apparaît en haut à gauche.
2. Lancer un sondage QCM via une slide Poll en mode présentateur.
3. Sur le vote page, vérifier : options full-width 100%, rounded-pill 40px, hover/tap → fond gold avec lift.
4. Idem pour un sondage WordCloud : input + submit en pilule, gold pour submit.

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git add src/pages/v/[token].astro && git commit -m "$(cat <<'EOF'
feat(vote): logo SVG lm + boutons/inputs rounded-pill 40px

Page mobile /v/<token> alignee sur la charte lm : logo SVG inline
(2 triangles gold + L noir) en place du texte brand, options QCM et
input mot en pilule 40px, bouton Envoyer en gold/dark facon lm Button
primary, action button (Reessayer, Envoyer un autre mot) idem.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Watermark logo sur les slides Poll et WordCloud

**Files:**
- Modify: `src/styles/slides.css` (ajout d'un bloc)
- Modify: `src/components/slides/Poll.astro` (ajout SVG dans la section)
- Modify: `src/components/slides/WordCloud.astro` (ajout SVG dans la section)

- [ ] **Step 1: Ajouter la règle `.deck-logo-watermark` dans slides.css**

Localiser la fin du fichier `src/styles/slides.css` et ajouter ce bloc :

```css
/* ============================================================ */
/* Watermark logo lm en bas-droit des slides Poll/WordCloud.
   Signature discrete, opacite 0.08, pas d'interaction (pointer-events:none). */
.deck-logo-watermark {
  position: absolute;
  bottom: 32px;
  right: 32px;
  width: 80px;
  height: auto;
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 2: Ajouter le SVG watermark dans Poll.astro**

Localiser la fin de la balise `<section class="poll-slide">` dans `src/components/slides/Poll.astro` (juste avant `</section>` ligne ~95). Ajouter ce SVG juste avant la fermeture :

```astro
  <svg class="deck-logo-watermark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49 32" fill="none" aria-hidden="true">
    <path d="M25.9557 0L38.391 21.78H13.5204L25.9557 0Z" fill="#FEE487"></path>
    <path d="M36.3557 0L48.791 21.78H23.9204L36.3557 0Z" fill="#FFD838"></path>
    <path d="M1.77273 31.2C1.15227 31.2 0.694318 30.9765 0.398864 30.5295C0.132955 30.0825 0 29.4716 0 28.6968C0 28.2499 0.0443182 27.7582 0.132955 27.2218C0.221591 26.6854 0.325 26.1192 0.443182 25.5232C0.797727 23.9438 1.34432 22.2006 2.08295 20.2934C2.85114 18.3564 3.72273 16.3748 4.69773 14.3484C5.70227 12.2923 6.70682 10.2957 7.71136 8.35874C8.74545 6.42178 9.70568 4.64871 10.592 3.03954C10.6511 2.92034 10.7693 2.69685 10.9466 2.36905C11.1534 2.04126 11.3159 1.80287 11.4341 1.65387C10.2818 1.68367 9.48409 1.63586 8.15454 1.90406C6.85454 2.14245 7.21136 2.15298 6 2.59998C6 2.59998 8.64091 0.0999756 10 0.0999756L18.2148 0C17.5648 0.506589 16.7966 1.43037 15.9102 2.77135C15.0239 4.08252 14.108 5.57249 13.1625 7.24126C12.7489 7.98625 12.2318 8.95473 11.6114 10.1467C10.9909 11.3387 10.3409 12.6648 9.66136 14.1249C8.98182 15.5553 8.33182 17.0006 7.71136 18.4607C7.09091 19.9209 6.55909 21.3066 6.11591 22.6178C5.67273 23.8991 5.39205 25.0017 5.27386 25.9255C5.24432 26.0745 5.22955 26.2235 5.22955 26.3725C5.22955 26.4917 5.22955 26.6258 5.22955 26.7748C5.22955 27.6092 5.45114 28.3095 5.89432 28.8756C6.3375 29.412 7.16477 29.6802 8.37614 29.6802C9.94204 29.6206 11.5227 29.6206 13.1182 29.5014C14.7432 29.3524 16.3239 29.0544 17.8602 28.6074C19.1602 28.2201 20.342 27.6986 21.4057 27.043C22.4693 26.3874 23.2375 25.5679 23.7102 24.5845C23.7693 24.4653 23.8432 24.4057 23.9318 24.4057C24.1386 24.4057 24.242 24.5696 24.242 24.8974C24.242 24.957 24.2273 25.0315 24.1977 25.1209C24.1977 25.2103 24.1829 25.3146 24.1534 25.4338C23.917 26.2086 23.6364 26.894 23.3114 27.49C22.9864 28.086 22.6614 28.5925 22.3364 29.0097C21.5091 30.0229 20.4307 30.6487 19.1011 30.8871C17.8011 31.0957 16.5011 31.2 15.2011 31.2H1.77273Z" fill="#191919"></path>
  </svg>
```

- [ ] **Step 3: Ajouter le SVG watermark dans WordCloud.astro**

Idem, à la fin de `<section class="wordcloud-slide">` dans `src/components/slides/WordCloud.astro` (juste avant `</section>` ligne ~79), insérer exactement le même bloc SVG que dans Poll.astro (copie identique).

- [ ] **Step 4: Vérifier visuellement le watermark**

Reload `/p/template/` dans Chrome. Sur la slide Poll et sur la slide WordCloud, le logo doit apparaître en bas-droit, très estompé (opacité 0.08, soit ~8% visible). Aucun chevauchement avec les boutons d'action. En plein écran (touche F), le watermark reste visible mais discret.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git add src/styles/slides.css src/components/slides/Poll.astro src/components/slides/WordCloud.astro && git commit -m "$(cat <<'EOF'
feat(slides): watermark logo lm en bas-droit des slides vote

SVG logo inline en absolu, opacite 0.08, sur les slides Poll et
WordCloud. Signature discrete sans distraire de la viz. Coherent
avec la nouvelle direction design (Task 1-4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Vérification finale + push

**Files:** aucune modif

- [ ] **Step 1: Build production clean**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && npm run build 2>&1 | tail -30
```

Expected : `Build complete!` sans warnings ni erreurs TypeScript. Si erreurs, ne pas push, corriger avant.

- [ ] **Step 2: Tester l'enchaînement E2E sur dev server**

Le dev server doit toujours tourner. Si arrêté, relancer `npm run dev`.

Scénario complet :
1. Ouvrir `http://localhost:4321/p/template/?presenter=YQX4W5TFARPD`
2. Naviguer jusqu'à la slide Poll (exemple QCM). Vérifier : bouton Démarrer en pilule + ombre, watermark logo en bas-droit.
3. Click "Démarrer le sondage". Le QR + le code s'affichent.
4. Scanner le QR (ou ouvrir manuellement `/v/<CODE>` dans un autre onglet). Vérifier la page mobile : logo SVG, options en pilule, mobile-friendly à 390px.
5. Voter une option. Vérifier la bar fill gold + count incrémenté sur la slide.
6. Click "Figer". Vérifier l'état frozen.
7. Naviguer à la slide WordCloud. Click "Démarrer". Soumettre 5-10 mots variés via `/v/<CODE>`. Vérifier : packing spiral, top central gold (le mot avec le plus de votes), 2-3 mots dark, queue grey. Au moins 1-2 mots à 90°. Aucun chevauchement.
8. Click "Figer", puis refresh la page. La slide doit passer en état archived. Click "Nouvelle session" — un nouveau sondage démarre, packing remis à zéro.

- [ ] **Step 3: Git status clean**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git status
```

Expected : `nothing to commit, working tree clean`. Sinon, commit les leftovers (probablement none, mais vérification de sécurité).

- [ ] **Step 4: Push**

```bash
cd "C:/Users/weasy/OneDrive/Documents/GitHub/lm-presentation" && git pull --rebase && git push
```

Expected : 5 commits pushés (Task 1-5) sur lm-stack/lm-presentation main. Cloudflare Pages redéploie automatiquement.

- [ ] **Step 5: Vérification prod après déploiement CF Pages**

Attendre ~1-2 min que CF Pages termine le build. Puis ouvrir `https://slides.lausanne.marketing/p/template/?presenter=YQX4W5TFARPD`. Reproduire le scénario E2E de Step 2 mais en prod cette fois.

Si tout est OK : ne rien faire, la feature est livrée.
Si régression : revert le commit fautif via `git revert <sha>` plutôt que de patcher en force.
