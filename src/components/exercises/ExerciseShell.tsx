import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '../../db';
import type { ExerciseConfig, ExerciseType, Session } from '../../db/models';
import { useSession, toTrial, type RecordedTrial } from '../../hooks/useSession';
import { scoreSession } from '../../lib/scoring';
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

  // Persist to Dexie once when exercise completes
  const persistedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'complete' || session === null || persistedRef.current) return;
    persistedRef.current = true;

    const trialRecords = trials.map((t) => toTrial(t, session.id));
    const summary = scoreSession(session.id, trialRecords);

    db.transaction('rw', db.sessions, db.trials, db.sessionSummaries, async () => {
      await db.sessions.put(session);
      await db.trials.bulkPut(trialRecords);
      await db.sessionSummaries.put(summary);
    }).catch((err) => {
      console.error('[ExerciseShell] Failed to persist session:', err);
    });
  }, [phase, session, trials]);

  const phaseVariants = {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
  };

  return (
    <div className="exercise-shell">
      <AnimatePresence mode="wait">
        {phase === 'instructions' && (
          <motion.div
            key="instructions"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="exercise-shell__instructions"
          >
            <p className="exercise-shell__subtitle">{subtitle}</p>
            <h1 className="exercise-shell__title">{title}</h1>
            <ul className="exercise-shell__steps">
              {instructions.map((line, i) => (
                <li key={i} className="exercise-shell__step">
                  {line}
                </li>
              ))}
            </ul>
            <motion.button
              className="exercise-shell__btn"
              onClick={startCountdown}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Begin
            </motion.button>
          </motion.div>
        )}

        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="exercise-shell__countdown"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdownValue}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="exercise-shell__countdown-number"
              >
                {countdownValue}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'run' && (
          <motion.div
            key="run"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="exercise-shell__run"
          >
            {children({ recordTrial, finishRun, config })}
          </motion.div>
        )}

        {phase === 'complete' && session && (
          <motion.div
            key="complete"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CompleteView
              session={session}
              trials={trials}
              onComplete={onComplete}
              onReplay={() => {
                persistedRef.current = false;
                reset();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
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

  const statsContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  };
  const statItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="exercise-shell__complete">
      <h2 className="exercise-shell__complete-title">Session Complete</h2>
      <motion.div
        className="exercise-shell__stats"
        variants={statsContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={statItem}><Stat label="Accuracy" value={`${accuracy}%`} /></motion.div>
        <motion.div variants={statItem}><Stat label="Hits" value={hits} /></motion.div>
        <motion.div variants={statItem}><Stat label="Misses" value={misses} /></motion.div>
        <motion.div variants={statItem}><Stat label="False Alarms" value={falseAlarms} /></motion.div>
        <motion.div variants={statItem}><Stat label="Correct Rejections" value={correctRejections} /></motion.div>
        <motion.div variants={statItem}><Stat label="Trials" value={total} /></motion.div>
      </motion.div>
      <div className="exercise-shell__complete-actions">
        {onComplete && (
          <motion.button
            className="exercise-shell__btn"
            onClick={() => onComplete(session, trials)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            View Full Results
          </motion.button>
        )}
        <motion.button
          className="exercise-shell__btn exercise-shell__btn--secondary"
          onClick={onReplay}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Try Again
        </motion.button>
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
