---
name: creer-slide
description: Use when authoring or adding a slide to a deck in the lm-presentation repo (Astro + Reveal.js, slides.lausanne.marketing) — requests like "ajoute / crée / rajoute un slide", "nouveau slide", or editing an MDX under src/content/presentations/. Also use when no existing layout fits and a new slide component must be created.
---

# Créer un slide (lm-presentation)

## Overview

Produire un slide juste du premier coup : bon layout, props aux conventions LM, placé au bon endroit, rendu vérifié. Créer un nouveau composant **seulement** si aucun layout existant ne convient.

Deux sources font foi : **les relire avant d'agir, ne jamais les recopier ici** (elles évoluent) :
- `src/content/presentations/template.mdx` : catalogue des layouts (un exemple de props par composant).
- `.claude/CLAUDE.md` (du repo) : RÈGLES ABSOLUES visuelles + conventions de contenu.

## Workflow

### 0. Cadrer (demander vs avancer)
- Clarifier d'abord le **factuel / inconnu** (ex : la liste réelle des modules d'un CAS, FC vs CAS) et le **placement** dans le deck.
- Choix **réversible** (placement, formulation) : prendre un défaut sensé et **le signaler**, sans bloquer.
- **1er souci visuel** : demander un coup d'œil (je ne vois pas le rendu Reveal). Ne pas tâtonner en cascade.

### 1. Choisir le layout
Lire `template.mdx`, puis ce cheatsheet **intention → composant** (les props exactes restent dans `template.mdx`) :

| Intention | Composant |
|-----------|-----------|
| Couverture / titre | `Cover` |
| Présentation intervenant | `About` |
| Agenda du module | `Programme` |
| Programme / liste de modules (avec image) | `ListImage` |
| Liste numérotée 3-5 items | `Steps` |
| 1 à 5 images (grille / image hero) | `ImageGrid` |
| Citation | `Quote` |
| Ouverture de section | `Section` / `SectionSplit` |
| Atelier | `Workshop` |
| Pause | `Pause` |
| Sondage QCM / nuage de mots | `Poll` / `WordCloud` |
| Clôture | `ClosingHero` |

### 2. Remplir les props (conventions)
- Accents FR obligatoires ; pas d'em-dash ni en-dash ; nombres suisses / CHF ; pas d'emoji.
- `italicPart` = **sous-chaîne exacte** du `title` (sinon rien ne s'italise).
- `brand` / `brandSub` cohérents avec le reste du deck.
- Image Unsplash : résoudre la page `unsplash.com/photos/...` vers l'**URL directe** `images.unsplash.com/photo-...` ; recadrer avec `focal` (valeur CSS `object-position`, ex `center 80%`) quand le sujet est coupé ; `alt` en français.
- **Citer une étude** : sources **ultra-quali** uniquement (Gartner, McKinsey, IDC, Forrester, Wavestone/NewVantage, OCDE, institutions officielles, articles à comité de lecture), de préférence **récentes** (moins de 2 ans). Vérifier le chiffre à la source, pas un blog qui le recopie. Afficher la source **en bas à gauche** via le footer `.slide-source` (intégré au prop `source` de `Statement`).

### 3. Insérer
Ajouter l'`import` du composant + poser le slide au bon endroit **narratif** (ex : moi → vous → programme). Garder le bloc d'imports propre.

### 4. Vérifier le rendu
- Réutiliser / lancer `npm run dev` (http://localhost:4321), vérifier HTTP 200 + marqueurs de contenu.
- **Gotcha PowerShell** : `Invoke-WebRequest` décode mal l'UTF-8 → tester avec des **sous-chaînes ASCII** (les accents donnent du mojibake et cassent les regex).
- **Ordre des slides** : vérifier via le **texte de corps** (pas les noms de classes CSS, qu'Astro hoiste en début de document).
- Lire le **log du serveur dev** pour détecter une erreur de compilation MDX.
- **Nouveau visuel / composant** : demander à l'utilisateur de regarder le rendu + proposer des réglages.

### 5. Créer un composant (si aucun layout ne convient)
- Partir du composant Hero **le plus proche** (copier header + fond + conventions).
- Respecter les **RÈGLES ABSOLUES** (cf `.claude/CLAUDE.md`) : header marque + logo LM full-width + border-bottom ; safe area ≥ 48px ; `border-radius: 4px` ; centrage vertical (titre fixe en haut) ; ombres légères.
- Préférer un **prop optionnel non-breaking** (défaut = comportement actuel) plutôt que forker un composant.
- **Ajouter le nouveau layout au catalogue `template.mdx`**, puis l'utiliser (étapes 2-4).

## Common mistakes
- Construire un composant alors qu'un layout existe : d'abord lire `template.mdx`, et demander en cas de doute.
- `italicPart` absent du `title` → aucune italique rendue.
- Vérifier l'ordre des slides via un nom de classe CSS → faux négatif (classes hoistées). Utiliser le texte de corps.
- Tester le rendu avec des mots accentués en PowerShell → faux négatif. Utiliser des sous-chaînes ASCII.
- Coller une URL de page Unsplash au lieu de l'URL image directe.
- Fond incohérent : un composant du catalogue peut traîner un fond différent (ex : `InfoCards` était en crème `#FAF8F3`). Chaque slide à contenu doit être sur le dégradé pearl (RÈGLE « Fond uniforme » du CLAUDE.md) ; seules `Cover` / `ClosingHero` diffèrent.
- Header non conforme : un composant peut avoir oublié le logo LM (ex : `InfoCards`). Vérifier le header RÈGLE ABSOLUE (brand à gauche + logo LM cliquable à droite + border-bottom full-width) sur chaque slide à contenu ; corriger le composant si besoin.
