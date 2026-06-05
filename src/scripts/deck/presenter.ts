// src/scripts/deck/presenter.ts
// Mode presentateur : token signe HMAC-SHA256 stocke en localStorage, emis
// par l'endpoint POST /api/presenter/auth du worker lm-polls.
//
// Workflow : le presentateur va sur /presenter, tape son password. Le worker
// valide vs env.PRESENTER_SECRET et retourne un token court-vie (10h). Le
// token est ensuite envoye en header X-Presenter-Token sur init / freeze /
// reset. Le worker verifie la signature HMAC + l'expiration. Si invalide,
// le worker repond 403 et on clear le mode (forcer re-login).
//
// POURQUOI localStorage et pas sessionStorage : sessionStorage est scope au
// tab et perdu a la fermeture du browser. Pour un presentateur qui ouvre
// plusieurs decks dans des onglets ou ferme et reouvre le browser pendant
// son cours, il faudrait re-saisir le password trop souvent. localStorage
// persiste 10h jusqu'a l'expiration du token (verifiee cote client pour
// clear automatiquement).
//
// Anciennement le secret circulait via ?presenter= puis #presenter= dans
// l'URL, ce qui le faisait fuiter dans les logs Cloudflare et le Referer.
// Avec le token signe, le secret ne quitte jamais le body POST initial,
// et le token expire automatiquement.

const TOKEN_KEY = 'lm-presenter-token';
const EXPIRES_KEY = 'lm-presenter-expires';

export function initPresenterMode(): string {
  const token = localStorage.getItem(TOKEN_KEY) || '';
  const expiresAt = parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10);
  // Si le token est expire cote client (avec 60s de marge pour les requests
  // en vol), on le clear plutot que d'envoyer un X-Presenter-Token mort.
  if (token && expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60) {
    clearPresenterMode();
    return '';
  }
  if (token) {
    document.body.classList.add('is-presenter');
  }
  return token;
}

export function clearPresenterMode(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  document.body.classList.remove('is-presenter');
}
