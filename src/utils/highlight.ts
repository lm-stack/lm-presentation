// src/utils/highlight.ts
// Decoupe un texte autour d'un mot cle pour rendre la signature LM `.underline`
// (bande gold rotative en pseudo-element, definie dans global.css). Utilise par
// la famille de composants Hero (CoverHero, SectionHero, SubSectionHero,
// StatementHero, etc.) et par la page parcours.
//
// Match case-insensitive sur la premiere occurrence, retourne null si le texte
// ou le mot n'est pas fourni, ou si le mot est absent du texte : l'appelant
// choisit alors de rendre le texte simple. `text` accepte undefined pour les
// composants ou le titre est une prop optionnelle (ImageGridHero, MockupHero,
// PeopleCards) : pas d'erreur de type au call site, et pas de crash a l'execution.

export type HighlightParts = {
  before: string;
  match: string;
  after: string;
};

export function splitHighlight(text: string | undefined, mot?: string): HighlightParts | null {
  if (!text || !mot) return null;
  const idx = text.toLowerCase().indexOf(mot.toLowerCase());
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + mot.length),
    after: text.slice(idx + mot.length),
  };
}
