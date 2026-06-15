// src/scripts/deck/polls.ts
// Sondages live : init et polling des slides <Poll>/<WordCloud>.
//
// Cycle d'une session :
//   1. initial : bouton "Demarrer" visible cote presentateur
//   2. live    : QR + URL + compteur + chart, polling 1.5s
//   3. frozen  : snapshot fige (KV persistant), action reset disponible
//   4. archived: lecture KV apres cours (pour les viewers)
//
// Le polling utilise setInterval cote browser, le worker lm-polls expose les
// endpoints /api/poll/init, /api/poll/{token}/results, /api/poll/{token}/freeze,
// /api/poll/{token}/reset. Les writes (init/freeze/reset) exigent le header
// X-Presenter-Token valide cote worker.
//
// LIFECYCLE DU POLLING — important :
// Le polling ne tourne QUE si :
//   - le presentateur a demarre la session (shouldBePolling = true)
//   - la slide est l'active courante dans Reveal (section.classList.contains('present'))
//   - le tab est visible (!document.hidden)
// Sinon l'interval est suspendu pour eviter de spammer le worker depuis des onglets
// en arriere-plan ou des slides hors vue. syncPolling() est appele a chaque
// slidechanged (depuis Deck.astro) + visibilitychange (ici).

import qrcode from 'qrcode-generator';
import { packWords, type WordInput } from './wordcloud-packing';
import { clearPresenterMode } from './presenter';
import type {
  PollSlideState,
  PollInitBody,
  PollInitResponse,
  PollResultsResponse,
  PollSnapshotResponse,
  PollState,
  PollType,
} from './types';

const wordCloudMeasureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const wordCloudMeasureCtx = wordCloudMeasureCanvas?.getContext('2d') ?? null;

const POLLING_INTERVAL_MS = 1500;
const WORDCLOUD_PADDING = 32;
const WORDCLOUD_TOP_N = 30;

export type PollsConfig = {
  lmPollsUrl: string;
  deckSlug: string;
  presenterToken: string;
};

// Registre des polls actifs sur la page (un PollSlideState par slide poll/wordcloud).
// Permet a syncPolling() de demarrer/stopper les intervals selon la slide courante
// et la visibilite du tab, sans avoir a passer le registre explicitement.
const activePollStates = new Map<string, PollSlideState>();
let pollsConfig: PollsConfig | null = null;
let visibilityHandlerAttached = false;

export async function initPollSlides(config: PollsConfig): Promise<void> {
  pollsConfig = config;

  // Attendre que Hanken Grotesk soit charge avant de mesurer les bbox du wordcloud
  // via canvas.measureText. Sinon canvas fallback sur sans-serif (largeur differente)
  // alors que le DOM rend en Hanken Grotesk -> overlap visuel des mots.
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const slides = document.querySelectorAll<HTMLElement>('section[data-layout="poll"], section[data-layout="wordcloud"]');
  slides.forEach((section) => {
    const pollId = section.dataset.pollId!;
    // Idempotence : si la slide a deja ete wired (hot-reload, re-init), on skip.
    if (section.dataset.pollWired === '1') return;
    section.dataset.pollWired = '1';

    const pollType = section.dataset.pollType as PollType;
    const question = section.dataset.pollQuestion!;
    const options = section.dataset.pollOptions ? JSON.parse(section.dataset.pollOptions) as string[] : undefined;

    const slideState: PollSlideState = {
      type: pollType, question, options, pollId, token: null, pollingTimer: null, section, shouldBePolling: false,
    };

    activePollStates.set(pollId, slideState);
    wirePollSlide(slideState, config);
    void resolvePollInitialState(slideState, config);
  });

  // Pause / resume global sur visibilitychange. Sans ca, un tab en arriere-plan
  // ou cache continue de fetch /results toutes les 1.5s indefiniment.
  if (!visibilityHandlerAttached) {
    document.addEventListener('visibilitychange', syncPolling);
    visibilityHandlerAttached = true;
  }
}

// Reconcilie l'intervalle de chaque poll avec son etat (shouldBePolling) et le
// contexte runtime (slide active + tab visible). Appele par :
//   - les transitions internes (start/freeze/reset)
//   - visibilitychange (registered ici)
//   - slidechanged (registered dans Deck.astro)
export function syncPolling(): void {
  if (!pollsConfig) return;
  const cfg = pollsConfig;
  activePollStates.forEach((s) => {
    const isPresent = s.section.classList.contains('present');
    const shouldRun = s.shouldBePolling && isPresent && !document.hidden;
    if (shouldRun && !s.pollingTimer) {
      // Resume : un fetch immediat pour rattraper l'etat puis l'interval reprend.
      void refreshPoll(s, cfg);
      s.pollingTimer = window.setInterval(() => void refreshPoll(s, cfg), POLLING_INTERVAL_MS);
    } else if (!shouldRun && s.pollingTimer) {
      clearInterval(s.pollingTimer);
      s.pollingTimer = null;
    }
  });
}

function wirePollSlide(s: PollSlideState, config: PollsConfig): void {
  const sec = s.section;
  sec.querySelectorAll<HTMLButtonElement>('[data-poll-start]').forEach((btn) => {
    btn.addEventListener('click', () => onPollStart(s, config));
  });
  sec.querySelector<HTMLButtonElement>('[data-poll-freeze]')?.addEventListener('click', () => onPollFreeze(s, config));
  sec.querySelectorAll<HTMLButtonElement>('[data-poll-reset]').forEach((btn) => {
    btn.addEventListener('click', () => onPollReset(s, config));
  });
}

async function resolvePollInitialState(s: PollSlideState, config: PollsConfig): Promise<void> {
  const stored = sessionStorage.getItem(`poll-${s.pollId}-token`);
  if (stored) {
    const res = await fetch(`${config.lmPollsUrl}/api/poll/${stored}/info`);
    if (res.ok) {
      s.token = stored;
      renderPollQR(s, stored);
      await refreshPoll(s, config);
      showPollState(s, 'live');
      startPollPolling(s, config);
      return;
    }
    if (res.status === 423) {
      s.token = stored;
      await refreshPoll(s, config);
      showPollState(s, 'frozen');
      return;
    }
    sessionStorage.removeItem(`poll-${s.pollId}-token`);
  }

  const snapRes = await fetch(`${config.lmPollsUrl}/api/snapshot/${config.deckSlug}/${s.pollId}`);
  if (snapRes.ok) {
    const snap = await snapRes.json() as PollSnapshotResponse;
    renderPollResults(s, snap.votes, sumVotes(snap.votes));
    showPollState(s, 'archived');
    return;
  }

  showPollState(s, 'initial');
}

async function onPollStart(s: PollSlideState, config: PollsConfig): Promise<void> {
  const body: PollInitBody = {
    deckSlug: config.deckSlug,
    pollId: s.pollId,
    type: s.type,
    question: s.question,
    // Thème du deck transmis au worker : la page de vote s'affichera dans le
    // thème du parcours (rouge ExecEd / jaune LM), y compris sur URL tapée.
    scheme: document.body.dataset.scheme === 'execed' ? 'execed' : 'lm',
  };
  if (s.type === 'choice') body.options = s.options;

  const res = await fetch(`${config.lmPollsUrl}/api/poll/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.presenterToken ? { 'X-Presenter-Token': config.presenterToken } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 403) {
    console.error('Presenter auth invalide, clear le mode');
    clearPresenterMode();
    return;
  }
  if (!res.ok) {
    console.error('Poll init failed', await res.text());
    return;
  }
  const { token } = await res.json() as PollInitResponse;
  s.token = token;
  sessionStorage.setItem(`poll-${s.pollId}-token`, token);
  renderPollQR(s, token);
  showPollState(s, 'live');
  startPollPolling(s, config);
}

async function onPollFreeze(s: PollSlideState, config: PollsConfig): Promise<void> {
  if (!s.token) return;
  const res = await fetch(`${config.lmPollsUrl}/api/poll/${s.token}/freeze`, {
    method: 'POST',
    headers: config.presenterToken ? { 'X-Presenter-Token': config.presenterToken } : {},
  });
  if (res.status === 403) {
    console.error('Presenter auth invalide, clear le mode');
    clearPresenterMode();
    return;
  }
  if (!res.ok) {
    console.error('Freeze failed');
    return;
  }
  stopPollPolling(s);
  await refreshPoll(s, config);
  showPollState(s, 'frozen');
}

async function onPollReset(s: PollSlideState, config: PollsConfig): Promise<void> {
  if (s.token) {
    const res = await fetch(`${config.lmPollsUrl}/api/poll/${s.token}/reset`, {
      method: 'POST',
      headers: config.presenterToken ? { 'X-Presenter-Token': config.presenterToken } : {},
    });
    if (res.status === 403) {
      console.error('Presenter auth invalide, clear le mode');
      clearPresenterMode();
      return;
    }
    await refreshPoll(s, config);
    showPollState(s, 'live');
    startPollPolling(s, config);
  } else {
    await onPollStart(s, config);
  }
}

function showPollState(s: PollSlideState, name: PollState): void {
  const side = s.section.querySelector('[data-poll-side]')!;
  side.querySelectorAll<HTMLElement>('[data-poll-state]').forEach((el) => {
    el.hidden = el.dataset.pollState !== name;
  });
}

function startPollPolling(s: PollSlideState, _config: PollsConfig): void {
  s.shouldBePolling = true;
  syncPolling();
}

function stopPollPolling(s: PollSlideState): void {
  s.shouldBePolling = false;
  syncPolling();
}

async function refreshPoll(s: PollSlideState, config: PollsConfig): Promise<void> {
  if (!s.token) return;
  try {
    // Pas de credentials: le worker lm-polls est sans cookie (auth par token
    // dans l'URL + X-Presenter-Token). Inclure credentials forcerait le worker
    // a renvoyer Access-Control-Allow-Credentials, ce qui ouvre CSRF si un
    // jour il accepte des actions cote credentials. Mieux : token-based pur.
    const res = await fetch(`${config.lmPollsUrl}/api/poll/${s.token}/results`);
    if (!res.ok) return;
    const { votes, total, frozen } = await res.json() as PollResultsResponse;
    renderPollResults(s, votes, total);
    if (frozen) {
      stopPollPolling(s);
      showPollState(s, 'frozen');
    }
  } catch (err) {
    console.error('Polling error', err);
  }
}

function renderPollResults(s: PollSlideState, votes: Record<string, number>, total: number): void {
  if (s.type === 'choice') {
    renderPollBars(s, votes);
  } else {
    renderPollWordCloud(s, votes);
  }
  const liveCounter = s.section.querySelector<HTMLElement>('[data-poll-counter]');
  const frozenCounter = s.section.querySelector<HTMLElement>('[data-poll-frozen-counter]');
  const archivedCounter = s.section.querySelector<HTMLElement>('[data-poll-archived-counter]');
  const unit = s.type === 'choice' ? 'votes' : 'mots';
  const label = `${total} ${unit}`;
  if (liveCounter) liveCounter.textContent = label;
  if (frozenCounter) frozenCounter.textContent = label;
  if (archivedCounter) archivedCounter.textContent = label;
}

function renderPollBars(s: PollSlideState, votes: Record<string, number>): void {
  const max = Math.max(1, ...Object.values(votes), 1);
  s.section.querySelectorAll<HTMLElement>('[data-bar-index]').forEach((row) => {
    const i = parseInt(row.dataset.barIndex!, 10);
    const count = votes[String(i)] || 0;
    const fill = row.querySelector<HTMLElement>('[data-bar-fill]')!;
    const cntEl = row.querySelector<HTMLElement>('[data-bar-count]')!;
    const newWidth = `${(count / max) * 100}%`;
    const oldCount = parseInt(cntEl.textContent || '0', 10);
    fill.style.width = newWidth;
    cntEl.textContent = String(count);
    if (count > oldCount) {
      fill.classList.remove('is-flash');
      void fill.offsetWidth;
      fill.classList.add('is-flash');
    }
  });
}

function renderPollWordCloud(s: PollSlideState, votes: Record<string, number>): void {
  const chart = s.section.querySelector<HTMLElement>('[data-poll-chart]')!;
  if (!chart.offsetParent) return; // slide hidden by Reveal, skip
  const sorted = Object.entries(votes).sort(([, a], [, b]) => b - a).slice(0, WORDCLOUD_TOP_N);
  if (sorted.length === 0) {
    chart.innerHTML = '';
    return;
  }

  const key = JSON.stringify(sorted);
  if (s.lastWordCloudKey === key) return;
  s.lastWordCloudKey = key;

  const words: WordInput[] = sorted.map(([word, count]) => ({
    word,
    count,
    fontSize: Math.min(96, Math.max(28, 28 + count * 6)),
  }));

  // Padding visuel autour du nuage (CSS padding ignore par position:absolute).
  const width = (chart.clientWidth || 1000) - WORDCLOUD_PADDING * 2;
  const height = (chart.clientHeight || 600) - WORDCLOUD_PADDING * 2;

  const placements = packWords(words, width, height, wordCloudMeasureCtx);

  chart.innerHTML = '';
  placements.forEach((p) => {
    const span = document.createElement('span');
    span.className = p.rotated ? 'wordcloud-slide__word wordcloud-slide__word--v' : 'wordcloud-slide__word';
    span.textContent = p.word;
    span.style.position = 'absolute';
    span.style.fontSize = `${p.fontSize}px`;
    span.style.color = p.color;
    span.style.lineHeight = '1';
    span.style.whiteSpace = 'nowrap';
    if (p.rotated) {
      span.style.left = `${p.x + WORDCLOUD_PADDING}px`;
      span.style.top = `${p.y + p.h + WORDCLOUD_PADDING}px`;
      span.style.transformOrigin = 'left top';
    } else {
      span.style.left = `${p.x + WORDCLOUD_PADDING}px`;
      span.style.top = `${p.y + WORDCLOUD_PADDING}px`;
    }
    chart.appendChild(span);
  });
}

function renderPollQR(s: PollSlideState, token: string): void {
  const base = `${window.location.origin}/v/${token}`;
  // Le deck connaît son schéma (data-scheme sur <body>). On le transmet à la page
  // de vote via ?s=execed pour qu'elle s'affiche dans le thème du parcours (rouge
  // ExecEd plutôt que jaune LM). On ne l'ajoute QU'au QR (le chemin que tout le
  // monde scanne) : l'URL courte affichée reste propre à taper et tombe sur le
  // thème LM par défaut, ce qui reste pleinement fonctionnel.
  const scheme = document.body.dataset.scheme === 'execed' ? 'execed' : 'lm';
  const qrUrl = scheme === 'execed' ? `${base}?s=execed` : base;
  const qr = qrcode(0, 'M');
  qr.addData(qrUrl);
  qr.make();
  const svgString = qr.createSvgTag({ scalable: true, margin: 0 });
  const qrEl = s.section.querySelector<HTMLElement>('[data-poll-qr]')!;
  qrEl.innerHTML = svgString;
  s.section.querySelector<HTMLElement>('[data-poll-code]')!.textContent = token;
  s.section.querySelector<HTMLElement>('[data-poll-url]')!.textContent = base.replace(/^https?:\/\//, '');
}

function sumVotes(votes: Record<string, number>): number {
  return Object.values(votes).reduce((s, n) => s + n, 0);
}
