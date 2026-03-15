import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { db } from '../db'
import { scoreSession } from '../lib/scoring'
import type { SessionSummary, Trial } from '../db/models'
import './Results.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

// ── helpers ──────────────────────────────────────────────────────────────────

type Outcome = 'hit' | 'miss' | 'false-alarm' | 'correct-rejection'

function trialOutcome(trial: Trial): Outcome {
  if (trial.isTarget && trial.responded) return 'hit'
  if (trial.isTarget && !trial.responded) return 'miss'
  if (!trial.isTarget && trial.responded) return 'false-alarm'
  return 'correct-rejection'
}

const EXERCISE_LABEL: Record<string, string> = {
  selective: 'Selective Attention',
  sustained: 'Sustained Attention',
  nback: 'N-Back',
}

// ── sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  delta,
  deltaPositive,
}: {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
}) {
  return (
    <div className="metric-card">
      <span className="metric-card__value">{value}</span>
      <span className="metric-card__label">{label}</span>
      {delta !== undefined && deltaPositive !== undefined && (
        <span
          className={`metric-card__delta ${deltaPositive ? 'metric-card__delta--up' : 'metric-card__delta--down'}`}
        >
          {delta} vs prev
        </span>
      )}
    </div>
  )
}

function CountCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'success' | 'error' | 'warning' | 'neutral'
}) {
  return (
    <div className={`count-card count-card--${color}`}>
      <span className="count-card__value">{value}</span>
      <span className="count-card__label">{label}</span>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Results() {
  const { sessionId } = useParams<{ sessionId: string }>()

  const session = useLiveQuery(async () => {
    if (!sessionId) return null
    const s = await db.sessions.get(sessionId)
    return s ?? null
  }, [sessionId])

  const trials = useLiveQuery(
    async (): Promise<Trial[]> =>
      sessionId
        ? db.trials.where('sessionId').equals(sessionId).toArray()
        : [],
    [sessionId],
    [] as Trial[],
  )

  const storedSummary = useLiveQuery(async () => {
    if (!sessionId) return null
    const s = await db.sessionSummaries.get(sessionId)
    return s ?? null
  }, [sessionId])

  // Previous session of the same exercise type + its summary
  const prevData = useLiveQuery(async (): Promise<SessionSummary | null> => {
    if (!session) return null
    const all = await db.sessions
      .where('exerciseType')
      .equals(session.exerciseType)
      .toArray()
    const sorted = all
      .filter((s) => s.id !== session.id)
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      )
    const prev = sorted[0]
    if (!prev) return null
    const prevSum = await db.sessionSummaries.get(prev.id)
    return prevSum ?? null
  }, [session])

  // ── loading / not-found guards ──────────────────────────────────────────────

  if (session === undefined) {
    return (
      <div className="results-page">
        <p className="results-page__loading">Loading…</p>
      </div>
    )
  }

  if (session === null) {
    return (
      <div className="results-page">
        <div className="results-page__empty">
          <p>Session not found.</p>
          <Link to="/train" className="results-page__btn">
            Back to Train
          </Link>
        </div>
      </div>
    )
  }

  // ── compute summary ─────────────────────────────────────────────────────────

  const summary: SessionSummary =
    storedSummary ?? scoreSession(session.id, trials)

  const accuracyPct = Math.round(summary.accuracy * 100)
  const dPrimeStr = summary.dPrime.toFixed(2)
  const meanRTStr =
    summary.meanReactionMs > 0 ? `${Math.round(summary.meanReactionMs)} ms` : '—'
  const medianRTStr =
    summary.medianReactionMs > 0
      ? `${Math.round(summary.medianReactionMs)} ms`
      : '—'

  // Deltas vs previous session
  const prevAccuracyPct = prevData ? Math.round(prevData.accuracy * 100) : null
  const accuracyDelta =
    prevAccuracyPct !== null ? accuracyPct - prevAccuracyPct : null
  const dPrimeDelta =
    prevData !== null && prevData !== undefined
      ? summary.dPrime - prevData.dPrime
      : null

  const sessionDate = new Date(session.completedAt).toLocaleDateString(
    undefined,
    { dateStyle: 'medium' },
  )

  return (
    <div className="results-page">
      <motion.div
        className="results-page__inner"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.header className="results-page__header" variants={sectionVariants}>
          <p className="results-page__type">
            {EXERCISE_LABEL[session.exerciseType] ?? session.exerciseType}
          </p>
          <h1 className="results-page__title">Session Results</h1>
          <p className="results-page__meta">
            {sessionDate} · Difficulty {session.difficulty} · {trials.length}{' '}
            trials
          </p>
        </motion.header>

        {/* Attention weight strip */}
        <motion.section className="results-page__section" variants={sectionVariants}>
          <h2 className="results-page__section-title">Attention Weights</h2>
          <p className="results-page__section-desc">
            Trial-by-trial attention alignment — each cell represents one
            stimulus
          </p>
          <div
            className="attention-strip"
            aria-label="Trial-by-trial performance strip"
            role="img"
          >
            {trials.map((trial, i) => {
              const outcome = trialOutcome(trial)
              return (
                <div
                  key={trial.id}
                  className={`attention-strip__cell attention-strip__cell--${outcome}`}
                  title={`Trial ${i + 1}: ${outcome.replace(/-/g, ' ')} — stimulus "${trial.stimulus}"`}
                  aria-label={`Trial ${i + 1}: ${outcome.replace(/-/g, ' ')}`}
                />
              )
            })}
          </div>
          <div className="attention-strip__legend" aria-label="Strip legend">
            <span className="legend-item legend-item--hit">Hit</span>
            <span className="legend-item legend-item--miss">Miss</span>
            <span className="legend-item legend-item--false-alarm">
              False Alarm
            </span>
            <span className="legend-item legend-item--correct-rejection">
              Correct Rejection
            </span>
          </div>
        </motion.section>

        {/* Performance metrics */}
        <motion.section className="results-page__section" variants={sectionVariants}>
          <h2 className="results-page__section-title">Performance Metrics</h2>
          <div className="results-metrics">
            <MetricCard
              label="Accuracy"
              value={`${accuracyPct}%`}
              delta={
                accuracyDelta !== null
                  ? `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta}%`
                  : undefined
              }
              deltaPositive={accuracyDelta !== null ? accuracyDelta >= 0 : undefined}
            />
            <MetricCard
              label="d′ Sensitivity"
              value={dPrimeStr}
              delta={
                dPrimeDelta !== null
                  ? `${dPrimeDelta >= 0 ? '+' : ''}${dPrimeDelta.toFixed(2)}`
                  : undefined
              }
              deltaPositive={dPrimeDelta !== null ? dPrimeDelta >= 0 : undefined}
            />
            <MetricCard label="Mean RT" value={meanRTStr} />
            <MetricCard label="Median RT" value={medianRTStr} />
          </div>
        </motion.section>

        {/* Trial breakdown */}
        <motion.section className="results-page__section" variants={sectionVariants}>
          <h2 className="results-page__section-title">Trial Breakdown</h2>
          <div className="results-counts">
            <CountCard label="Hits" value={summary.hits} color="success" />
            <CountCard label="Misses" value={summary.misses} color="error" />
            <CountCard
              label="False Alarms"
              value={summary.falseAlarms}
              color="warning"
            />
            <CountCard
              label="Correct Rejections"
              value={summary.correctRejections}
              color="neutral"
            />
          </div>
        </motion.section>

        {/* Actions */}
        <motion.div className="results-page__actions" variants={sectionVariants}>
          <Link
            to={`/session/${session.exerciseType}`}
            className="results-page__btn"
          >
            Try Again
          </Link>
          <Link
            to="/train"
            className="results-page__btn results-page__btn--secondary"
          >
            Back to Train
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
