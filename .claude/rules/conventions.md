# Conventions de contenu

## RÈGLE ABSOLUE : UTF-8

Toujours écrire en UTF-8 avec accents complets : é, è, ê, ë, à, â, ù, û, ç, î, ï, ô.

## Contenu des slides

- Pas de tirets cadratins ni demi-cadratins dans les contenus de slides (deux-points, virgules, parenthèses).
- Français suisse pour les nombres : `2'250 CHF`.
- Devise CHF par défaut.
- Pas d'emojis dans les slides.

## RÈGLE ABSOLUE : guillemets français « » avec espace insécable

⚠️ À l'intérieur d'une paire de guillemets français, l'espace entre `«` et le texte ET entre le texte et `»` est **TOUJOURS une espace insécable** (U+00A0). JAMAIS une espace normale.

**Pourquoi** : avec une espace normale, le saut de ligne peut tomber juste après `«` ou juste avant `»`, qui se retrouve alors **seul en fin ou en début de ligne** (orphelin, repéré immédiatement). L'espace insécable rend ce saut impossible : le guillemet reste collé à son texte.

- **Interdit** : `« texte »` (espaces normales U+0020).
- **Correct** : `«` + espace insécable + `texte` + espace insécable + `»` (U+00A0, pas U+0020).
- S'applique à **tout texte rendu** d'un slide : titres, sous-titres, corps, items, valeurs de cards, légendes, questions et options de sondage. (Pas les commentaires de code, non rendus.)
- **Contrôle** d'un deck : aucun `«` suivi d'une espace normale, aucun `»` précédé d'une espace normale.
- **Balayage complet des decks fait le 2026-06-13** (30 corrections). Re-balayage : script Node sur les `.mdx` de `src/content/presentations/`, `s.replace(/«[ ]+/g, "« ").replace(/[ ]+»/g, " »")`.

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
