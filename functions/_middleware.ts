// functions/_middleware.ts
//
// Mur d'acces par code email (OTP) pour slides.lausanne.marketing.
// Cloudflare Pages Function (middleware racine) : s'execute au edge DEVANT
// le site statique. Approche "C" : tout est dans CE seul fichier (garde +
// endpoints + page mur). Aucun fichier de deck / parcours / presentateur
// n'est touche.
//
// --- Fonctionnement ---
// 1. Toute route protegee sans cookie de session valide -> sert la page mur.
// 2. Le visiteur saisit son email -> POST /api/access/request : on valide le
//    format, on REFUSE les domaines jetables, puis on derive un code a 6
//    caracteres et on demande a n8n de l'envoyer par email.
// 3. Le visiteur saisit le code -> POST /api/access/verify : on recalcule le
//    code attendu (HMAC sans stockage) ; si OK on pose un cookie de session
//    signe (30 jours) et on logge l'acces (fire-and-forget vers n8n).
//
// Le code OTP est SANS STOCKAGE : code = HMAC(ACCESS_OTP_SECRET, email|fenetre)
// tronque, avec une fenetre de 10 min (on accepte la fenetre courante et la
// precedente). Pas de KV, pas de base. Brute force infaisable : 32^6 ~ 10^9
// combinaisons par fenetre de 10 min.
//
// --- Variables d'environnement (Cloudflare Pages > Settings > Env vars) ---
//   ACCESS_SIGNING_SECRET : secret aleatoire, signe le cookie de session.
//   ACCESS_OTP_SECRET     : secret aleatoire, derive les codes OTP.
//   N8N_OTP_WEBHOOK_URL   : URL du webhook n8n qui envoie l'email + logge.
//   N8N_WEBHOOK_TOKEN     : secret partage, envoye en Bearer pour authentifier
//                           l'appel Function -> n8n.
//
// --- Contrat n8n (le webhook recoit du JSON) ---
//   { event: "request", email, code, ts }  -> envoyer l'email du code
//   { event: "access",  email, ts }        -> ajouter une ligne au journal d'acces
//   Header: Authorization: Bearer <N8N_WEBHOOK_TOKEN>

interface Env {
  ACCESS_SIGNING_SECRET?: string;
  ACCESS_OTP_SECRET?: string;
  N8N_OTP_WEBHOOK_URL?: string;
  N8N_WEBHOOK_TOKEN?: string;
}

// Type minimal du contexte Pages Functions (evite la dependance a
// @cloudflare/workers-types, non installee dans ce repo).
interface PagesContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
}

const SESSION_COOKIE = 'lm_access';
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 jours
const OTP_WINDOW_S = 600; // 10 minutes
const OTP_LENGTH = 6;
// Alphabet Crockford base32 SANS caracteres ambigus (pas de I, L, O, U).
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Domaines email jetables / temporaires refuses (liste non exhaustive, a
// etendre au besoin). Comparaison sur le domaine exact, en minuscules.
const DISPOSABLE_DOMAINS = new Set<string>([
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'mailinator.com', 'mailinator.net',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'spam4.me',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'temp-mail.org', 'tempmail.com', 'tempmailo.com', 'tempr.email',
  'tmpmail.org', 'tmpmail.net', 'mytemp.email', 'discard.email',
  'trashmail.com', 'trashmail.de', 'trashmail.net',
  'getnada.com', 'nada.email', 'maildrop.cc', 'mailnesia.com',
  'throwawaymail.com', 'fakeinbox.com', 'fakemailgenerator.com',
  'dispostable.com', 'mailcatch.com', 'mintemail.com', 'mohmal.com',
  'getairmail.com', 'emailondeck.com', 'spamgourmet.com', 'mailsac.com',
  'inboxkitten.com', 'moakt.com', 'mvrht.net', 'burnermail.io',
  'anonbox.net', 'harakirimail.com', 'mailnull.com', 'jetable.org',
  'mailexpire.com', 'byom.de', 'luxusmail.org', 'einrot.com',
  'cuvox.de', 'dayrep.com', 'teleworm.us', 'gustr.com',
]);

const encoder = new TextEncoder();

// --- Entree principale du middleware ---
export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;

  // Endpoints du mur (geres entierement ici, pas de fichier static).
  if (path === '/api/access/request') return handleRequestCode(request, env);
  if (path === '/api/access/verify') return handleVerify(request, env, context);

  // Routes laissees libres (vote public, presentateur, assets statiques).
  if (isExempt(path)) return next();

  // Session valide -> on sert le contenu, mais jamais en cache partage.
  const token = getCookie(request, SESSION_COOKIE);
  if (token && env.ACCESS_SIGNING_SECRET && (await verifySession(token, env.ACCESS_SIGNING_SECRET))) {
    return noStore(await next());
  }

  // Sinon -> page mur (a la meme URL : un reload apres validation suffit).
  return wallPage();
}

// Chemins exemptes du mur email.
function isExempt(path: string): boolean {
  if (path.startsWith('/v/')) return true; // vote des sondages live
  if (path === '/presenter' || path.startsWith('/presenter/')) return true; // auth presentateur (worker)
  if (path.startsWith('/cdn-cgi/')) return true;
  if (path.startsWith('/_astro/')) return true;
  if (path.startsWith('/fonts/')) return true;
  if (path.startsWith('/assets/')) return true;
  // Tout fichier avec extension (css, js, png, svg, woff2, txt, ico...) :
  // le dernier segment contient un point.
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return true;
  return false;
}

// --- POST /api/access/request : demande d'un code ---
async function handleRequestCode(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const body = await readJson(request);
  const email = normalizeEmail(String(body?.email ?? ''));
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json(400, { error: 'invalid_email' });
  }
  if (DISPOSABLE_DOMAINS.has(domainOf(email))) {
    return json(422, { error: 'disposable_email' });
  }
  if (!env.ACCESS_OTP_SECRET || !env.N8N_OTP_WEBHOOK_URL) {
    return json(503, { error: 'not_configured' });
  }

  const code = await deriveCode(env.ACCESS_OTP_SECRET, email, currentBucket());
  const sent = await notifyN8n(env, { event: 'request', email, code, ts: new Date().toISOString() });
  if (!sent) return json(502, { error: 'send_failed' });

  return json(200, { ok: true });
}

// --- POST /api/access/verify : validation du code ---
async function handleVerify(request: Request, env: Env, ctx: PagesContext): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const body = await readJson(request);
  const email = normalizeEmail(String(body?.email ?? ''));
  if (!EMAIL_RE.test(email)) return json(400, { error: 'invalid_email' });

  const code = normalizeCode(String(body?.code ?? ''));
  if (code.length !== OTP_LENGTH) return json(400, { error: 'invalid_code' });

  if (!env.ACCESS_OTP_SECRET || !env.ACCESS_SIGNING_SECRET) {
    return json(503, { error: 'not_configured' });
  }

  if (!(await verifyCode(env.ACCESS_OTP_SECRET, email, code))) {
    return json(401, { error: 'wrong_code' });
  }

  const token = await createSession(env.ACCESS_SIGNING_SECRET, email);
  // Journal d'acces : on ne bloque pas la reponse la-dessus.
  if (env.N8N_OTP_WEBHOOK_URL) {
    ctx.waitUntil(notifyN8n(env, { event: 'access', email, ts: new Date().toISOString() }));
  }

  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', sessionCookie(token));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

// --- Codes OTP (sans stockage) ---
function currentBucket(): number {
  return Math.floor(Date.now() / 1000 / OTP_WINDOW_S);
}

async function deriveCode(secret: string, email: string, bucket: number): Promise<string> {
  const mac = new Uint8Array(await hmac(secret, `otp:${email}:${bucket}`));
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += CROCKFORD[mac[i] % 32]; // 256 % 32 === 0 -> pas de biais modulo
  }
  return code;
}

async function verifyCode(secret: string, email: string, code: string): Promise<boolean> {
  // On accepte la fenetre courante et la precedente (~10 a 20 min de validite).
  const buckets = [currentBucket(), currentBucket() - 1];
  for (const bucket of buckets) {
    const expected = await deriveCode(secret, email, bucket);
    if (timingSafeEqual(code, expected)) return true;
  }
  return false;
}

// --- Cookie de session signe ---
async function createSession(secret: string, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const payloadB64 = toB64url(encoder.encode(JSON.stringify({ e: email, x: exp })));
  const sigB64 = toB64url(new Uint8Array(await hmac(secret, payloadB64)));
  return `${payloadB64}.${sigB64}`;
}

async function verifySession(token: string, secret: string): Promise<boolean> {
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  const expected = toB64url(new Uint8Array(await hmac(secret, payloadB64)));
  if (!timingSafeEqual(sigB64, expected)) return false;
  try {
    const payload = JSON.parse(fromB64url(payloadB64)) as { e?: string; x?: number };
    if (typeof payload.x !== 'number') return false;
    return payload.x > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_S}; HttpOnly; Secure; SameSite=Lax`;
}

// --- n8n ---
async function notifyN8n(env: Env, payload: Record<string, unknown>): Promise<boolean> {
  if (!env.N8N_OTP_WEBHOOK_URL) return false;
  try {
    const res = await fetch(env.N8N_OTP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.N8N_WEBHOOK_TOKEN ?? ''}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Utilitaires crypto / encodage ---
async function hmac(secret: string, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(message));
}

function toB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return atob(b64);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- Utilitaires divers ---
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1);
}

// Normalise un code saisi : majuscules, on retire le bruit, et on remappe les
// caracteres ambigus vers l'alphabet Crockford (O->0, I/L->1).
function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function json(status: number, obj: Record<string, unknown>): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Empeche toute mise en cache partagee d'une reponse gatee.
function noStore(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('Cache-Control', 'private, no-store');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

// --- Page mur (HTML inline, autonome, charte LM) ---
function wallPage(): Response {
  return new Response(WALL_HTML, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

const WALL_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Acces aux presentations : Lausanne Marketing</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #FAF8F3;
    color: #191919;
    font-family: 'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .card {
    background: #FFFFFF;
    border: 1px solid rgba(25, 25, 25, 0.08);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(25, 25, 25, 0.08);
    padding: 40px;
    max-width: 420px;
    width: 100%;
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .brand svg { display: block; }
  .brand span { font-weight: 800; font-size: 15px; letter-spacing: 0.02em; }
  h1 { font-size: 26px; font-weight: 800; margin: 0 0 8px; line-height: 1.2; }
  .sub { font-size: 15px; color: #6B6F84; margin: 0 0 24px; line-height: 1.5; }
  label { display: block; font-size: 14px; font-weight: 600; color: #6B6F84; margin-bottom: 8px; }
  input {
    width: 100%;
    font: inherit;
    font-size: 18px;
    padding: 14px 16px;
    background: #FFFFFF;
    color: #191919;
    border: 2px solid rgba(25, 25, 25, 0.12);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.15s ease;
  }
  input:focus { border-color: #191919; }
  #code { letter-spacing: 0.3em; text-transform: uppercase; font-weight: 700; text-align: center; }
  button {
    width: 100%;
    font: inherit;
    font-weight: 800;
    font-size: 18px;
    background: #FFD838;
    color: #191919;
    border: none;
    border-radius: 8px;
    padding: 14px 24px;
    margin-top: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  button:hover:not(:disabled) { background: #FFE55A; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  .msg { font-size: 14px; margin: 12px 0 0; min-height: 1.2em; line-height: 1.4; }
  .msg.error { color: #C2410C; }
  .msg.ok { color: #15803D; }
  .linkrow { margin-top: 18px; text-align: center; }
  .linkbtn {
    background: none; border: none; padding: 0; width: auto; margin: 0;
    font-size: 14px; font-weight: 600; color: #6B6F84; text-decoration: underline; cursor: pointer;
  }
  .linkbtn:hover { background: none; color: #191919; }
  .hint { font-size: 12px; color: #6B6F84; margin: 20px 0 0; text-align: center; line-height: 1.5; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 49 32" fill="none" aria-hidden="true">
        <path d="M25.9557 0L38.391 21.78H13.5204L25.9557 0Z" fill="#FEE487"></path>
        <path d="M36.3557 0L48.791 21.78H23.9204L36.3557 0Z" fill="#FFD838"></path>
        <path d="M1.77273 31.2C1.15227 31.2 0.694318 30.9765 0.398864 30.5295C0.132955 30.0825 0 29.4716 0 28.6968C0 28.2499 0.0443182 27.7582 0.132955 27.2218C0.221591 26.6854 0.325 26.1192 0.443182 25.5232C0.797727 23.9438 1.34432 22.2006 2.08295 20.2934C2.85114 18.3564 3.72273 16.3748 4.69773 14.3484C5.70227 12.2923 6.70682 10.2957 7.71136 8.35874C8.74545 6.42178 9.70568 4.64871 10.592 3.03954C10.6511 2.92034 10.7693 2.69685 10.9466 2.36905C11.1534 2.04126 11.3159 1.80287 11.4341 1.65387C10.2818 1.68367 9.48409 1.63586 8.15454 1.90406C6.85454 2.14245 7.21136 2.15298 6 2.59998C6 2.59998 8.64091 0.0999756 10 0.0999756L18.2148 0C17.5648 0.506589 16.7966 1.43037 15.9102 2.77135C15.0239 4.08252 14.108 5.57249 13.1625 7.24126C12.7489 7.98625 12.2318 8.95473 11.6114 10.1467C10.9909 11.3387 10.3409 12.6648 9.66136 14.1249C8.98182 15.5553 8.33182 17.0006 7.71136 18.4607C7.09091 19.9209 6.55909 21.3066 6.11591 22.6178C5.67273 23.8991 5.39205 25.0017 5.27386 25.9255C5.24432 26.0745 5.22955 26.2235 5.22955 26.3725C5.22955 26.4917 5.22955 26.6258 5.22955 26.7748C5.22955 27.6092 5.45114 28.3095 5.89432 28.8756C6.3375 29.412 7.16477 29.6802 8.37614 29.6802C9.94204 29.6206 11.5227 29.6206 13.1182 29.5014C14.7432 29.3524 16.3239 29.0544 17.8602 28.6074C19.1602 28.2201 20.342 27.6986 21.4057 27.043C22.4693 26.3874 23.2375 25.5679 23.7102 24.5845C23.7693 24.4653 23.8432 24.4057 23.9318 24.4057C24.1386 24.4057 24.242 24.5696 24.242 24.8974C24.242 24.957 24.2273 25.0315 24.1977 25.1209C24.1977 25.2103 24.1829 25.3146 24.1534 25.4338C23.917 26.2086 23.6364 26.894 23.3114 27.49C22.9864 28.086 22.6614 28.5925 22.3364 29.0097C21.5091 30.0229 20.4307 30.6487 19.1011 30.8871C17.8011 31.0957 16.5011 31.2 15.2011 31.2H1.77273Z" fill="#191919"></path>
      </svg>
      <span>Lausanne Marketing</span>
    </div>

    <section id="step-email">
      <h1>Acces aux presentations</h1>
      <p class="sub">Entre ton adresse email pour recevoir un code d'acces a usage unique.</p>
      <form id="form-email" autocomplete="on" novalidate>
        <label for="email">Adresse email</label>
        <input id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="prenom@entreprise.com" required autofocus />
        <button type="submit" id="btn-email">Recevoir le code</button>
        <p class="msg" id="msg-email" aria-live="polite"></p>
      </form>
    </section>

    <section id="step-code" hidden>
      <h1>Entre ton code</h1>
      <p class="sub">Nous avons envoye un code a <strong id="email-echo"></strong>. Il est valable 10 minutes.</p>
      <form id="form-code" autocomplete="off" novalidate>
        <label for="code">Code a 6 caracteres</label>
        <input id="code" name="code" type="text" inputmode="text" autocomplete="one-time-code" maxlength="9" placeholder="K7Q2MX" required />
        <button type="submit" id="btn-code">Acceder</button>
        <p class="msg" id="msg-code" aria-live="polite"></p>
      </form>
      <div class="linkrow">
        <button type="button" class="linkbtn" id="btn-back">Changer d'adresse / renvoyer un code</button>
      </div>
    </section>

    <p class="hint">Les adresses email jetables ne sont pas acceptees. Une fois validee, ta session reste active 30 jours sur cet appareil.</p>
  </main>

  <script>
    var emailStep = document.getElementById('step-email');
    var codeStep = document.getElementById('step-code');
    var formEmail = document.getElementById('form-email');
    var formCode = document.getElementById('form-code');
    var emailInput = document.getElementById('email');
    var codeInput = document.getElementById('code');
    var btnEmail = document.getElementById('btn-email');
    var btnCode = document.getElementById('btn-code');
    var msgEmail = document.getElementById('msg-email');
    var msgCode = document.getElementById('msg-code');
    var emailEcho = document.getElementById('email-echo');
    var btnBack = document.getElementById('btn-back');

    function setMsg(el, text, kind) {
      el.textContent = text;
      el.className = 'msg' + (kind ? ' ' + kind : '');
    }

    formEmail.addEventListener('submit', async function (e) {
      e.preventDefault();
      setMsg(msgEmail, '');
      var email = emailInput.value.trim();
      if (!email) { setMsg(msgEmail, 'Merci de saisir une adresse email.', 'error'); return; }
      btnEmail.disabled = true;
      btnEmail.textContent = 'Envoi...';
      try {
        var res = await fetch('/api/access/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        if (res.status === 200) {
          emailEcho.textContent = email;
          emailStep.hidden = true;
          codeStep.hidden = false;
          codeInput.focus();
          return;
        }
        if (res.status === 422) { setMsg(msgEmail, 'Les adresses email jetables ne sont pas acceptees. Utilise une adresse professionnelle ou personnelle.', 'error'); return; }
        if (res.status === 400) { setMsg(msgEmail, 'Cette adresse email semble invalide.', 'error'); return; }
        if (res.status === 503) { setMsg(msgEmail, 'Le service n\\'est pas encore configure. Reessaie plus tard.', 'error'); return; }
        setMsg(msgEmail, 'Envoi impossible pour le moment. Reessaie dans un instant.', 'error');
      } catch (err) {
        setMsg(msgEmail, 'Erreur reseau. Verifie ta connexion.', 'error');
      } finally {
        btnEmail.disabled = false;
        btnEmail.textContent = 'Recevoir le code';
      }
    });

    formCode.addEventListener('submit', async function (e) {
      e.preventDefault();
      setMsg(msgCode, '');
      var code = codeInput.value.trim();
      if (!code) { setMsg(msgCode, 'Merci de saisir le code recu par email.', 'error'); return; }
      btnCode.disabled = true;
      btnCode.textContent = 'Verification...';
      try {
        var res = await fetch('/api/access/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.value.trim(), code: code })
        });
        if (res.status === 200) {
          setMsg(msgCode, 'Acces confirme, chargement...', 'ok');
          window.location.reload();
          return;
        }
        if (res.status === 401) { setMsg(msgCode, 'Code incorrect ou expire. Verifie ou demande un nouveau code.', 'error'); return; }
        if (res.status === 400) { setMsg(msgCode, 'Le format du code est invalide.', 'error'); return; }
        setMsg(msgCode, 'Verification impossible pour le moment.', 'error');
      } catch (err) {
        setMsg(msgCode, 'Erreur reseau. Verifie ta connexion.', 'error');
      } finally {
        btnCode.disabled = false;
        btnCode.textContent = 'Acceder';
      }
    });

    btnBack.addEventListener('click', function () {
      setMsg(msgCode, '');
      codeInput.value = '';
      codeStep.hidden = true;
      emailStep.hidden = false;
      emailInput.focus();
    });
  </script>
</body>
</html>`;
