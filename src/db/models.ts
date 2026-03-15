export type ExerciseType = 'selective' | 'sustained' | 'nback';

export interface ExerciseConfig {
  targetLetter?: string;       // selective: letter to watch for
  targetRate?: number;         // sustained: fraction of trials that are targets (e.g. 0.1)
  nLevel?: number;             // nback: n value (1, 2, 3, …)
  stimulusDurationMs?: number; // how long each stimulus is shown
  interStimulusMs?: number;    // gap between stimuli
  totalTrials?: number;        // number of trials in the session
}

export interface Session {
  id: string;
  exerciseType: ExerciseType;
  startedAt: Date;
  completedAt: Date;
  difficulty: number;          // 1–10 scale
  config: ExerciseConfig;
}

export interface Trial {
  id: string;
  sessionId: string;           // FK -> Session
  stimulus: string;            // what was shown
  isTarget: boolean;           // should user have responded?
  responded: boolean;          // did user respond?
  reactionTimeMs: number | null;
  correct: boolean;
  timestamp: Date;
}

export interface SessionSummary {
  sessionId: string;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;            // (hits + correctRejections) / total
  dPrime: number;              // signal detection sensitivity
  meanReactionMs: number;
  medianReactionMs: number;
}
