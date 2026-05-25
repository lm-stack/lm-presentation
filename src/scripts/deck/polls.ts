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
// X-Presenter-Key valide cote worker.

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

export async function initPollSlides(config: PollsConfig): Promise<void> {
  // Attendre que Hanken Grotesk soit charge avant de mesurer les bbox du wordcloud
  // via canvas.measureText. Sinon canvas fallback sur sans-serif (largeur differente)
  // alors que le DOM rend en Hanken Grotesk -> overlap visuel des mots.
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const slides = document.querySelectorAll<HTMLElement>('section[data-layout="poll"], section[data-layout="wordcloud"]');
  slides.forEach((section) => {
    const pollId = section.dataset.pollId!;
    const pollType = section.dataset.pollType as PollType;
    const question = section.dataset.pollQuestion!;
    const options = section.dataset.pollOptions ? JSON.parse(section.dataset.pollOptions) as string[] : undefined;

    const slideState: PollSlideState = {
      type: pollType, question, options, pollId, token: null, pollingTimer: null, section,
    };

    wirePollSlide(slideState, config);
    void resolvePollInitialState(slideState, config);
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

function startPollPolling(s: PollSlideState, config: PollsConfig): void {
  stopPollPolling(s);
  s.pollingTimer = window.setInterval(() => void refreshPoll(s, config), POLLING_INTERVAL_MS);
}

function stopPollPolling(s: PollSlideState): void {
  if (s.pollingTimer) {
    clearInterval(s.pollingTimer);
    s.pollingTimer = null;
  }
}

async function refreshPoll(s: PollSlideState, config: PollsConfig): Promise<void> {
  if (!s.token) return;
  try {
    // Pas de credentials: le worker lm-polls est sans cookie (auth par token
    // dans l'URL + X-Presenter-Key). Inclure credentials forcerait le worker
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
  const url = `${window.location.origin}/v/${token}`;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const svgString = qr.createSvgTag({ scalable: true, margin: 0 });
  const qrEl = s.section.querySelector<HTMLElement>('[data-poll-qr]')!;
  qrEl.innerHTML = svgString;
  s.section.querySelector<HTMLElement>('[data-poll-code]')!.textContent = token;
  s.section.querySelector<HTMLElement>('[data-poll-url]')!.textContent = url.replace(/^https?:\/\//, '');
}

function sumVotes(votes: Record<string, number>): number {
  return Object.values(votes).reduce((s, n) => s + n, 0);
}
