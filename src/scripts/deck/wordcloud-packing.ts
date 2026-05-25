// src/scripts/deck/wordcloud-packing.ts
// Spiral packing custom pour le nuage de mots, sans dependance externe.
//
// Algorithme Archimedien : mots tries par count desc, le premier va au centre,
// les suivants spiralent depuis le centre et cherchent la premiere position
// sans collision (AABB + padding 4px). Rotation 0deg ou 90deg seedee par hash
// du mot (stable au refresh). Top 3 toujours horizontaux pour lisibilite.
//
// Module pur (sauf measureWordBbox qui prend un CanvasRenderingContext2D pour
// mesurer le texte) : pas de DOM access, testable en isolation.

export type WordInput = {
  word: string;
  count: number;
  fontSize: number;
};

export type WordPlacement = {
  word: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  fontSize: number;
  color: string;
};

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

// Mesure de la bbox via canvas.measureText. ctx peut etre null si l'API n'est
// pas disponible (rare en browser moderne) : on retombe sur une heuristique
// proportionnelle au fontSize.
function measureWordBbox(
  ctx: CanvasRenderingContext2D | null,
  word: string,
  fontSize: number,
  rotated: boolean,
): { w: number; h: number } {
  if (!ctx) return { w: fontSize * word.length * 0.6, h: fontSize };
  ctx.font = `800 ${fontSize}px "Hanken Grotesk", sans-serif`;
  const m = ctx.measureText(word);
  const textW = m.width;
  const textH = fontSize * 1.0;
  return rotated ? { w: textH, h: textW } : { w: textW, h: textH };
}

export function packWords(
  words: WordInput[],
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D | null,
): WordPlacement[] {
  const placed: WordPlacement[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const PADDING = 4;
  const MAX_STEPS = 1000;

  words.forEach((w, rank) => {
    const rotated = shouldRotateWord(w.word, rank);
    const color = pickWordColor(rank);
    const bbox = measureWordBbox(ctx, w.word, w.fontSize, rotated);

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
