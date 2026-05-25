// src/scripts/deck/presenter.ts
// Mode presentateur : active via #presenter=SECRET dans le fragment d'URL.
//
// POURQUOI le fragment plutot qu'une query string ?presenter= : le fragment
// n'est JAMAIS envoye au serveur (donc pas de log Cloudflare HTTP) et n'est
// jamais inclus dans le Referer header si l'utilisateur clique un lien externe
// avant le replaceState. Avec une query string, le secret fuitait dans les logs
// et potentiellement le Referer.
//
// La cle, une fois lue, est stockee en sessionStorage et envoyee en header
// X-Presenter-Key sur les endpoints sensibles du worker lm-polls (init / freeze
// / reset). Si le worker repond 403, le mode est efface via clearPresenterMode.

const STORAGE_KEY = 'lm-presenter-key';

export function initPresenterMode(): string {
  const match = window.location.hash.match(/^#presenter=(.+)$/);
  if (match) {
    sessionStorage.setItem(STORAGE_KEY, decodeURIComponent(match[1]));
    history.replaceState({}, '', window.location.pathname + window.location.search);
  }
  const key = sessionStorage.getItem(STORAGE_KEY) || '';
  if (key) {
    document.body.classList.add('is-presenter');
  }
  return key;
}

export function clearPresenterMode(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  document.body.classList.remove('is-presenter');
}
