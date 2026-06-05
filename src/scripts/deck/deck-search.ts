// src/scripts/deck/deck-search.ts
// Recherche full-text dans le deck : scan toutes les slides, wrap les matches
// dans <mark class="search-hit">, navigation Enter / Maj+Entree.
//
// Pattern de wrap : TreeWalker filtre les text nodes, exclut SCRIPT/STYLE/SVG
// et les containers marques data-search-skip (le chrome du panel de recherche
// lui-meme, sinon il s'auto-match infiniment a chaque frappe).

import type { RevealApi } from 'reveal.js';

type Match = { mark: HTMLElement; slideIndex: number };

export function initDeckSearch(deck: RevealApi): void {
  const searchPanel = document.getElementById('deck-search') as HTMLElement | null;
  const searchInput = document.getElementById('deck-search-input') as HTMLInputElement | null;
  const searchCount = document.getElementById('deck-search-count') as HTMLElement | null;
  const searchPrev = document.getElementById('deck-search-prev') as HTMLButtonElement | null;
  const searchNext = document.getElementById('deck-search-next') as HTMLButtonElement | null;
  const searchCloseBtn = document.getElementById('deck-search-close') as HTMLButtonElement | null;
  const searchBtn = document.getElementById('deck-search-btn') as HTMLButtonElement | null;

  let searchMatches: Match[] = [];
  let searchCurrentIdx = -1;

  function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function updateSearchCount() {
    if (!searchCount) return;
    if (searchMatches.length === 0) {
      searchCount.textContent = searchInput?.value ? '0 / 0' : '';
    } else {
      searchCount.textContent = `${searchCurrentIdx + 1} / ${searchMatches.length}`;
    }
  }

  function clearSearchHighlights() {
    // Pour chaque mark, on remet son texte a sa place puis normalize() le parent
    // pour fusionner les text nodes adjacents (sinon multiplication des nodes).
    searchMatches.forEach(({ mark }) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
      }
    });
    document.querySelectorAll('.slides > section').forEach((sec) => sec.normalize());
    searchMatches = [];
    searchCurrentIdx = -1;
  }

  function runSearch(query: string) {
    clearSearchHighlights();
    const trimmed = query.trim();
    if (!trimmed) {
      updateSearchCount();
      return;
    }
    const re = new RegExp(escapeRegExp(trimmed), 'gi');
    const slides = Array.from(document.querySelectorAll<HTMLElement>('.slides > section'));

    slides.forEach((slide, slideIdx) => {
      const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          // Exclure script/style/noscript et tout ce qui est dans SVG (icones)
          // ou marque data-search-skip (chrome interne du panel de recherche).
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
          if (parent.closest('svg')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-search-skip]')) return NodeFilter.FILTER_REJECT;
          // Ignore aussi les text nodes vides (whitespace pur)
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const textNodes: Text[] = [];
      let cur: Node | null;
      while ((cur = walker.nextNode())) textNodes.push(cur as Text);

      textNodes.forEach((textNode) => {
        const text = textNode.textContent ?? '';
        re.lastIndex = 0;
        if (!re.test(text)) return;
        re.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          if (m.index > lastIdx) {
            frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
          }
          const mark = document.createElement('mark');
          mark.className = 'search-hit';
          mark.textContent = m[0];
          frag.appendChild(mark);
          searchMatches.push({ mark, slideIndex: slideIdx });
          lastIdx = m.index + m[0].length;
          if (m.index === re.lastIndex) re.lastIndex++; // garde-fou regex zero-width
        }
        if (lastIdx < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        textNode.parentNode?.replaceChild(frag, textNode);
      });
    });

    if (searchMatches.length > 0) {
      goToMatch(0);
    } else {
      updateSearchCount();
    }
  }

  function goToMatch(idx: number) {
    if (searchMatches.length === 0) return;
    const n = searchMatches.length;
    const wrapped = ((idx % n) + n) % n;

    if (searchCurrentIdx >= 0 && searchMatches[searchCurrentIdx]) {
      searchMatches[searchCurrentIdx].mark.classList.remove('search-hit--current');
    }
    searchCurrentIdx = wrapped;
    const match = searchMatches[wrapped];
    match.mark.classList.add('search-hit--current');
    deck.slide(match.slideIndex);
    updateSearchCount();
  }

  function openSearch() {
    if (!searchPanel || !searchInput) return;
    searchPanel.hidden = false;
    searchInput.focus();
    searchInput.select();
  }
  function closeSearch() {
    if (!searchPanel) return;
    searchPanel.hidden = true;
    clearSearchHighlights();
    if (searchInput) searchInput.value = '';
    updateSearchCount();
  }

  searchBtn?.addEventListener('click', openSearch);
  searchCloseBtn?.addEventListener('click', closeSearch);
  // Debounce 150ms : sur un deck dense (50+ slides, plusieurs centaines de
  // text nodes), runSearch fait un clearSearchHighlights complet + un new
  // RegExp + un TreeWalker par slide a chaque frappe. Sans debounce, taper
  // rapidement saccade visible (~30-80ms par run sur deck moyen). 150ms est
  // sous le seuil de perception tout en permettant a un burst de frappe de
  // se regrouper en un seul run.
  let searchDebounceTimer: number | null = null;
  searchInput?.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
      searchDebounceTimer = null;
      runSearch(value);
    }, 150);
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchMatches.length === 0) return;
      goToMatch(searchCurrentIdx + (e.shiftKey ? -1 : 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  });
  searchPrev?.addEventListener('click', () => goToMatch(searchCurrentIdx - 1));
  searchNext?.addEventListener('click', () => goToMatch(searchCurrentIdx + 1));

  // Raccourci global "/" pour ouvrir la recherche. On l'attache au document
  // plutot que via Reveal keyboard config : Reveal a deja bloque la touche 191
  // (cf. config keyboard dans reveal-init) donc on est libres de l'utiliser
  // ici sans conflit.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/') return;
    if (!searchPanel?.hidden) return; // deja ouvert
    const target = e.target as HTMLElement | null;
    const isEditable = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (isEditable) return;
    e.preventDefault();
    openSearch();
  });
}
