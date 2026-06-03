# Sondages live (Poll / WordCloud)

Deux composants slides : `<Poll>` (QCM) et `<WordCloud>` (nuage de mots).

```mdx
<Poll
  id="vote-clarte"
  question="Cette session t'a paru ?"
  options={["Très claire", "Claire", "Confuse"]}
/>

<WordCloud
  id="mots-cles"
  question="Un mot pour résumer ?"
/>
```

Le présentateur clique "Démarrer le sondage" sur la slide, un QR + URL courte apparaissent. Les participants scannent et votent. Le graphique se rafraîchit toutes les 1.5s (max ~1.7s de latence).

Boutons sur la slide :
- **Démarrer** : initialise une session (génère token court 6 chars)
- **Figer** : verrouille les votes, snapshot persistant dans Cloudflare KV
- **Reset** : remet à zéro sans changer le token

Workflow détaillé et architecture : `docs/superpowers/specs/2026-05-21-live-polls-design.md`.

Variable d'env requise : `PUBLIC_LM_POLLS_URL` (URL du worker `lm-polls`), à configurer dans `.env.local` et dans Cloudflare Pages env vars.
