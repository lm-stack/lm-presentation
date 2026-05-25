// src/utils/highlight.ts
// Decoupe un texte autour d'un mot cle pour rendre la signature LM `.underline`
// (bande gold rotative en pseudo-element, definie dans global.css). Utilise dans
// la plupart des composants slides (Cover, Section, Closing, Timer, Title, Quote,
// AboutMe, AboutMeBullets) et dans la page parcours.
//
// Match case-insensitive sur la premiere occurrence, retourne null si mot absent
// ou si mot non fourni : l'appelant choisit alors de rendre le texte simple.

export type HighlightParts = {
  before: string;
  match: string;
  after: string;
};

export function splitHighlight(text: string, mot?: string): HighlightParts | null {
  if (!mot) return null;
  const idx = text.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + mot.length),
    after: text.slice(idx + mot.length),
  };
}
