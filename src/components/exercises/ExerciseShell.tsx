import type { ReactNode } from 'react';
import type { ExerciseConfig, ExerciseType, Session } from '../../db/models';
import { useSession, type RecordedTrial } from '../../hooks/useSession';
import './ExerciseShell.css';

export interface ExerciseRunProps {
  recordTrial: (trial: RecordedTrial) => void;
  finishRun: () => void;
  config: ExerciseConfig;
}

interface ExerciseShellProps {
  exerciseType: ExerciseType;
  difficulty: number;
  config: ExerciseConfig;
  title: string;
  /** Transformer framing subtitle */
  subtitle: string;
  instructions: string[];
  children: (props: ExerciseRunProps) => ReactNode;
  onComplete?: (session: Session, trials: RecordedTrial[]) => void;
}

export default function ExerciseShell({
  exerciseType,
  difficulty,
  config,
  title,
  subtitle,
  instructions,
  children,
  onComplete,
}: ExerciseShellProps) {
  const { state, startCountdown, recordTrial, finishRun, reset } = useSession({
    exerciseType,
    difficulty,
    config,
  });

  const { phase, countdownValue, trials, session } = state;

  return (
    <div className="exercise-shell">
      {phase === 'instructions' && (
        <div className="exercise-shell__instructions">
          <p className="exercise-shell__subtitle">{subtitle}</p>
          <h1 className="exercise-shell__title">{title}</h1>
          <ul className="exercise-shell__steps">
            {instructions.map((line, i) => (
              <li key={i} className="exercise-shell__step">
                {line}
              </li>
            ))}
          </ul>
          <button className="exercise-shell__btn" onClick={startCountdown}>
            Begin
          </button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="exercise-shell__countdown" aria-live="polite">
          <span className="exercise-shell__countdown-number">
            {countdownValue}
          </span>
        </div>
      )}

      {phase === 'run' && (
        <div className="exercise-shell__run">
          {children({ recordTrial, finishRun, config })}
        </div>
      )}

      {phase === 'complete' && session && (
        <CompleteView
          session={session}
          trials={trials}
          onComplete={onComplete}
          onReplay={reset}
        />
      )}
    </div>
  );
}

interface CompleteViewProps {
  session: Session;
  trials: RecordedTrial[];
  onComplete?: (session: Session, trials: RecordedTrial[]) => void;
  onReplay: () => void;
}

function CompleteView({ session, trials, onComplete, onReplay }: CompleteViewProps) {
  const hits = trials.filter((t) => t.isTarget && t.responded).length;
  const misses = trials.filter((t) => t.isTarget && !t.responded).length;
  const falseAlarms = trials.filter((t) => !t.isTarget && t.responded).length;
  const correctRejections = trials.filter((t) => !t.isTarget && !t.responded).length;
  const total = trials.length;
  const accuracy = total > 0 ? Math.round(((hits + correctRejections) / total) * 100) : 0;

  return (
    <div className="exercise-shell__complete">
      <h2 className="exercise-shell__complete-title">Session Complete</h2>
      <div className="exercise-shell__stats">
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Hits" value={hits} />
        <Stat label="Misses" value={misses} />
        <Stat label="False Alarms" value={falseAlarms} />
        <Stat label="Correct Rejections" value={correctRejections} />
        <Stat label="Trials" value={total} />
      </div>
      <div className="exercise-shell__complete-actions">
        {onComplete && (
          <button
            className="exercise-shell__btn"
            onClick={() => onComplete(session, trials)}
          >
            View Full Results
          </button>
        )}
        <button
          className="exercise-shell__btn exercise-shell__btn--secondary"
          onClick={onReplay}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="exercise-shell__stat">
      <span className="exercise-shell__stat-value">{value}</span>
      <span className="exercise-shell__stat-label">{label}</span>
    </div>
  );
}
