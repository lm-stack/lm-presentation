// Génère functions/scheme-map.ts depuis le frontmatter `scheme` des decks et
// parcours, pour que le mur d'accès déduise le thème (lm / execed) de la route
// demandée. Lancé au build (prebuild). Ne pas éditer le fichier généré à la main.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function schemesIn(dir) {
  const out = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const src = readFileSync(join(dir, f), 'utf8');
    const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const m = fm && fm[1].match(/^scheme:\s*["']?([\w-]+)["']?/m);
    out[f.replace(/\.mdx$/, '')] = m ? m[1] : 'lm';
  }
  return out;
}

const map = {
  presentations: schemesIn('src/content/presentations'),
  parcours: schemesIn('src/content/parcours'),
};

const out =
  "// GÉNÉRÉ au build par scripts/gen-scheme-map.mjs. Ne pas éditer à la main.\n" +
  "// Schéma (lm | execed) de chaque deck et parcours, pour le thème du mur d'accès.\n" +
  'export const SCHEME_MAP: {\n' +
  '  presentations: Record<string, string>;\n' +
  '  parcours: Record<string, string>;\n' +
  '} = ' +
  JSON.stringify(map, null, 2) +
  ';\n';

writeFileSync('functions/scheme-map.ts', out);
console.log(
  `scheme-map.ts : ${Object.keys(map.presentations).length} decks, ${Object.keys(map.parcours).length} parcours`,
);
