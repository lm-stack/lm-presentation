#!/usr/bin/env node
/**
 * Build des PDFs handout via Puppeteer.
 *
 * Usage:
 *   node scripts/build-handouts.mjs --slugs slug1,slug2   # PDFs des slugs listes
 *   node scripts/build-handouts.mjs --all                 # PDFs de toutes les presentations
 *   node scripts/build-handouts.mjs --all --rename        # renomme les PDFs existants (sans rendu)
 *
 * Pour chaque slug genere 3 modes : 1up (un slide par page, SANS suffixe), 2up, 3up.
 * Nommage : <NN>-<Titre-1er-mot>-<reste-du-slug>[-Nup].pdf, ou NN est la position
 * du deck dans son parcours (ex. 04-Qualite-donnees.pdf). Output : dist/handouts/.
 *
 * Si Ghostscript est installe (gswin64c, detecte auto ou via $GHOSTSCRIPT), les
 * PDFs sont re-echantillonnes a ~150 DPI en fin d'export (poids / ~4, sans perte
 * visible en salle). Sinon on saute proprement.
 *
 * Le script attend un serveur Astro preview sur localhost:4321 (sauf en --rename).
 */
import { mkdir, readdir, writeFile, rename, unlink } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRESENTATIONS_DIR = join(ROOT, 'src', 'content', 'presentations');
const PARCOURS_DIR = join(ROOT, 'src', 'content', 'parcours');
const OUTPUT_DIR = join(ROOT, 'dist', 'handouts');
const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4321';

// Detection de Ghostscript (binaire console gswin64c) : variable d'env
// GHOSTSCRIPT, puis install utilisateur (~/gs/bin), puis Program Files\gs\<ver>,
// puis le PATH. Retourne le chemin, ou null si introuvable.
function findGhostscript() {
  if (process.env.GHOSTSCRIPT && existsSync(process.env.GHOSTSCRIPT)) return process.env.GHOSTSCRIPT;
  const cands = [];
  const home = process.env.USERPROFILE || process.env.HOME;
  if (home) cands.push(join(home, 'gs', 'bin', 'gswin64c.exe'));
  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], 'C:\\Program Files']) {
    const dir = base && join(base, 'gs');
    if (dir && existsSync(dir)) {
      for (const v of readdirSync(dir)) cands.push(join(dir, v, 'bin', 'gswin64c.exe'));
    }
  }
  for (const c of cands) if (existsSync(c)) return c;
  for (const name of ['gswin64c', 'gs']) {
    const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
    if (r.status === 0) {
      const p = (r.stdout || '').split(/\r?\n/)[0].trim();
      if (p) return p;
    }
  }
  return null;
}

// Re-echantillonne un PDF a ~150 DPI (Ghostscript /ebook) EN PLACE. Retourne la
// nouvelle taille (octets), ou null si la compression a echoue (PDF inchange).
async function compressPdf(gs, file) {
  const tmp = `${file}.tmp`;
  // PAS le preset /ebook : il aplatit la transparence (halos/degrades) contre du
  // noir et casse le design. On se contente de sous-echantillonner les images a
  // 150 DPI, en gardant les couleurs (LeaveColorUnchanged), la transparence
  // (compat 1.7) et le vectoriel intacts.
  const r = spawnSync(gs, [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.7',
    '-dColorConversionStrategy=/LeaveColorUnchanged',
    '-dDownsampleColorImages=true', '-dColorImageResolution=150', '-dColorImageDownsampleType=/Bicubic',
    '-dDownsampleGrayImages=true', '-dGrayImageResolution=150', '-dGrayImageDownsampleType=/Bicubic',
    '-dDownsampleMonoImages=true', '-dMonoImageResolution=300', '-dMonoImageDownsampleType=/Subsample',
    '-dAutoFilterColorImages=true', '-dAutoFilterGrayImages=true',
    '-dDetectDuplicateImages=true',
    '-dNOPAUSE', '-dBATCH', '-dQUIET',
    `-sOutputFile=${tmp}`,
    file,
  ], { stdio: 'ignore' });
  if (r.status !== 0 || !existsSync(tmp)) {
    try { await unlink(tmp); } catch {}
    return null;
  }
  try {
    await unlink(file);
    await rename(tmp, file);
    return statSync(file).size;
  } catch {
    try { await unlink(tmp); } catch {}
    return null;
  }
}

// Nommage : numero de position dans le parcours + TITRE COMPLET du deck (accents
// + determinants, ex. "Qualite des donnees"). Ex. le deck "qualite-donnees" (4e
// du parcours) -> { num: 4, base: "Qualite des donnees" }.
function loadDeckMeta() {
  // Caracteres interdits dans un nom de fichier Windows retires ; accents,
  // espaces, &, virgules, apostrophes conserves.
  const sanitize = (s) => s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  const titleOf = {};
  for (const f of readdirSync(PRESENTATIONS_DIR).filter((x) => x.endsWith('.mdx'))) {
    const slug = basename(f, '.mdx');
    const src = readFileSync(join(PRESENTATIONS_DIR, f), 'utf8');
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const t = fm && fm[1].match(/^title:\s*["']([^"']+)["']/m);
    titleOf[slug] = t ? sanitize(t[1]) : slug;
  }
  // base = titre complet. legacy = ancien nommage (1er mot du titre + reste du
  // slug), garde uniquement pour retrouver un PDF deja nomme a l'ancienne au --rename.
  const baseOf = (slug) => titleOf[slug] || slug;
  const legacyOf = (slug) => {
    const segs = slug.split('-');
    const rest = segs.slice(1).join('-');
    const fw = (titleOf[slug] || slug).trim().split(/\s+/)[0];
    return rest ? `${fw}-${rest}` : fw;
  };
  const meta = new Map();
  const add = (slug, num) => {
    if (!meta.has(slug)) meta.set(slug, { num, base: baseOf(slug), legacy: legacyOf(slug) });
  };
  if (existsSync(PARCOURS_DIR)) {
    for (const f of readdirSync(PARCOURS_DIR).filter((x) => x.endsWith('.mdx'))) {
      const src = readFileSync(join(PARCOURS_DIR, f), 'utf8');
      const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const dm = fm[1].match(/^decks:[ \t]*\r?\n((?:[ \t]*-[ \t]*[A-Za-z0-9_-]+[ \t]*\r?\n?)+)/m);
      if (!dm) continue;
      const slugs = dm[1]
        .split(/\r?\n/)
        .map((l) => l.match(/^[ \t]*-[ \t]*([A-Za-z0-9_-]+)/))
        .filter(Boolean)
        .map((m) => m[1]);
      slugs.forEach((slug, i) => add(slug, i + 1));
    }
  }
  for (const f of readdirSync(PRESENTATIONS_DIR).filter((x) => x.endsWith('.mdx'))) {
    add(basename(f, '.mdx'), null);
  }
  return meta;
}

function outName(meta, slug, mode) {
  const m = meta.get(slug) || { num: null, base: slug };
  const prefix = m.num != null ? `${String(m.num).padStart(2, '0')}-` : '';
  // 1up : pas de suffixe. 2up/3up : meme nom de base + ", N slides".
  const suffix = mode === '1' ? '' : `, ${mode} slides`;
  return `${prefix}${m.base}${suffix}.pdf`;
}

function parseArgs(argv) {
  const args = { slugs: null, all: false, rename: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--rename') args.rename = true;
    else if (argv[i] === '--slugs') args.slugs = argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  }
  return args;
}

async function listAllSlugs() {
  const files = await readdir(PRESENTATIONS_DIR);
  return files.filter((f) => f.endsWith('.mdx')).map((f) => basename(f, '.mdx'));
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

async function generatePdf(browser, slug, mode, meta) {
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
    // Taille de page renseignee DIRECTEMENT (au lieu de preferCSSPageSize, qui
    // pouvait laisser une 1re page au mauvais format) : 1up = paysage 16:9
    // (297x167mm), 2up/3up = A4 portrait.
    const pageSize = mode === '1'
      ? { width: '297mm', height: '167mm' }
      : { width: '210mm', height: '297mm' };
    const pdf = await page.pdf({
      ...pageSize,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      displayHeaderFooter: false,
    });
    const name = outName(meta, slug, mode);
    await writeFile(join(OUTPUT_DIR, name), pdf);
    console.log(`  ok ${name} (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally {
    await page.close();
  }
}

async function main() {
  const { slugs, all, rename: renameMode } = parseArgs(process.argv);
  const targets = all || !slugs || slugs.length === 0 ? await listAllSlugs() : slugs;

  if (targets.length === 0) {
    console.log('Aucun slug a builder.');
    return;
  }

  const meta = loadDeckMeta();

  // Mode renommage : applique le nommage aux PDFs existants, sans rendu. Source
  // recherchee : nom par slug (<slug>-Nup.pdf), ou ancien nom numerote (legacy).
  if (renameMode) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log('Renommage des PDFs existants :');
    for (const slug of targets) {
      const m = meta.get(slug);
      const nn = m && m.num != null ? `${String(m.num).padStart(2, '0')}-` : '';
      for (const mode of ['1', '2', '3']) {
        const name = outName(meta, slug, mode);
        const newF = join(OUTPUT_DIR, name);
        if (existsSync(newF)) continue;
        // anciennes formes possibles (suffixe -Nup) : par slug, par 1er mot
        // (legacy) ou par titre complet, pour retrouver un PDF deja genere.
        const old = mode === '1' ? '' : `-${mode}up`;
        const cands = [
          `${slug}-${mode}up.pdf`,
          m ? `${nn}${m.legacy}${old}.pdf` : null,
          m ? `${nn}${m.base}${old}.pdf` : null,
        ].filter(Boolean);
        const src = cands.find((c) => c !== name && existsSync(join(OUTPUT_DIR, c)));
        if (src) {
          try { await rename(join(OUTPUT_DIR, src), newF); console.log(`  ${src} -> ${name}`); }
          catch (e) { console.log(`  echec ${src} : ${e.message}`); }
        }
      }
    }
    console.log('Done.');
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
        await generatePdf(browser, slug, mode, meta);
      }
    }
  } finally {
    await browser.close();
  }

  // Compression automatique : re-echantillonne les images a ~150 DPI via
  // Ghostscript (/ebook). Sans Ghostscript installe, on saute proprement (les
  // PDFs restent en pleine resolution, rien ne casse).
  const gs = findGhostscript();
  if (gs) {
    console.log(`\nCompression Ghostscript 150 DPI (${gs}) :`);
    for (const slug of targets) {
      for (const mode of ['1', '2', '3']) {
        const f = join(OUTPUT_DIR, outName(meta, slug, mode));
        if (!existsSync(f)) continue;
        const before = statSync(f).size;
        const after = await compressPdf(gs, f);
        if (after) {
          console.log(`  ${outName(meta, slug, mode)} : ${(before / 1048576).toFixed(1)} -> ${(after / 1048576).toFixed(1)} MB`);
        }
      }
    }
  } else {
    console.log('\nGhostscript introuvable : PDFs laisses en pleine resolution (~300 DPI).');
    console.log('Installe Ghostscript pour alleger automatiquement les exports.');
  }

  console.log(`Done. PDFs dans ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
