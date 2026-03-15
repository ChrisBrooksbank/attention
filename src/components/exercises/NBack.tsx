import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateNBack,
  configToNBackOptions,
  type NBackItem,
} from '../../lib/generators';
import { useTimer } from '../../hooks/useTimer';
import ExerciseShell, { type ExerciseRunProps } from './ExerciseShell';
import type { ExerciseConfig } from '../../db/models';
import './NBack.css';

// Default config values used when the caller omits fields
const DEFAULTS = {
  nLevel: 1,
  stimulusDurationMs: 2000,
  interStimulusMs: 500,
  totalTrials: 24,
};

interface NBackRunProps extends ExerciseRunProps {
  difficulty: number;
}

function NBackRun({ recordTrial, finishRun, config, difficulty }: NBackRunProps) {
  const nLevel = config.nLevel ?? DEFAULTS.nLevel;
  const stimulusDurationMs = config.stimulusDurationMs ?? DEFAULTS.stimulusDurationMs;
  const interStimulusMs = config.interStimulusMs ?? DEFAULTS.interStimulusMs;

  // Generate stimulus sequence once using useState lazy initializer
  const [stimuli] = useState<NBackItem[]>(() =>
    generateNBack(configToNBackOptions(config, difficulty, Date.now())),
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

  const progress =
    stimuli.length > 0
      ? Math.round(((state.currentIndex + 1) / stimuli.length) * 100)
      : 0;

  // Determine if current position is a seed item (cannot be a target)
  const isSeedItem =
    state.currentIndex >= 0 && state.currentIndex < nLevel;

  return (
    <div className="nback" role="main" aria-label={`${nLevel}-Back exercise`}>
      {/* Progress bar */}
      <div className="nback__progress-track" aria-hidden="true">
        <div
          className="nback__progress-fill"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
      </div>

      {/* Target reminder */}
      <p className="nback__reminder">
        Press when current letter matches{' '}
        <strong>
          {nLevel} step{nLevel !== 1 ? 's' : ''} ago
        </strong>
      </p>

      {/* Stimulus area */}
      <button
        className={[
          'nback__stimulus-area',
          showLetter ? 'nback__stimulus-area--active' : '',
          feedback === 'pressed' ? 'nback__stimulus-area--pressed' : '',
          isSeedItem ? 'nback__stimulus-area--seed' : '',
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
          showLetter
            ? `Stimulus: ${currentStimulus!.stimulus}`
            : 'Waiting for stimulus'
        }
      >
        <span className="nback__letter" aria-live="assertive">
          {showLetter ? currentStimulus!.stimulus : ''}
        </span>
      </button>

      {/* N-level badge */}
      <div className="nback__level-badge" aria-label={`${nLevel}-back level`}>
        {nLevel}-back
      </div>
    </div>
  );
}

interface NBackProps {
  difficulty?: number;
  config?: ExerciseConfig;
}

export default function NBack({ difficulty = 1, config = {} }: NBackProps) {
  const resolvedConfig: ExerciseConfig = {
    nLevel: DEFAULTS.nLevel,
    stimulusDurationMs: DEFAULTS.stimulusDurationMs,
    interStimulusMs: DEFAULTS.interStimulusMs,
    totalTrials: DEFAULTS.totalTrials,
    ...config,
  };

  const nLevel = resolvedConfig.nLevel!;

  return (
    <ExerciseShell
      exerciseType="nback"
      difficulty={difficulty}
      config={resolvedConfig}
      title={`${nLevel}-Back`}
      subtitle="Value Retention"
      instructions={[
        `Letters will appear one at a time.`,
        `Press the button when the current letter matches the letter shown ${nLevel} step${nLevel !== 1 ? 's' : ''} ago.`,
        `The first ${nLevel} letter${nLevel !== 1 ? 's' : ''} are seed items — no response needed.`,
        `Stay focused — this tests your working memory!`,
      ]}
    >
      {(props) => <NBackRun {...props} difficulty={difficulty} />}
    </ExerciseShell>
  );
}
