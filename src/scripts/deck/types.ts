// src/scripts/deck/types.ts
// Types partages entre les modules deck/. Tout ce qui touche aux sondages live
// et a l'API du worker lm-polls vit ici.

export type PollType = 'choice' | 'word';

export type PollSlideState = {
  type: PollType;
  question: string;
  options?: string[];
  pollId: string;
  token: string | null;
  pollingTimer: number | null;
  section: HTMLElement;
  lastWordCloudKey?: string;
  // shouldBePolling: intent du présentateur (Démarrer = true, Figer = false).
  // pollingTimer: l'intervalle actif ou null s'il est suspendu (slide pas en
  // avant-plan, ou tab hidden). syncPolling() réconcilie l'un avec l'autre.
  shouldBePolling: boolean;
};

export type PollInitBody = {
  deckSlug: string;
  pollId: string;
  type: PollType;
  question: string;
  options?: string[];
  /** Thème du parcours (transmis au worker pour thémer la page de vote). */
  scheme?: 'lm' | 'execed';
};

export type PollInitResponse = {
  token: string;
};

export type PollResultsResponse = {
  votes: Record<string, number>;
  total: number;
  frozen: boolean;
};

export type PollSnapshotResponse = {
  votes: Record<string, number>;
};

export type PollState = 'initial' | 'live' | 'frozen' | 'archived';

// Réponse de GET /api/poll/{token}/info, consommée par la page de vote
// publique (src/pages/v/[token].astro).
export type PollPublicInfo = {
  type: PollType;
  question: string;
  options?: string[];
  /** Thème du parcours, posé à l'init par le deck. Permet à la page de vote de
      s'afficher dans le thème même quand l'URL est tapée sans ?s=. */
  scheme?: 'lm' | 'execed';
};
