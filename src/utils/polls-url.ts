// src/utils/polls-url.ts
// URL du worker lm-polls, source unique (était dupliquée en dur dans Deck.astro,
// presenter.astro et v/[token].astro). `import.meta.env.PUBLIC_*` est inliné par
// Vite à la compilation, y compris dans les scripts client (modules) qui importent
// cette constante. Configurable via PUBLIC_LM_POLLS_URL (cf. .env.example).
export const LM_POLLS_URL =
  import.meta.env.PUBLIC_LM_POLLS_URL || 'https://lm-polls.hello-cb2.workers.dev';
