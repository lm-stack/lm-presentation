// src/scripts/deck/deck-chrome.ts
// Chrome UI du deck : menu pill (infos cours), TOC, fullscreen toggle, lien
// retour parcours, bouton telecharger PDF, bouton mode presentation.
//
// Ces fonctions sont independantes et idempotentes : si l'element DOM cible
// n'existe pas, l'init ne fait rien (silent no-op). Permet a Deck.astro de les
// appeler systematiquement sans test d'existence prealable.

import type { RevealApi } from 'reveal.js';

export function initDeckMenu(): void {
  const menuPill = document.getElementById('deck-menu-pill') as HTMLButtonElement | null;
  const menuPanel = document.getElementById('deck-menu') as HTMLElement | null;
  const menuClose = document.getElementById('deck-menu-close') as HTMLButtonElement | null;

  const openMenu = () => {
    if (!menuPill || !menuPanel) return;
    menuPanel.hidden = false;
    menuPill.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    if (!menuPill || !menuPanel) return;
    menuPanel.hidden = true;
    menuPill.setAttribute('aria-expanded', 'false');
  };

  menuPill?.addEventListener('click', () => {
    if (menuPanel?.hidden) openMenu();
    else closeMenu();
  });
  menuClose?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuPanel && !menuPanel.hidden) closeMenu();
  });
}

export function initParcoursBackLink(): void {
  // Retour au parcours : si l'URL contient ?from=<slug>, on active le bouton retour
  // (toolbar haut-droit) ainsi que le lien "Retourner au parcours" dans le menu.
  // Sanitize : seuls les slugs alphanum + tirets sont acceptes (evite injection / open redirect).
  const params = new URLSearchParams(window.location.search);
  const fromSlug = params.get('from');
  if (!fromSlug || !/^[a-z0-9-]+$/i.test(fromSlug)) return;

  const backUrl = `/parcours/${fromSlug}`;
  const backBtn = document.getElementById('deck-back-parcours') as HTMLAnchorElement | null;
  const menuBack = document.getElementById('deck-menu-back-parcours') as HTMLAnchorElement | null;
  if (backBtn) {
    backBtn.href = backUrl;
    backBtn.removeAttribute('hidden');
  }
  if (menuBack) {
    menuBack.href = backUrl;
    menuBack.removeAttribute('hidden');
  }
}

export function initPdfButton(): void {
  // Bouton telecharger PDF : ouvre la modale qui propose 3 layouts.
  // openPdfModal est expose sur window par le composant PdfModal.astro.
  const downloadBtn = document.getElementById('deck-download-btn') as HTMLButtonElement | null;
  downloadBtn?.addEventListener('click', () => {
    (window as Window & { openPdfModal?: () => void }).openPdfModal?.();
  });
}

export function initPresentButton(deck: RevealApi): void {
  // Bouton mode presentation : passe Reveal en plein ecran browser (top layer)
  const presentBtn = document.getElementById('deck-present-btn') as HTMLButtonElement | null;
  presentBtn?.addEventListener('click', () => {
    try {
      // triggerFullscreen() existe en runtime (v6+) mais n'est pas exposee
      // dans le type RevealApi. Cast cible plutot qu'on importe Fullscreen API.
      (deck as RevealApi & { triggerFullscreen(): void }).triggerFullscreen();
    } catch {
      // Fallback sur l'API browser si Reveal ne s'expose pas
      document.documentElement.requestFullscreen?.();
    }
  });
}

export function initFullscreenToggle(): void {
  // Toggle classe body lors d'un changement d'etat fullscreen. Doublon defensif
  // a html:has(:fullscreen) pour garantir le masquage du chrome cross-browser.
  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('is-fullscreen', !!document.fullscreenElement);
  });
}

export function initToc(deck: RevealApi): void {
  // Table des matieres : auto-construite depuis toute slide marquee
  // data-section-title. Inclut le slide d'accueil (Cover) + les sections, et
  // tout slide custom qui s'expose.
  const tocNav = document.getElementById('deck-menu-toc') as HTMLElement | null;
  const tocList = document.getElementById('deck-menu-toc-list') as HTMLOListElement | null;
  if (!tocNav || !tocList) return;

  // ToC : exclure les slides interactifs (poll, wordcloud), garder uniquement
  // les slides de titre / transition (Cover, Section, Closing, AboutMe, Timer).
  const tocSlides = Array.from(
    document.querySelectorAll<HTMLElement>('.slides > section[data-section-title]')
  ).filter((s) => {
    const layout = s.dataset.layout || '';
    return layout !== 'poll' && layout !== 'wordcloud' && layout !== 'poll-hero' && layout !== 'wordcloud-hero';
  });
  if (tocSlides.length === 0) return;

  tocNav.hidden = false;
  const slidesParent = tocSlides[0].parentElement;
  const menuPanel = document.getElementById('deck-menu') as HTMLElement | null;

  tocSlides.forEach((sec, i) => {
    const indexInDeck = slidesParent
      ? Array.from(slidesParent.children).indexOf(sec)
      : 0;
    const label = sec.dataset.sectionTitle ?? `Slide ${indexInDeck + 1}`;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'deck-menu__toc-btn';
    btn.dataset.slideIndex = String(indexInDeck);
    const num = document.createElement('span');
    num.className = 'deck-menu__toc-num';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = String(i + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.className = 'deck-menu__toc-text';
    text.textContent = label;
    btn.appendChild(num);
    btn.appendChild(text);
    btn.addEventListener('click', () => {
      deck.slide(indexInDeck);
      if (menuPanel) menuPanel.hidden = true;
    });
    li.appendChild(btn);
    tocList.appendChild(li);
  });
}
