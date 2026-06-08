# Conventions de contenu

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

## Contenu des slides

- Pas de tirets cadratins ni demi-cadratins dans les contenus de slides (deux-points, virgules, parenthèses).
- Français suisse pour les nombres : `2'250 CHF`.
- Devise CHF par défaut.
- Pas d'emojis dans les slides.

## Titres SEO (RÈGLE)

Séparateur de titre unique : la **barre verticale `|`** (jamais `:`, `-`, `–`, `—`).

Format : `{Titre de la page} | Lausanne Marketing`.

- Parcours : `CRM, Data & Automation | Lausanne Marketing`
- Deck : `{titre du deck} | Lausanne Marketing`
- Accueil : `Présentations | Lausanne Marketing`
- Handout : `{titre} | Handout {n}up | Lausanne Marketing`

Vaut pour **tous** les `<title>` du site : decks (`Deck.astro`), handout (`Handout.astro`), accueil et pages de base (`Site.astro`), parcours (`parcours/[slug].astro`), présentateur, vote, et le mur d'accès (`functions/_middleware.ts`).

## Nommage

- Composants (modules) en PascalCase, présentations (fichiers MDX) en kebab-case.
