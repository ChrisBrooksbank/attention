import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  generateSelectiveAttention,
  configToSelectiveOptions,
  type StimulusItem,
} from '../../lib/generators';
import { useTimer } from '../../hooks/useTimer';
import ExerciseShell, { type ExerciseRunProps } from './ExerciseShell';
import type { ExerciseConfig } from '../../db/models';
import './SelectiveAttention.css';

// Default config values used when the caller omits fields
const DEFAULTS = {
  targetLetter: 'X',
  stimulusDurationMs: 500,
  interStimulusMs: 400,
  totalTrials: 60,
};

interface SelectiveAttentionRunProps extends ExerciseRunProps {
  difficulty: number;
}

function SelectiveAttentionRun({
  recordTrial,
  finishRun,
  config,
  difficulty,
}: SelectiveAttentionRunProps) {
  const targetLetter = config.targetLetter ?? DEFAULTS.targetLetter;
  const stimulusDurationMs = config.stimulusDurationMs ?? DEFAULTS.stimulusDurationMs;
  const interStimulusMs = config.interStimulusMs ?? DEFAULTS.interStimulusMs;

  // Generate stimulus sequence once using useState lazy initializer (avoids impure call during render)
  const [stimuli] = useState<StimulusItem[]>(() =>
    generateSelectiveAttention(configToSelectiveOptions(config, difficulty, Date.now())),
  );

  // Track which stimuli have already had a trial recorded to avoid duplicates
  const recordedRef = useRef<Set<number>>(new Set());

  // Track whether user pressed during the current stimulus window
  const respondedRef = useRef(false);

  // Visual feedback state
  const [feedback, setFeedback] = useState<'pressed' | null>(null);

  const handleComplete = useCallback(() => {
    finishRun();
  }, [finishRun]);

  const { state, start, recordResponse } = useTimer({
    stimuli,
    stimulusDurationMs,
    interStimulusMs,
    onComplete: handleComplete,
  });

  // Start the timer as soon as this component mounts
  useEffect(() => {
    start();
  }, [start]);

  // When the phase transitions from stimulus → ISI, record the trial result
  useEffect(() => {
    const { currentIndex, phase } = state;
    if (currentIndex < 0) return;
    if (phase !== 'isi') return;
    if (recordedRef.current.has(currentIndex)) return;

    recordedRef.current.add(currentIndex);

    const stimulus = stimuli[currentIndex];
    const responded = respondedRef.current;
    respondedRef.current = false;

    const correct =
      (stimulus.isTarget && responded) || (!stimulus.isTarget && !responded);

    recordTrial({
      stimulus: stimulus.stimulus,
      isTarget: stimulus.isTarget,
      responded,
      reactionTimeMs: null,
      correct,
      timestamp: new Date(),
    });
  }, [state, stimuli, recordTrial]);

  const handlePress = useCallback(() => {
    if (!state.isRunning || state.isComplete) return;

    const rt = recordResponse();
    // Only count a response if we're in the stimulus phase (rt !== null)
    if (rt !== null) {
      respondedRef.current = true;
      setFeedback('pressed');
      setTimeout(() => setFeedback(null), 150);
    }
  }, [state.isRunning, state.isComplete, recordResponse]);

  const currentStimulus =
    state.currentIndex >= 0 ? stimuli[state.currentIndex] : null;
  const showLetter = state.phase === 'stimulus' && currentStimulus !== null;

  const progress = stimuli.length > 0
    ? Math.round(((state.currentIndex + 1) / stimuli.length) * 100)
    : 0;

  return (
    <div
      className="selective-attention"
      aria-label="Selective Attention exercise"
    >
      {/* Screen-reader live region for stimulus announcements (outside button) */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {showLetter ? currentStimulus!.stimulus : ''}
      </div>

      {/* Progress bar */}
      <div className="selective-attention__progress-track" aria-hidden="true">
        <div
          className="selective-attention__progress-fill"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
      </div>

      {/* Target reminder */}
      <p className="selective-attention__reminder">
        Press when you see <strong>{targetLetter}</strong>
      </p>

      {/* Stimulus display */}
      <button
        className={[
          'selective-attention__stimulus-area',
          showLetter ? 'selective-attention__stimulus-area--active' : '',
          feedback === 'pressed' ? 'selective-attention__stimulus-area--pressed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handlePress}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            handlePress();
          }
        }}
        aria-label="Respond to target stimulus"
      >
        <AnimatePresence mode="wait">
          {showLetter && (
            <motion.span
              key={state.currentIndex}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.07 }}
              className="selective-attention__letter"
              aria-hidden="true"
            >
              {currentStimulus!.stimulus}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

interface SelectiveAttentionProps {
  difficulty?: number;
  config?: ExerciseConfig;
}

export default function SelectiveAttention({
  difficulty = 1,
  config = {},
}: SelectiveAttentionProps) {
  const resolvedConfig: ExerciseConfig = {
    targetLetter: DEFAULTS.targetLetter,
    stimulusDurationMs: DEFAULTS.stimulusDurationMs,
    interStimulusMs: DEFAULTS.interStimulusMs,
    totalTrials: DEFAULTS.totalTrials,
    ...config,
  };

  return (
    <ExerciseShell
      exerciseType="selective"
      difficulty={difficulty}
      config={resolvedConfig}
      title="Selective Attention"
      subtitle="Query-Key Matching"
      instructions={[
        `Watch the stream of letters carefully.`,
        `Press the button (or tap the screen) whenever you see the letter ${resolvedConfig.targetLetter}.`,
        `Ignore all other letters — responding to them counts as a false alarm.`,
        `Stay focused. The letters appear quickly!`,
      ]}
    >
      {(props) => (
        <SelectiveAttentionRun
          {...props}
          difficulty={difficulty}
        />
      )}
    </ExerciseShell>
  );
}
