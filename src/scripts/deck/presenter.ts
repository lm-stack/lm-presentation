// src/scripts/deck/presenter.ts
// Mode presentateur : token signe HMAC-SHA256 stocke en sessionStorage, emis
// par l'endpoint POST /api/presenter/auth du worker lm-polls.
//
// Workflow : le presentateur va sur /presenter, tape son password. Le worker
// valide vs env.PRESENTER_SECRET et retourne un token court-vie (6h). Le
// token est ensuite envoye en header X-Presenter-Token sur init / freeze /
// reset. Le worker verifie la signature HMAC + l'expiration. Si invalide,
// le worker repond 403 et on clear le mode (forcer re-login).
//
// Anciennement le secret circulait via ?presenter= puis #presenter= dans
// l'URL, ce qui le faisait fuiter dans les logs Cloudflare et le Referer.
// Avec le token signe, le secret ne quitte jamais le body POST initial,
// et le token expire automatiquement.

const STORAGE_KEY = 'lm-presenter-token';

export function initPresenterMode(): string {
  const token = sessionStorage.getItem(STORAGE_KEY) || '';
  if (token) {
    document.body.classList.add('is-presenter');
  }
  return token;
}

export function clearPresenterMode(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  document.body.classList.remove('is-presenter');
}
