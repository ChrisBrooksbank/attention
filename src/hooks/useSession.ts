import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import type { ExerciseConfig, ExerciseType, Session, Trial } from '../db/models';

export type SessionPhase = 'instructions' | 'countdown' | 'run' | 'complete';

export interface RecordedTrial {
  stimulus: string;
  isTarget: boolean;
  responded: boolean;
  reactionTimeMs: number | null;
  correct: boolean;
  timestamp: Date;
}

export interface SessionState {
  phase: SessionPhase;
  /** Countdown value: 3, 2, 1 (null when not counting down) */
  countdownValue: number | null;
  trials: RecordedTrial[];
  /** Populated once phase === 'complete' */
  session: Session | null;
}

export interface UseSessionOptions {
  exerciseType: ExerciseType;
  difficulty: number;
  config: ExerciseConfig;
}

export interface UseSessionReturn {
  state: SessionState;
  /** Move from instructions to countdown */
  startCountdown: () => void;
  /**
   * Record a trial result during the run phase.
   * Call once per stimulus after the stimulus completes.
   */
  recordTrial: (trial: RecordedTrial) => void;
  /** Signal that all stimuli have been presented; transitions to complete */
  finishRun: () => void;
  /** Reset back to instructions (e.g. for replay) */
  reset: () => void;
}

const COUNTDOWN_START = 3;
const COUNTDOWN_INTERVAL_MS = 1000;

function makeInitialState(): SessionState {
  return {
    phase: 'instructions',
    countdownValue: null,
    trials: [],
    session: null,
  };
}

/**
 * Session lifecycle hook.
 *
 * Manages the instructions → countdown → run → complete flow.
 * Does NOT handle stimulus timing (that's useTimer's job).
 * Does NOT persist to Dexie (ExerciseShell does that after completion).
 */
export function useSession({
  exerciseType,
  difficulty,
  config,
}: UseSessionOptions): UseSessionReturn {
  const [state, setState] = useState<SessionState>(makeInitialState);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const sessionIdRef = useRef<string>(nanoid());

  // Config refs so callbacks always read the latest values
  const exerciseTypeRef = useRef(exerciseType);
  const difficultyRef = useRef(difficulty);
  const configRef = useRef(config);
  useEffect(() => {
    exerciseTypeRef.current = exerciseType;
    difficultyRef.current = difficulty;
    configRef.current = config;
  });

  const clearCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdown();
    startedAtRef.current = null;

    setState((prev) => ({
      ...prev,
      phase: 'countdown',
      countdownValue: COUNTDOWN_START,
      trials: [],
      session: null,
    }));

    let remaining = COUNTDOWN_START;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearCountdown();
        startedAtRef.current = new Date();
        setState((prev) => ({
          ...prev,
          phase: 'run',
          countdownValue: null,
        }));
      } else {
        setState((prev) => ({ ...prev, countdownValue: remaining }));
      }
    }, COUNTDOWN_INTERVAL_MS);
  }, [clearCountdown]);

  const recordTrial = useCallback((trial: RecordedTrial) => {
    setState((prev) => ({
      ...prev,
      trials: [...prev.trials, trial],
    }));
  }, []);

  const finishRun = useCallback(() => {
    const completedAt = new Date();
    const startedAt = startedAtRef.current ?? completedAt;

    const session: Session = {
      id: sessionIdRef.current,
      exerciseType: exerciseTypeRef.current,
      startedAt,
      completedAt,
      difficulty: difficultyRef.current,
      config: configRef.current,
    };

    setState((prev) => ({
      ...prev,
      phase: 'complete',
      session,
    }));
  }, []);

  const reset = useCallback(() => {
    clearCountdown();
    sessionIdRef.current = nanoid();
    startedAtRef.current = null;
    setState(makeInitialState());
  }, [clearCountdown]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearCountdown();
  }, [clearCountdown]);

  return { state, startCountdown, recordTrial, finishRun, reset };
}

/**
 * Convert a RecordedTrial to a persisted Trial record.
 */
export function toTrial(recorded: RecordedTrial, sessionId: string): Trial {
  return {
    id: nanoid(),
    sessionId,
    stimulus: recorded.stimulus,
    isTarget: recorded.isTarget,
    responded: recorded.responded,
    reactionTimeMs: recorded.reactionTimeMs,
    correct: recorded.correct,
    timestamp: recorded.timestamp,
  };
}
