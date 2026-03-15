import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { StimulusItem } from '../lib/generators';

export type StimulusPhase = 'stimulus' | 'isi';

export interface TimerState {
  /** Index into the stimuli array currently displayed (-1 = not started) */
  currentIndex: number;
  /** Whether we're actively showing a stimulus or in the inter-stimulus interval */
  phase: StimulusPhase;
  isRunning: boolean;
  isComplete: boolean;
}

export interface UseTimerOptions {
  stimuli: StimulusItem[];
  /** How long each stimulus is shown, in ms */
  stimulusDurationMs: number;
  /** Blank gap between stimuli, in ms */
  interStimulusMs: number;
  /** Called once after the last stimulus finishes */
  onComplete: () => void;
}

export interface UseTimerReturn {
  state: TimerState;
  /** Begin advancing through the stimulus sequence */
  start: () => void;
  /**
   * Record a user response at the current moment.
   * Returns reaction time in ms if called during a stimulus phase,
   * or null if no stimulus is currently displayed.
   */
  recordResponse: () => number | null;
}

/**
 * Precise stimulus timing hook for cognitive exercises.
 *
 * Uses performance.now() for sub-millisecond timestamps and chained
 * setTimeout calls (rather than setInterval) to avoid timer drift.
 *
 * Flow: ISI → stimulus (stimulusDurationMs) → ISI (interStimulusMs) → next stimulus → …
 */
export function useTimer({
  stimuli,
  stimulusDurationMs,
  interStimulusMs,
  onComplete,
}: UseTimerOptions): UseTimerReturn {
  const [state, setState] = useState<TimerState>({
    currentIndex: -1,
    phase: 'isi',
    isRunning: false,
    isComplete: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stimulusStartTimeRef = useRef<number | null>(null);

  // Mutable refs so timeout callbacks always read the latest props/callbacks
  const onCompleteRef = useRef(onComplete);
  const stimuliRef = useRef(stimuli);
  const stimulusDurationRef = useRef(stimulusDurationMs);
  const interStimulusRef = useRef(interStimulusMs);

  // Forward ref to break circular dependency: scheduleStimulus → ISI → scheduleStimulus
  const scheduleRef = useRef<(index: number) => void>(() => {});

  // Keep all refs current after every render (useLayoutEffect = synchronous, before paint)
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
    stimuliRef.current = stimuli;
    stimulusDurationRef.current = stimulusDurationMs;
    interStimulusRef.current = interStimulusMs;
  });

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleStimulus = useCallback(
    (index: number) => {
      if (index >= stimuliRef.current.length) {
        // All stimuli shown — mark complete
        stimulusStartTimeRef.current = null;
        setState((prev) => ({
          ...prev,
          isRunning: false,
          isComplete: true,
          phase: 'isi',
        }));
        onCompleteRef.current();
        return;
      }

      // Show stimulus
      stimulusStartTimeRef.current = performance.now();
      setState((prev) => ({
        ...prev,
        currentIndex: index,
        phase: 'stimulus',
      }));

      // After stimulusDuration → enter ISI
      timeoutRef.current = setTimeout(() => {
        stimulusStartTimeRef.current = null;
        setState((prev) => ({ ...prev, phase: 'isi' }));

        // After ISI → next stimulus
        timeoutRef.current = setTimeout(() => {
          scheduleRef.current(index + 1);
        }, interStimulusRef.current);
      }, stimulusDurationRef.current);
    },
    [], // reads everything through refs; no external deps needed
  );

  // Keep scheduleRef current after scheduleStimulus is (re-)created
  useLayoutEffect(() => {
    scheduleRef.current = scheduleStimulus;
  });

  const start = useCallback(() => {
    clearPending();
    stimulusStartTimeRef.current = null;
    setState({
      currentIndex: -1,
      phase: 'isi',
      isRunning: true,
      isComplete: false,
    });

    // Initial ISI before first stimulus
    timeoutRef.current = setTimeout(() => {
      scheduleRef.current(0);
    }, interStimulusRef.current);
  }, [clearPending]);

  const recordResponse = useCallback((): number | null => {
    const startTime = stimulusStartTimeRef.current;
    if (startTime === null) return null;
    return performance.now() - startTime;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => clearPending();
  }, [clearPending]);

  return { state, start, recordResponse };
}
