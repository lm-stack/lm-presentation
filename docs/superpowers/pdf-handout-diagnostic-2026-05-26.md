# PDF handout : diagnostic root-cause (2026-05-26)

Investigation systématique demandée par Thomas pour arrêter l'itération aveugle sur les bugs PDF handout (cf. TODO « Reprendre à froid les bugs de mise en page PDF handout »).

## TL;DR

**Root cause identifiée pour le bug 1up :** dans `src/layouts/Handout.astro` lignes 39-40, la syntaxe `<style>{`@page { ... }`}</style>` est **rendue littéralement** dans le HTML produit. Le navigateur reçoit `<style>{`@page { size: 297mm 167mm; margin: 0; }`}</style>` (avec les backticks et accolades) au lieu de `<style>@page { size: 297mm 167mm; margin: 0; }</style>`. Le CSS parser silently ignore la règle, et `preferCSSPageSize: true` n'a aucune règle à respecter → Puppeteer tombe sur `format: A4 + landscape`.

**Conséquences :**
- **1up** : génère A4 landscape (297×210mm) au lieu du custom 297×167mm 16:9 → bandes blanches haut/bas de la slide (43mm de blanc total).
- **2up** : "fonctionne" par accident (A4 portrait = la dimension cible 210×297mm).
- **3up** : "fonctionne" idem que 2up MAIS plante en 502 si on appelle avec `orientation=landscape` (conflit silencieux Puppeteer landscape:true vs CSS @page).

## Méthode

Suivi du workflow demandé par l'utilisateur :

1. ✅ `pdfinfo` sur les test-PDFs actuels (locaux ET re-générés depuis prod)
2. ✅ Lecture des sources `Handout.astro`, `handout.css`, worker `lm-pdf/src/index.js`, et inspection du HTML produit en prod
3. ✅ Lecture `Section.astro` pour le watermark `01`
4. ⏸ Reproduction Puppeteer CLI locale : non nécessaire, le bug est observable directement depuis prod

## Investigation détaillée

### Phase 1 : test-PDFs locaux (2026-05-10)

```
test-1up.pdf  → 842.88 × 595.92 pts = 297×210mm A4 landscape (8 pages)
test-2up.pdf  → 595.92 × 842.88 pts = 210×297mm A4 portrait (4 pages)
test-3up.pdf  → 595.92 × 842.88 pts = 210×297mm A4 portrait (2 pages)
```

Ces PDFs sont **antérieurs aux fixes** des commits `c2fcf3f` (2026-05-13), `a08811c`, `8603aff`. Ne reflètent pas l'état actuel.

### Phase 2 : régénération depuis prod (2026-05-26)

```bash
GET https://lm-pdf.hello-cb2.workers.dev/api/pdf
    ?url=https%3A%2F%2Fslides.lausanne.marketing%2Fp%2Ftemplate%2Fhandout%2F1%2F
    &format=A4
    &orientation=landscape
    &margin=0
```

Résultats :
```
current-1up.pdf (orientation=landscape)  → 842 × 596 pts = A4 landscape, 18 pages
current-1up-no-orient.pdf (sans orient)  → 596 × 843 pts = A4 portrait, 18 pages
current-2up.pdf (orientation=portrait)   → 596 × 843 pts = A4 portrait, 9 pages  ✓ OK
current-3up.pdf (orientation=landscape)  → HTTP 502 "rendering failed"
current-3up-portrait.pdf (portrait)      → 596 × 843 pts = A4 portrait, 5 pages
```

Observations :
- **1up** : la page est A4 landscape (297×210mm), **pas** la custom size 297×167mm déclarée dans le CSS.
- Sans le param `orientation`, 1up tombe en A4 portrait. **Donc Puppeteer ignore complètement le `@page { size }` CSS** et utilise `format: A4` + `landscape:` du JS.
- **3up + orientation=landscape** = 502 silencieux côté worker (conflit Puppeteer non géré).

### Phase 3 : inspection du HTML produit

```bash
curl 'https://slides.lausanne.marketing/p/template/handout/1/' | grep '@page'
```

Output :
```html
<style>{`@page { size: 297mm 167mm; margin: 0; }`}</style>
```

**C'EST LE BUG.** La syntaxe Astro `<style>{`...`}</style>` n'est pas évaluée. Le HTML sortant contient les **backticks littéraux** et les **accolades**, ce qui rend la règle CSS invalide.

Le navigateur (Chrome / Puppeteer Browser Rendering) parse `{`@page...`}` comme du CSS, échoue silencieusement, et tombe sans aucune règle `@page`. Du coup `preferCSSPageSize: true` côté worker n'a rien à préférer.

### Pourquoi cette syntaxe Astro ne marche pas

`Handout.astro` lignes 39-40 :
```astro
{mode === '1' && <style>{`@page { size: 297mm 167mm; margin: 0; }`}</style>}
{mode !== '1' && <style>{`@page { size: 210mm 297mm; margin: 0; }`}</style>}
```

Le pattern `<style>{expression}</style>` semble correct en JSX, mais Astro applique un traitement spécial aux balises `<style>` : il les analyse comme du CSS scoped au composant. La `{expression}` JSX à l'intérieur n'est pas évaluée, elle est rendue littéralement.

Symptômes attendus de ce piège, qu'on retrouve dans le bug ci-dessus :
1. Le HTML sortant contient les backticks
2. Le CSS parser silently ignore (pas de console error)
3. Le visuel page → fallback Puppeteer

## Fix proposé

Utiliser `is:inline` + `set:html` pour bypasser le traitement scoped d'Astro et injecter du CSS littéral :

```astro
{mode === '1' && (
  <style is:inline set:html="@page { size: 297mm 167mm; margin: 0; }" />
)}
{mode !== '1' && (
  <style is:inline set:html="@page { size: 210mm 297mm; margin: 0; }" />
)}
```

Ou alternative équivalente, fragment-as-children :

```astro
{mode === '1' && (
  <style is:inline>{'@page { size: 297mm 167mm; margin: 0; }'}</style>
)}
```

**Note importante** : `is:inline` est nécessaire pour qu'Astro ne touche pas au contenu. Le simple `<style set:html=...>` peut être scoped (et le scoping d'@page rules n'a pas de sens).

Vérification : après build local, `cat dist/.../handout/1/index.html | grep @page` doit retourner `<style>@page { size: 297mm 167mm; margin: 0; }</style>` (sans backticks, sans accolades parasites).

## Bug secondaire : watermark Section `01` en 2up/3up

Le composant `Section.astro` ligne 72 :
```css
font-size: clamp(420px, 60vw, 880px);
```

Le `vw` (viewport width) **n'est pas affecté par `zoom`**. Dans le handout, le viewport Puppeteer est 1440px (cf. `lm-pdf/src/index.js:114`), donc :
- `60vw` = 864px, clamp = 864px (entre 420 et 880)
- En mode 1up : `zoom: 0.585` → render à 864 × 0.585 = **506px**
- En mode 2up : `zoom: 0.374` → render à 864 × 0.374 = **323px**
- En mode 3up : `zoom: 0.225` → render à 864 × 0.225 = **194px**

Versus en Reveal fullscreen (viewport ~1920px) :
- `60vw` = 1152px clampé à 880px → render à 880px

Donc le watermark est **3-4× plus petit** en handout que prévu. Couplé à `position: absolute; right: -64px; top: 50%` (qui passe par `zoom`, donc devient `right: -24px` en 1up et `-24px` en 2up), le résultat visuel est un `01` rabougri, mal débordant à droite, qui peut sembler "mal positionné".

### Fix proposé (watermark)

Option A — remplacer `vw` par une unité absolue dans Section.astro (les slides Reveal ont une box fixe 1920×1080 donc `vw` n'apporte rien) :

```css
.slide-section__watermark {
  font-size: 880px;  /* etait : clamp(420px, 60vw, 880px) */
}
```

Option B — utiliser `cqw` (container query width) si on définit `.slide-section` comme container :

```css
.slide-section {
  container-type: inline-size;
}
.slide-section__watermark {
  font-size: clamp(420px, 60cqw, 880px);
}
```

`cqw` est relatif au container (slide à 1920px) et survit au `zoom` correctement.

Préférer A (plus simple, suffit pour ce besoin).

### Autres composants à auditer pour le même bug

`grep -rn "vw" src/components/slides/` remonte :
- `AboutMe.astro:141` : `clamp(160px, 16vw, 280px)`
- `AboutMeBullets.astro:155` : `clamp(72px, 8vw, 120px)`
- `Closing.astro:109` : `clamp(560px, 70vw, 1100px)` (watermark fin de deck)
- `Closing.astro:148` : `clamp(96px, 11vw, 200px)` (titre fin)
- `Cover.astro:122` : `clamp(120px, 14vw, 280px)`
- `Section.astro:72` : `clamp(420px, 60vw, 880px)` (watermark)
- `Section.astro:110` : `clamp(80px, 9vw, 160px)` (titre)
- `Timer.astro:265,311`
- `global.css:14-16` : `--text-*` (impact sur tout texte sized via tokens)

Tous ces composants montrent le même symptôme en handout : tailles `vw` rabougries. Pour les watermarks géants (Section, Closing, Cover, AboutMe), c'est très visible. Pour les titres `9-11vw`, moins critique mais notable.

## Recommandations

### Fixes prioritaires (low risk, high impact)

1. **Fix critique** : remplacer la syntaxe `<style>{`...`}</style>` par `<style is:inline set:html="...">` dans `Handout.astro:39-40`. Test : régénérer 1up, vérifier `pdfinfo` retourne `Page size: 842 × 473 pts` (= 297×167mm).

2. **Watermark Section** : remplacer `clamp(420px, 60vw, 880px)` par `880px` direct dans `Section.astro`. Vérifier visuellement le `01` redevient grand en 1up et 2up.

3. **Worker lm-pdf** : ajouter une protection contre le conflit `landscape:true` + custom CSS page size. Soit :
   - Détecter si la page a un `@page size`, et dans ce cas ne pas passer `landscape:` du tout
   - OU documenter dans le worker que les pages avec `@page size` doivent appeler **sans** le param `orientation`

   La solution la plus propre est de **ne plus passer `landscape:`** quand `preferCSSPageSize:true` est actif. Les pages doivent déclarer leur orientation via `@page { size: <Wmm> <Hmm> }` où W > H = landscape.

### Fixes secondaires (à faire après validation des 3 fixes ci-dessus)

4. Auditer les autres composants slides utilisant `vw` (cf. liste ci-dessus) pour vérifier qu'ils rendent correctement en handout. Convertir si nécessaire.

5. 3up : pourquoi le 502 sur `orientation=landscape` ? Probablement le même conflit landscape vs CSS @page, mais qui cause un crash plutôt qu'un fallback. À reproduire localement avec Puppeteer après le fix #1.

6. Tests visuels finaux : ouvrir les 3 PDFs régénérés dans un viewer PDF (pdf.js / Acrobat) et confirmer :
   - 1up : slide remplit 100% de la page, ratio 16:9 net
   - 2up : 2 slides empilées centrées, watermark/titre des Section slides à la bonne taille
   - 3up : 4 slides (2×2) avec colonne de lignes vierges à droite de chaque slide

## Hypothèses écartées en route

- ❌ "`@media print` global force portrait sur 1up" : pas trouvé de telle règle dans `handout.css` ni `slides.css` ; les `@page` sont les seules règles d'orientation.
- ❌ "viewport Chromium pré-imprimé en portrait avant landscape" : le worker passe explicitement `setViewport({ width: 1440 })` AVANT `goto()`, donc pas une race.
- ❌ "`.handout-page--1up` overridé par autre règle CSS" : grep ne montre qu'une seule définition.
- ❌ "`transform: scale` casse la pagination" : déjà fixé dans le commit qui a introduit `zoom`. Vérifié dans `Handout.astro:126`.

## Annexe : commandes pour reproduire

```bash
# Inspection PDF
pdfinfo file.pdf | grep "Page size"

# Régénération depuis prod
curl -sSL -w "HTTP %{http_code}\n" -o out.pdf \
  'https://lm-pdf.hello-cb2.workers.dev/api/pdf?url=https%3A%2F%2Fslides.lausanne.marketing%2Fp%2Ftemplate%2Fhandout%2F1%2F&format=A4&orientation=landscape&margin=0&filename=test'

# Inspection HTML servi
curl -sSL 'https://slides.lausanne.marketing/p/template/handout/1/' | grep -E '@page'
```
