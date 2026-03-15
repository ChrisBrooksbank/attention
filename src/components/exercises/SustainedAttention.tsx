import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateSustainedAttention,
  configToSustainedOptions,
  type StimulusItem,
} from '../../lib/generators';
import { useTimer } from '../../hooks/useTimer';
import ExerciseShell, { type ExerciseRunProps } from './ExerciseShell';
import type { ExerciseConfig } from '../../db/models';
import './SustainedAttention.css';

// Default config values used when the caller omits fields
const DEFAULTS = {
  targetDigit: '3',
  stimulusDurationMs: 250,
  interStimulusMs: 900,
  totalTrials: 150,
};

interface SustainedAttentionRunProps extends ExerciseRunProps {
  difficulty: number;
}

function SustainedAttentionRun({
  recordTrial,
  finishRun,
  config,
  difficulty,
}: SustainedAttentionRunProps) {
  const targetDigit = config.targetLetter ?? DEFAULTS.targetDigit;
  const stimulusDurationMs = config.stimulusDurationMs ?? DEFAULTS.stimulusDurationMs;
  const interStimulusMs = config.interStimulusMs ?? DEFAULTS.interStimulusMs;

  // Generate stimulus sequence once using useState lazy initializer
  const [stimuli] = useState<StimulusItem[]>(() =>
    generateSustainedAttention(configToSustainedOptions(config, difficulty, Date.now())),
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
  const showDigit = state.phase === 'stimulus' && currentStimulus !== null;

  const progress =
    stimuli.length > 0
      ? Math.round(((state.currentIndex + 1) / stimuli.length) * 100)
      : 0;

  return (
    <div
      className="sustained-attention"
      role="main"
      aria-label="Sustained Attention exercise"
    >
      {/* Progress bar */}
      <div className="sustained-attention__progress-track" aria-hidden="true">
        <div
          className="sustained-attention__progress-fill"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
      </div>

      {/* Target reminder */}
      <p className="sustained-attention__reminder">
        Press only when you see <strong>{targetDigit}</strong>
      </p>

      {/* Stimulus display */}
      <button
        className={[
          'sustained-attention__stimulus-area',
          showDigit ? 'sustained-attention__stimulus-area--active' : '',
          feedback === 'pressed' ? 'sustained-attention__stimulus-area--pressed' : '',
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
        aria-label={
          showDigit
            ? `Stimulus: ${currentStimulus!.stimulus}`
            : 'Waiting for stimulus'
        }
      >
        <span className="sustained-attention__digit" aria-live="assertive">
          {showDigit ? currentStimulus!.stimulus : ''}
        </span>
      </button>
    </div>
  );
}

interface SustainedAttentionProps {
  difficulty?: number;
  config?: ExerciseConfig;
}

export default function SustainedAttention({
  difficulty = 1,
  config = {},
}: SustainedAttentionProps) {
  const resolvedConfig: ExerciseConfig = {
    targetLetter: DEFAULTS.targetDigit,
    stimulusDurationMs: DEFAULTS.stimulusDurationMs,
    interStimulusMs: DEFAULTS.interStimulusMs,
    totalTrials: DEFAULTS.totalTrials,
    ...config,
  };

  const targetDigit = resolvedConfig.targetLetter ?? DEFAULTS.targetDigit;

  return (
    <ExerciseShell
      exerciseType="sustained"
      difficulty={difficulty}
      config={resolvedConfig}
      title="Sustained Attention"
      subtitle="Query Stabilization"
      instructions={[
        `A stream of digits will appear one at a time.`,
        `Press the button (or tap the screen) only when you see the digit ${targetDigit}.`,
        `Most digits are non-targets — respond only to ${targetDigit}.`,
        `Stay alert: targets are rare and the sequence is long.`,
      ]}
    >
      {(props) => (
        <SustainedAttentionRun
          {...props}
          difficulty={difficulty}
        />
      )}
    </ExerciseShell>
  );
}
