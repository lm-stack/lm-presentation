// src/scripts/deck/reveal-init.ts
// Initialise Reveal.js, branche les boutons nav prev/next et le compteur de
// slide dans le footer. Recalcule le layout via ResizeObserver quand la taille
// de .deck-stage change (fullscreen, resize, devtools, rotation).
//
// Retourne l'instance Reveal (deck) pour que les autres modules (search, polls,
// TOC) puissent l'utiliser : deck.slide(N), deck.on('slidechanged'), etc.

import Reveal from 'reveal.js';
import type { RevealApi, RevealConfig } from 'reveal.js';

export async function initReveal(): Promise<RevealApi | null> {
  // Le type RevealConfig v6 n'admet pas null pour scrollActivationWidth (type number)
  // ni null pour les valeurs d'un keymap (type string | function). Reveal accepte
  // les deux en runtime pour respectivement disabler la feature et disabler une
  // touche. On cast l'objet en RevealConfig pour preserver l'autocomplete sur le
  // reste, sans pulluer le code avec @ts-ignore.
  const deck = new Reveal({
    hash: true,
    slideNumber: false,
    transition: 'fade',
    controls: false,
    progress: false,
    center: false,
    width: 1920,
    height: 1080,
    margin: 0,
    // Reveal active automatiquement un "scroll view" quand innerWidth < 435px,
    // ce qui casse notre layout 16:9 confine dans .deck-stage (le slide est rendu
    // a sa hauteur logique 1080px et deborde du container overflow:hidden, d'ou
    // l'absence de contenu visible sur mobile + nav clavier/click qui scroll
    // au lieu de changer de slide). On force le mode paginated.
    scrollActivationWidth: null as unknown as number,
    // On bloque l'overlay help "?" (Shift+/) qui peut popper en demo et casser
    // la presentation. La barre oblique seule sert souvent en raccourci d'edition.
    keyboard: {
      191: null as unknown as string,
    },
  } as RevealConfig);

  try {
    await deck.initialize();
  } catch (err) {
    // Init Reveal echouee : on log + on flag le body pour que le CSS puisse
    // masquer les controles inutilisables (cf. body.deck-init-failed dans slides.css).
    console.error('Reveal init failed', err);
    document.body.classList.add('deck-init-failed');
    return null;
  }

  const total = deck.getTotalSlides();
  const totalEl = document.querySelector('.reveal-total');
  if (totalEl) totalEl.textContent = String(total);

  const prevBtn = document.querySelector('.deck-nav-prev') as HTMLButtonElement | null;
  const nextBtn = document.querySelector('.deck-nav-next') as HTMLButtonElement | null;

  const updateNavState = () => {
    const current = deck.getSlidePastCount() + 1;
    const currentEl = document.querySelector('.reveal-current');
    if (currentEl) currentEl.textContent = String(current);
    if (prevBtn) prevBtn.disabled = deck.isFirstSlide();
    if (nextBtn) nextBtn.disabled = deck.isLastSlide();
  };

  prevBtn?.addEventListener('click', () => deck.prev());
  nextBtn?.addEventListener('click', () => deck.next());
  deck.on('slidechanged', updateNavState);
  updateNavState();

  // Recall layout des que la taille de .deck-stage change (fullscreen enter/exit,
  // resize fenetre, devtools open/close, rotation device). ResizeObserver est
  // plus robuste que les cascades setTimeout sur fullscreenchange : on reagit
  // exactement quand la geometrie est stabilisee, pas avant ni apres.
  const stage = document.querySelector('.deck-stage');
  if (stage) {
    const ro = new ResizeObserver(() => {
      try { deck.layout(); } catch {}
    });
    ro.observe(stage);
  }

  return deck;
}
