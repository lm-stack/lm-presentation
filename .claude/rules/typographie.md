# Typographie des slides : ÉCHELLE PARTAGÉE (RÈGLE ABSOLUE)

> STATUT (2026-06-08) : MIGRÉ. `type.css` est importé par `slides.css` et toute la famille Hero
> consomme les tokens. Les seules tailles en dur restantes sont des exceptions assumées (grands
> numéros décoratifs / chiffres stat géants sans token, chrome de widgets interactifs Poll /
> WordCloud / UTM, texte interne des mockups device, hauteurs de ligne structurelles du tableur).

Source de vérité des tailles : `src/styles/type.css` (tokens CSS, scheme-indépendants).
S'applique à tous les composants de slide adoptés (`src/components/slides/*.astro` : `Cover`,
`Section`, `InfoCards`, `Steps`, `Table`, `ImageGrid`, `People`, `Schema`, etc.), le système vivant.
(Note : le suffixe `Hero` a été retiré des noms de composants ; « famille Hero » reste le nom du
langage visuel ExecEd-style.)

## RÈGLE ABSOLUE : pas de taille en dur

⚠️ Dans un composant slide, **aucun `font-size` en px brut ni `clamp()` ad hoc**. On utilise
les tokens `--fs-*` de `type.css`. Pendant exact de la règle « pas de hex en dur » (couleur).
Idem pour l'espacement du bloc titre (`--space-title-*`) et la largeur des descriptions
(`--measure-*`).

Conséquence : changer une taille = changer UN token, pas 34 composants.

## Échelle des titres : 3 paliers + Cover + cas spécial

| Token | Valeur | Palier | Composants |
|---|---|---|---|
| `--fs-cover` | clamp(110px, 11vw, 188px) | Cover | `Cover` |
| `--fs-hero-xl` | clamp(72px, 7vw, 120px) | Sections / transitions | `Section`, `SubSection`, `About`, `SectionSplit`, `Statement`, `Pause`, `MatrixRain`, `ClosingHero`, `Questions`, `Merci` |
| `--fs-hero-l` | clamp(56px, 5.5vw, 96px) | Contenu standard | `InfoCards`, `Steps`, `Programme`, `Form`, `ListImage`, `Exchange`, `Workshop`, `People`, `Mockup`, `CodeExamples`, `SplitImage`, `Capture`, `Demo`, `UtmGenerator` |
| `--fs-hero-m` | clamp(40px, 4vw, 72px) | Contenu dense | `ImageGrid`, `Poll`, `WordCloud`, `Compare`, `BarChart`, `Table`, `Media`, `Spreadsheet`, `StatRings`, `Video`, `Schema` |
| `--fs-term` | clamp(76px, 8vw, 140px) | Spécial | `Definition` (terme serif) |

## Échelle des textes & méta

| Token | Valeur | Rôle |
|---|---|---|
| `--fs-lead` | 26px (lh `--lh-lead` 1.45) | sous-titre / lead sous le titre |
| `--fs-body` | 22px (lh `--lh-body` 1.5) | corps, descriptions : **plancher absolu, jamais en dessous** |
| `--fs-card-title` | 30px | titre de card |
| `--fs-label` | 16px | label méta en majuscules |
| `--fs-eyebrow` | 20px | eyebrow |
| `--fs-brand` / `--fs-brand-sub` | 22px / 14px | header de marque (déjà uniforme) |
| `--fs-source` | 16px | ligne source |

Plancher 22px confirmé (remplace l'ancienne règle « min 22px » de `slides.md`) : tout contenu
de fond reste >= `--fs-body`. Chrome/méta (brand-sub, source, badges) admis en dessous.

## Espacement du bloc titre

- `--space-title-lead` = 16px : titre -> sous-titre / lead.
- `--space-title-body` = 48px : bloc titre -> contenu (grille / liste / table), aligné sur le
  rythme du `.slide-divider` (cf. `slides.md`).

## Mesure (largeur de ligne lisible)

`--measure-s` 640px (~45ch) · `--measure-m` 820px (~60ch) · `--measure-l` 1100px (~75ch) ·
`--measure-xl` 1280px (intercalaire). Un corps / lead / description porte un `max-width` = un token `--measure-*`, jamais une valeur en px
arbitraire. **Sous-titres de slide** : si le contenu sous le titre occupe toute la largeur (grilles,
tableaux, graphes, médias : `InfoCards`, `ImageGrid`, `Table`, `BarChart`, `Media`, etc.), le
sous-titre passe en `max-width: none` pour s'aligner sur ce contenu en dessous. Les layouts centrés
ou en colonne (split, intercalaires) gardent un cap `--measure-*`.

## Hors scope

Plus aucun composant legacy : le nettoyage est **terminé**. Supprimés le 2026-06-09 (versions
pré-Hero), puis le 2026-06-14 : les legacy `Calendar`, `Conventions`, `AgendaFull`, `AgendaLight`,
`IconCatalog`, plus les orphelins `Agenda` (remplacé par `AgendaDays`) et `WorkflowCanvas` (remplacé
par `N8nCanvas`).

Équivalents Hero des anciens layouts pré-Hero : `Cover`, `Section`, `Closing`/`ClosingHero`,
`Statement`, `Quote`, `AboutMe`/`AboutMeBullets`, `Workshop`/`WorkshopBrief`, `Capture`, `Exchange`,
`ImageGrid`, `BigImage`, `TableSlide`/`TwoColumnTable`, `NumberedCards`/`NumberedCardWithDetail`,
`Poll`, `WordCloud`. La famille `src/components/slides/` est désormais entièrement « Hero ».
