# Typographie des slides : ÉCHELLE PARTAGÉE (RÈGLE ABSOLUE)

> STATUT (2026-06-08) : MIGRÉ. `type.css` est importé par `slides.css` et toute la famille Hero
> consomme les tokens. Les seules tailles en dur restantes sont des exceptions assumées (grands
> numéros décoratifs / chiffres stat géants sans token, chrome de widgets interactifs Poll /
> WordCloud / UTM, texte interne des mockups device, hauteurs de ligne structurelles du tableur).

Source de vérité des tailles : `src/styles/type.css` (tokens CSS, scheme-indépendants).
S'applique à la famille de composants **Hero** (`src/components/slides/*Hero.astro` + `InfoCardsGrid`,
`NumberedSplit`, `SectionSplit`, `TitleSplitImage`, `PeopleCards`, `SchemaTriptych`), qui est le système vivant.

## RÈGLE ABSOLUE : pas de taille en dur

⚠️ Dans un composant slide, **aucun `font-size` en px brut ni `clamp()` ad hoc**. On utilise
les tokens `--fs-*` de `type.css`. Pendant exact de la règle « pas de hex en dur » (couleur).
Idem pour l'espacement du bloc titre (`--space-title-*`) et la largeur des descriptions
(`--measure-*`).

Conséquence : changer une taille = changer UN token, pas 34 composants.

## Échelle des titres : 3 paliers + Cover + cas spécial

| Token | Valeur | Palier | Composants |
|---|---|---|---|
| `--fs-cover` | clamp(110px, 11vw, 188px) | Cover | `CoverHero` |
| `--fs-hero-xl` | clamp(72px, 7vw, 120px) | Sections / transitions | `SectionHero`, `SubSectionHero`, `AboutHero`, `SectionSplit`, `StatementHero`, `PauseHero`, `MatrixRainHero`, `ClosingHero`, `QuestionsHero`, `MerciHero` |
| `--fs-hero-l` | clamp(56px, 5.5vw, 96px) | Contenu standard | `InfoCardsGrid`, `NumberedSplit`, `ProgrammeHero`, `FormHero`, `ListImageHero`, `ExchangeHero`, `WorkshopHero`, `PeopleCards`, `MockupHero`, `CodeExamplesHero`, `TitleSplitImage`, `DemoHero`, `UtmGeneratorHero` |
| `--fs-hero-m` | clamp(40px, 4vw, 72px) | Contenu dense | `ImageGridHero`, `PollHero`, `WordCloudHero`, `CompareColumnsHero`, `BarChartHero`, `TableHero`, `MediaHero`, `SpreadsheetHero`, `StatRingsHero`, `VideoHero`, `SchemaTriptych` |
| `--fs-term` | clamp(76px, 8vw, 140px) | Spécial | `DefinitionHero` (terme serif) |

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
`--measure-xl` 1280px (intercalaire). Toute description / corps porte un `max-width` = un token
`--measure-*`, jamais une valeur arbitraire.

## Hors scope

Composants **legacy restants** (non importés par les decks, pas encore adoptés : `Default`,
`Title`, `Calendar`, `Conventions`, `AgendaFull`, `AgendaLight`, `Timer`, `IconCatalog`, `Custom`)
ne sont pas migrés : à archiver, pas à harmoniser.

Les autres composants legacy (versions pré-Hero) ont été **supprimés lors du nettoyage 2026-06-09**,
remplacés par leur équivalent Hero : `Cover`, `Section`, `Closing`/`ClosingHero`, `Statement`,
`Quote`, `AboutMe`/`AboutMeBullets`, `Workshop`/`WorkshopBrief`, `Demo`, `Exchange`, `ImageGrid`,
`BigImage`, `TableSlide`/`TwoColumnTable`, `NumberedCards`/`NumberedCardWithDetail`, `Poll`, `WordCloud`.
