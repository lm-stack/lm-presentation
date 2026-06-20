#!/usr/bin/env node
/**
 * Build des PDFs handout via Puppeteer.
 *
 * Usage:
 *   node scripts/build-handouts.mjs --slugs slug1,slug2     # PDFs des slugs listes
 *   node scripts/build-handouts.mjs --all                   # PDFs de toutes les presentations
 *
 * Pour chaque slug genere les 3 modes (1up, 2up, 3up).
 * Output : dist/handouts/<slug>-<mode>up.pdf
 *
 * Le script attend un serveur Astro preview sur localhost:4321.
 * Le workflow CI lance `npm run preview &` avant d'invoquer ce script.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRESENTATIONS_DIR = join(ROOT, 'src', 'content', 'presentations');
const OUTPUT_DIR = join(ROOT, 'dist', 'handouts');
const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4321';

function parseArgs(argv) {
  const args = { slugs: null, all: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--slugs') args.slugs = argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  }
  return args;
}

async function listAllSlugs() {
  const files = await readdir(PRESENTATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => basename(f, '.mdx'));
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

async function generatePdf(browser, slug, mode) {
  const url = `${PREVIEW_URL}/p/${slug}/handout/${mode}/`;
  const page = await browser.newPage();
  try {
    // 'load' (et non 'networkidle0') : robuste si une slide contient une video
    // (autoplay/buffer garde le reseau actif, networkidle0 ne se declenche jamais).
    const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response?.status() ?? '?'} sur ${url}`);
    }
    // Laisse les images (forcees eager par le layout) se charger/decoder et la
    // pagination JS se terminer avant l'impression.
    await page.evaluate(() => Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((res) => { img.onload = img.onerror = res; })),
    ));
    await new Promise((r) => setTimeout(r, 800));
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    const out = join(OUTPUT_DIR, `${slug}-${mode}up.pdf`);
    await writeFile(out, pdf);
    console.log(`  ok ${slug}-${mode}up (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally {
    await page.close();
  }
}

async function main() {
  const { slugs, all } = parseArgs(process.argv);
  const targets = all || !slugs || slugs.length === 0
    ? await listAllSlugs()
    : slugs;

  if (targets.length === 0) {
    console.log('Aucun slug a builder.');
    return;
  }

  console.log(`Build handouts pour ${targets.length} presentation(s) :`, targets.join(', '));
  console.log(`Attente du preview server (${PREVIEW_URL})...`);
  await waitForPreview();
  await mkdir(OUTPUT_DIR, { recursive: true });

  // CI : Chrome installe par setup-chrome (chemin dans PUPPETEER_EXECUTABLE_PATH).
  // Local : pointer manuellement vers Chrome (Windows par defaut, ou override via env).
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  // --no-sandbox necessaire sur les runners GitHub Actions (Linux) : le ZygoteHost
  // de Chrome crash sans acces /proc/cpufreq. Sur Windows en local c'est inoffensif.
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (const slug of targets) {
      console.log(`- ${slug}`);
      for (const mode of ['1', '2', '3']) {
        await generatePdf(browser, slug, mode);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Done. PDFs dans ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
