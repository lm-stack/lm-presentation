#!/usr/bin/env node
/**
 * Génère les images "poster" des slides VideoHero à partir d'un horodatage,
 * via ffmpeg (ffmpeg-static). Le poster sert de thumbnail à l'export PDF :
 * Puppeteer capture la frame `poster` d'un <video> non lu.
 *
 * Source de vérité : les props `video` + `posterTime` des <VideoHero> dans
 * src/content/presentations/*.mdx. Pour chaque vidéo présente dans /public,
 * la frame à `posterTime` est extraite vers <video>-poster.jpg (même dossier),
 * chemin que VideoHero dérive automatiquement quand la prop `poster` est absente.
 *
 * Robuste et NON bloquant : si une vidéo n'existe pas encore (pas enregistrée),
 * si ffmpeg-static manque, ou si ffmpeg échoue, on logue un avertissement et on
 * continue. Le script ne sort jamais en erreur, pour ne jamais casser le build.
 *
 * Usage : node scripts/extract-video-posters.mjs
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
// NB : cible le composant <Video> (ex-<VideoHero>, renommé au commit bbc03d7).

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRESENTATIONS_DIR = join(ROOT, 'src', 'content', 'presentations');
const PUBLIC_DIR = join(ROOT, 'public');

/** Extrait les blocs <Video ... /> et leurs props video / poster / posterTime. */
function parseVideos(mdx) {
  const blocks = mdx.match(/<Video\b[\s\S]*?\/>/g) ?? [];
  return blocks
    .map((b) => ({
      video: b.match(/\bvideo=["']([^"']+)["']/)?.[1],
      poster: b.match(/\bposter=["']([^"']+)["']/)?.[1],
      posterTime: b.match(/\bposterTime=["']([^"']+)["']/)?.[1],
    }))
    .filter((v) => v.video);
}

function derivePoster(video) {
  return video.replace(/\.[^.]+$/, '-poster.jpg');
}

/** "1:30" / "90" / "00:01:30" -> chaîne acceptée par ffmpeg -ss (laisse tel quel). */
function toFfmpegTime(t) {
  return t ? String(t).trim() : '0';
}

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!ffmpegPath) {
    console.warn('[posters] ffmpeg-static introuvable, étape ignorée.');
    return;
  }
  let files = [];
  try {
    files = (await readdir(PRESENTATIONS_DIR)).filter((f) => f.endsWith('.mdx'));
  } catch (err) {
    console.warn('[posters] dossier présentations illisible, étape ignorée :', err.message);
    return;
  }

  let generated = 0;
  let skipped = 0;
  for (const file of files) {
    const mdx = await readFile(join(PRESENTATIONS_DIR, file), 'utf8');
    for (const vh of parseVideos(mdx)) {
      // Poster explicite (non dérivé) = géré à la main, on ne le régénère pas.
      if (vh.poster) continue;

      const posterRel = derivePoster(vh.video);
      const videoAbs = join(PUBLIC_DIR, vh.video.replace(/^\//, ''));
      const posterAbs = join(PUBLIC_DIR, posterRel.replace(/^\//, ''));

      if (!(await exists(videoAbs))) {
        console.warn(`[posters] vidéo absente, skip : ${vh.video} (${file})`);
        skipped++;
        continue;
      }

      const time = toFfmpegTime(vh.posterTime);
      const res = spawnSync(
        ffmpegPath,
        ['-y', '-ss', time, '-i', videoAbs, '-frames:v', '1', '-q:v', '2', posterAbs],
        { stdio: 'pipe' },
      );
      if (res.status === 0) {
        console.log(`[posters] ok ${posterRel} @ ${time} (${file})`);
        generated++;
      } else {
        const tail = res.stderr?.toString().trim().split('\n').slice(-2).join(' ') ?? '';
        console.warn(`[posters] ffmpeg a échoué pour ${vh.video} : ${tail}`);
        skipped++;
      }
    }
  }
  console.log(`[posters] terminé : ${generated} générés, ${skipped} ignorés.`);
}

main().catch((err) => {
  console.warn('[posters] erreur non bloquante :', err.message);
});
