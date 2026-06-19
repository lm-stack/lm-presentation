# Règles visuelles des slides (INTANGIBLES)

Ces règles s'appliquent aux composants de slide (`src/components/slides/`) et à `src/styles/slides.css`. Les slides font 1920×1080 (config Reveal : `src/scripts/deck/reveal-init.ts`, `margin: 0`).

## Zone titre d'une slide à contenu

Composant : `src/components/SlideTitle.astro`. Toujours rendu dans cet ordre exact, RIEN d'autre entre ces trois éléments :

1. `<h2>` — le titre
2. `<p class="slide-subtitle">` — le sous-titre (optionnel)
3. `<span class="slide-divider"></span>` — la barre jaune

Rythme imposé dans `src/styles/slides.css` :
- 4px entre `h2` et `.slide-subtitle`
- 32px entre `.slide-subtitle` et `.slide-divider`
- 48px sous `.slide-divider` (espace avant le contenu)

**Aucun `eyebrow`, badge, intro, ou autre élément ne doit s'insérer entre le titre et la bordure jaune.** Si un composant viole ça (eyebrow rendu avant le SlideTitle par exemple), retirer l'élément du composant ET de tous les appels MDX.

Cas particuliers admis (slides "structurelles" avec leur propre identité visuelle, qui n'utilisent PAS SlideTitle) :
- `Cover` : page de garde, h1 monumental + watermark, peut avoir un eyebrow
- `Section` / `SubSection` : transition de section, gros numéro + h2 + rule
- `About` : présentation de l'intervenant
- `Statement`, `Quote`, `Definition` : citations / déclarations fortes
- Fin de deck : auto-injectée (`Questions` / `Merci`), jamais écrite à la main

## Centrage vertical du contenu — RÈGLE ABSOLUE (lis attentivement, Claude)

⚠️ **Le titre d'une slide reste TOUJOURS fixe en haut**, à la même position spatiale sur toutes les slides. Le contenu sous le titre est centré dans l'**espace restant** (entre le bas du titre et le bas de la slide). Il NE FAUT PAS centrer tout (titre + contenu) comme un bloc — sinon le titre dérive vers le milieu selon la hauteur du contenu, ce que Thomas a déjà signalé une dizaine de fois.

**Comment c'est implémenté** (`src/styles/slides.css`) :

```css
.reveal section {
  padding: 80px 96px;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  /* PAS de justify-content: center ! Le titre reste en haut (flex-start par défaut). */
}

.reveal section > .slide-title + * {
  flex: 1 1 auto !important;   /* le body prend tout l'espace restant */
  min-height: 0 !important;
}
```

**Chaque composant slide** ajoute son centrage interne dans son `.xxx-slide__body` :
- Si le body est `display: grid` → ajouter `align-content: center`
- Si le body est `display: flex; flex-direction: column` → ajouter `justify-content: center`
- Si le body est `display: flex; flex-direction: row` → ajouter `align-items: center`

**Slides "structurelles"** (`Cover`, `Section`, `SubSection`, `About`, `Statement`, `Quote`, `Definition`, `ImageFull`) — n'utilisent PAS SlideTitle, elles ont leur propre layout avec `justify-content: center !important` sur la section (h1 monumental, watermark, etc.). Leur règle override la nôtre, c'est intentionnel.

**Ne jamais** :
- Ajouter `justify-content: center` sur `.reveal section` global → casse la position du titre
- Oublier `align-content: center` (grid) ou `justify-content: center` (flex) sur le body d'une nouvelle slide → contenu collé sous le titre, blanc en bas
- Centrer un titre par lui-même (genre `text-align` ou marges magiques) → utiliser SlideTitle

## Safe area top/bottom — RÈGLE ABSOLUE

⚠️ **Tout contenu d'une slide doit respecter un espace minimum entre :**
- le bord supérieur de la slide et le premier élément (header, titre, ligne de séparation, etc.)
- le dernier élément (image, texte, card, item, etc.) et le bord inférieur de la slide

**Minimum non négociable : 48px en haut ET en bas.**

Implémentation : le `padding-top` et `padding-bottom` du conteneur `<section>` racine de chaque composant slide doit être ≥ 48px. La convention LM établie utilise `padding: 64px 96px !important` pour les composants ExecEd-style (`Cover`, `Section`, `Quote`, `About`, `ImageGrid`, etc.), et 80px pour les slides à SlideTitle (`Default`, `BigImage`, etc.).

Si un layout requiert plus d'air pour respirer, monter le padding (96px, 120px). **Ne jamais descendre sous 48px.**

Concrètement pour les nouvelles grilles ou listes : les items doivent être contraints (`max-height` sur les `.xxx__item` quand ils grandissent en `1fr` rows) pour ne jamais venir coller le bord supérieur ou inférieur de la `<section>` racine.

## Border-radius cards et images — RÈGLE ABSOLUE

⚠️ **Toutes les cards et toutes les images encadrées d'un slide doivent utiliser `border-radius: 4px`.**

Pas de 8px, 12px, 16px ou autre valeur arbitraire. Le 4px uniforme garantit un langage visuel cohérent à travers tous les composants : `InfoCards`, `People`, `Steps`, `ImageGrid`, `About` photo, `Cover` image-card, `Section` image, `SplitImage` image, etc.

Exception unique : les cercles décoratifs (rond jaune `Quote`, `Conventions__disc`, pastilles de profil avatars circulaires) qui utilisent `border-radius: 50%`.

## Drop-shadow cards et images — RÈGLE ABSOLUE

⚠️ **Dropshadows légères uniquement** sur les cards et images : convention LM `0 4px 12px -4px rgba(25, 25, 25, 0.08)` (ou tout au plus `0 6px 16px -6px rgba(25, 25, 25, 0.10)`).

Pas de shadows monumentales `0 32px 64px -16px rgba(25, 25, 25, 0.18)` qui font « démo Webflow 2018 ». La hiérarchie visuelle vient des contrastes, pas de l'ombre.

## Header ExecEd-style — RÈGLE ABSOLUE

⚠️ **Le header ne change JAMAIS** entre les composants ExecEd-style. Format unique :

- **Brand text à gauche** : `brand` en CAPS 22px bold + `brandSub` optionnel en 14px medium gris
- **Logo LM cliquable à droite** : 48px de haut, lien `https://lausanne.marketing` `target="_blank"` `rel="noopener"` avec `aria-label="Lausanne Marketing"`
- **Border-bottom full width** : `1px solid rgba(25, 25, 25, 0.12)` qui traverse toute la largeur de la slide (même pour les layouts split type `Steps`, `SectionSplit`, `Programme` : le header est full-width, les colonnes commencent EN DESSOUS)
- **Padding bottom** : 24px sous le brand + logo, avant la border
- **align-items: center** sur le header pour aligner logo et brand text verticalement

Vaut pour : `Cover`, `About`, `Section`, `Quote`, `ImageFull`, `ClosingHero`, `Steps`, `SectionSplit`, `SplitImage`, `InfoCards`, `People`, `ImageGrid`, `Programme`, et tout futur composant ExecEd-style.

**Slides de fin (`Questions`, `Merci`)** : même header que partout, **logo cliquable** (lien `https://lausanne.marketing`, `target="_blank"`, `rel="noopener"`, `aria-label="Lausanne Marketing"`) comme tous les composants ExecEd-style. Conséquence : sur `Questions` il y a **deux liens** (le logo externe + la carte de preview vers le deck suivant) ; sur `Merci`, le logo est le seul lien. Le swap de logo par thème reste assuré par le sélecteur `[class$="__brand-logo"]` de `themes.css`. (Historique : ces slides avaient un logo volontairement non cliquable jusqu'au 2026-06-13, harmonisé depuis.)

## Fond uniforme des slides à contenu — RÈGLE ABSOLUE

⚠️ **Toutes les slides à contenu ExecEd-style partagent le MÊME fond** : le dégradé pearl `linear-gradient(180deg, #FFFFFF 0%, #EFEFF2 100%)`. Aucun saut de fond d'une slide à l'autre.

Vaut pour : `ImageGrid`, `Steps`, `SectionSplit`, `Workshop`, `Section`, `ListImage`, `InfoCards`, `People`, `Programme`, `About`, `Quote`, et tout futur composant à contenu.

Seules exceptions admises : les slides **structurelles** plein cadre qui ont leur propre identité visuelle, `Cover` (thème `--ch-bg`) et `ClosingHero` (image + voile). Elles ne sont pas soumises à l'uniformité.

Incident 2026-06-02 : `InfoCards` était resté sur l'ancien fond crème `#FAF8F3`, créant un saut visible dans le deck `collecte-donnees`. Aligné sur le dégradé pearl.

## Intercalaire de sous-section (SubSection) — sous-titre sur une seule ligne

⚠️ Le sous-titre (`subtitle`) d'un `<SubSection>` tient **toujours sur une seule ligne**, bien remplie. Le composant force `white-space: nowrap` sur `.subsection-hero__subtitle`, et la largeur du bloc texte (`.subsection-hero__text`) comme du sous-titre est portée à `max-width: 1280px` (≈ toute la largeur utile à droite du grand numéro).

- Densité visée : remplir la ligne (~85 caractères), pas une phrase courte.
- Au-delà de ~90 caractères (~1260px à 27px), le texte est **coupé à droite** (overflow caché de la section), pas renvoyé à la ligne. Calibrer le texte en conséquence.
- Le grand numéro (`index`) est l'ancre graphique : un chiffre court (`1.0`, `2.1`) rend mieux qu'un long nombre.

## Numérotation des slides de section — RÈGLE ABSOLUE

⚠️ **Tout slide de section / intercalaire (`SubSection`, `Section`) DOIT porter un numéro** via la prop `index` (le grand chiffre coloré, ancre graphique de l'intercalaire). Jamais d'intercalaire sans numéro.

- Numéro court : `00`, `01`, `1.2`. Un chiffre court rend mieux qu'un long nombre.
- Pour un intercalaire d'ouverture placé **avant** la section `01` (mise en contexte, état des lieux), utiliser `00` plutôt que de renuméroter toutes les sections suivantes.

## Image plein cadre (`ImageFull`) + légende en box — RÈGLE

`ImageFull` affiche une image en **bleed total** (1920×1080), **sans titre, sans cadre et sans bandeau marque** : rien d'autre que la légende. À réserver aux images **16:9** : le `object-fit: cover` remplit sans rien rogner quand le ratio correspond ; sinon il coupe les bords.

Légende optionnelle rendue dans une **box blanche à bordure légère** — style card global : `var(--c-surface)`, bordure `color-mix(in srgb, var(--c-ink) 8%, transparent)`, `border-radius: 4px`, drop-shadow légère. Champs : `captionTitle` (titre gras), `caption` (description), et `source` + `sourceUrl` (ligne **source bleue soulignée tout en bas de la box**, même convention que `.slide-source`). Positionnable dans un des **4 coins** via `captionPosition` : `"top-left" | "top-right" | "bottom-left" | "bottom-right"` (défaut `bottom-left`).

⚠️ **Toujours vérifier visuellement** quel coin de l'image est le plus vide **avant** de poser la box, pour ne jamais recouvrir un élément important. Le coin **haut-gauche est occupé par le bandeau marque** (la box top-left est décalée dessous) : préférer un autre coin quand c'est possible.

## Taille de texte minimum — RÈGLE

⚠️ **Le texte de contenu d'une slide ne descend jamais sous 22px** : titres, sous-titres, corps, items de liste, titres et descriptions de cards et de légendes. À 1920×1080 projeté en salle, en dessous ça devient illisible au fond.

Exceptions (chrome / méta, pas du contenu de fond) : `brandSub` (14px), lignes de source / attribution (16–18px), watermarks décoratifs.

## Titre d'un slide Workshop — RÈGLE ABSOLUE

⚠️ Le titre d'un `Workshop` est **TOUJOURS** « Workshop ». Aucune variante thématique (« L'ERD de votre boîte », « Construction d'un funnel », « Atelier de modélisation », etc.) : le mot « Workshop » est l'ancrage visuel récurrent qui signale un temps d'atelier dans le parcours.

- Le sujet précis de l'atelier va dans le `subtitle` et les `rows` (Format, Temps, Objectif, Output, Restitution), **jamais** dans le titre.
- Côté MDX : ne plus passer de `title` ni d'`italicPart` sur un `<Workshop>`. Ces props **n'existent plus** dans l'interface du composant.
- Durci dans le code : le `<h2>` de `src/components/slides/Workshop.astro` est **codé en dur** sur « Workshop » (rendu en italique souligné, le traitement d'ancrage), props `title` / `italicPart` retirées. La règle est donc inviolable, pas seulement conventionnelle.

## Slide de fin auto (`Questions` / `Merci`) — RÈGLE ABSOLUE

⚠️ **La slide de fin d'un deck n'est jamais écrite à la main dans le MDX.** Elle est **auto-injectée** par la route `src/pages/p/[slug].astro`, après `<Content />`, en fonction de la position du deck dans son parcours.

- **`Questions`** (titre figé « Des questions ? ») : deck appartenant à un parcours et **qui n'en est PAS le dernier**. Affiche une **carte de preview cliquable** vers le deck suivant (cover + titre + accroche `short`/`subtitle`), plus le logo cliquable du header. **Fond image obligatoire** : la `cover` du deck en full-bleed flouté + voile clair.
- **`Merci`** (titre figé « Merci beaucoup ») : présentation **one-shot** (hors parcours) OU **dernier deck** d'un parcours. **Fond image obligatoire** : la `cover` du deck en full-bleed flouté + voile clair (le `cover` est désormais requis dans le schéma, plus de fond pearl vide). Seul lien : le logo du header.

Règles associées :

- **Toujours dans la ToC (« Sommaire »).** Les deux slides de fin exposent `data-section-title` (« Questions » et « Merci »), donc le slide de clôture apparaît TOUJOURS dans la table des matières du deck et du template. Ne jamais retirer cet attribut : la ToC (« Sommaire ») est auto-construite depuis `section[data-section-title]` (`deck-chrome.ts`).
- **Titres durcis, comme `Workshop`.** Le `<h2>` est codé en dur dans chaque composant (« Des questions ? » / « Merci beaucoup », mot final en italique serif souligné gold). Pas de prop `title`. Inviolable.
- **Header de marque** : la slide de fin reprend le MÊME header que les slides de contenu. `brand` = le cours (titre du parcours, ou titre du deck en one-shot) ; `brandSub` = l'institution déduite du schéma (`execed` = « Executive Education », `lm` = « Lausanne Marketing »), PAS le titre du deck. Calculé par la route, ne pas dupliquer côté MDX.
- **`autoClosing`** (frontmatter, défaut `true`) : passer `autoClosing: false` UNIQUEMENT quand le deck gère sa propre fin (ex. `template.mdx`, vitrine qui appelle `Questions` / `Merci` à la main avec des données d'exemple). Sinon, laisser la route faire.
- **Ne jamais remettre un `ClosingHero` / `Closing` manuel** en bas d'un deck de parcours : la migration 2026-06-08 les a tous retirés au profit de la fin auto. Un « Merci » manuel ferait doublon avec le `Merci` injecté.
