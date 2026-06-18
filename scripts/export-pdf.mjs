#!/usr/bin/env node
/**
 * Export PDF « 1 slide par page » d'un ou plusieurs decks vers le dossier pdf/.
 *
 * Usage :
 *   node scripts/export-pdf.mjs --slugs collecte-donnees
 *   node scripts/export-pdf.mjs --slugs intro,collecte,architecture --subdir crm-data-automation
 *   node scripts/export-pdf.mjs --slugs collecte-donnees --no-build   # reutilise le dist/ existant
 *
 * Pour chaque slug : ouvre la route handout mode 1 (1up = 1 slide/page, paysage),
 * imprime en PDF et ecrit pdf/[subdir/]<slug>.pdf (ecrase toute version anterieure).
 *
 * Le script gere tout le cycle : build (sauf --no-build) -> preview local -> export
 * -> arret du preview. Ne PAS lancer pendant qu'`astro dev` tourne (le build entre
 * en conflit avec le watcher Vite : couper le dev d'abord).
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PDF_DIR = join(ROOT, 'pdf');
const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const IS_WIN = process.platform === 'win32';

function parseArgs(argv) {
  const args = { slugs: [], subdir: null, build: true };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--all') continue; // non supporte ici : on exporte une selection explicite
    else if (argv[i] === '--no-build') args.build = false;
    else if (argv[i] === '--slugs') args.slugs = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--subdir') args.subdir = (argv[++i] ?? '').trim() || null;
  }
  return args;
}

/** Lance une commande et resout quand elle se termine (code 0). Commande en
 *  STRING (pas d'args array) + shell:true -> evite la DeprecationWarning DEP0190.
 *  Les commandes ici sont statiques (aucune entree externe) : pas d'injection. */
function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd: ROOT, stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} -> code ${code}`))));
  });
}

async function waitForPreview(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(PREVIEW_URL);
      if (res.ok) return;
    } catch {
      // pas encore pret
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server pas joignable a ${PREVIEW_URL} apres ${timeoutMs}ms`);
}

/** Demarre `astro preview` en arriere-plan, renvoie le child process. */
function startPreview() {
  return spawn('npm run preview', {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true,
    detached: !IS_WIN,
  });
}

/** Tue l'arbre de process du preview (npm -> node) proprement, multi-plateforme. */
function killPreview(child) {
  if (!child || child.killed || child.pid == null) return;
  if (IS_WIN) {
    spawn(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore', shell: true });
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch { /* ignore */ } }
  }
}

async function exportDeck(browser, slug, subdir) {
  const url = `${PREVIEW_URL}/p/${slug}/handout/1/`;
  const page = await browser.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response?.status() ?? '?'} sur ${url} (slug "${slug}" introuvable ?)`);
    }
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    const outDir = subdir ? join(PDF_DIR, subdir) : PDF_DIR;
    await mkdir(outDir, { recursive: true });
    const out = join(outDir, `${slug}.pdf`);
    await writeFile(out, pdf); // ecrase toute version anterieure
    console.log(`  ok ${subdir ? subdir + '/' : ''}${slug}.pdf (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally {
    await page.close();
  }
}

async function main() {
  const { slugs, subdir, build } = parseArgs(process.argv);
  if (slugs.length === 0) {
    console.error('Aucun slug. Usage : node scripts/export-pdf.mjs --slugs a,b [--subdir nom] [--no-build]');
    process.exit(1);
  }

  if (build) {
    console.log('Build du site (npm run build)...');
    await run('npm run build');
  }

  console.log('Demarrage du preview local...');
  const preview = startPreview();
  let browser;
  try {
    await waitForPreview();
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log(`Export de ${slugs.length} deck(s) vers pdf/${subdir ? subdir + '/' : ''} :`, slugs.join(', '));
    for (const slug of slugs) {
      await exportDeck(browser, slug, subdir);
    }
    console.log(`Done. PDFs dans ${subdir ? join('pdf', subdir) : 'pdf'}/`);
  } finally {
    if (browser) await browser.close();
    killPreview(preview);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
