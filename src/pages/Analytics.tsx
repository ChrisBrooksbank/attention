import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics, type TimeRange, type ExerciseFilter } from '../hooks/useAnalytics'
import type { ExerciseType } from '../db/models'
import './Analytics.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const EXERCISE_LABEL: Record<ExerciseType, string> = {
  selective: 'Selective Attention',
  sustained: 'Sustained Attention',
  nback: 'N-Back',
}

const EXERCISE_SHORT: Record<ExerciseType, string> = {
  selective: 'Selective',
  sustained: 'Sustained',
  nback: 'N-Back',
}

type SortKey = 'date' | 'accuracy' | 'dPrime' | 'rt'
type SortDir = 'asc' | 'desc'

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  timeRange: TimeRange
  exerciseFilter: ExerciseFilter
  sortKey: SortKey
  sortDir: SortDir
  onTimeRange: (v: TimeRange) => void
  onExercise: (v: ExerciseFilter) => void
  onSort: (key: SortKey) => void
}

function FilterBar({
  timeRange,
  exerciseFilter,
  sortKey,
  sortDir,
  onTimeRange,
  onExercise,
  onSort,
}: FilterBarProps) {
  const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'all', label: 'All time' },
  ]

  const EXERCISE_OPTIONS: { value: ExerciseFilter; label: string }[] = [
    { value: 'all', label: 'All types' },
    { value: 'selective', label: 'Selective' },
    { value: 'sustained', label: 'Sustained' },
    { value: 'nback', label: 'N-Back' },
  ]

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'date', label: 'Date' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'dPrime', label: 'd′' },
    { value: 'rt', label: 'Reaction time' },
  ]

  return (
    <div className="analytics-filters">
      <div className="filter-group">
        <span className="filter-group__label">Period</span>
        <div className="filter-chips">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              className={`filter-chip ${timeRange === value ? 'filter-chip--active' : ''}`}
              onClick={() => onTimeRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group__label">Exercise</span>
        <div className="filter-chips">
          {EXERCISE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`filter-chip ${exerciseFilter === value ? 'filter-chip--active' : ''}`}
              onClick={() => onExercise(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group__label">Sort</span>
        <div className="filter-chips">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`filter-chip ${sortKey === value ? 'filter-chip--active' : ''}`}
              onClick={() => onSort(value)}
            >
              {label}
              {sortKey === value && (
                <span className="sort-dir">{sortDir === 'desc' ? ' ↓' : ' ↑'}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  summary,
}: {
  session: { id: string; exerciseType: ExerciseType; startedAt: Date; difficulty: number }
  summary: { accuracy: number; dPrime: number; meanReactionMs: number } | undefined
}) {
  const date = new Date(session.startedAt)
  const dateStr = date.toLocaleDateString(undefined, { dateStyle: 'medium' })
  const timeStr = date.toLocaleTimeString(undefined, { timeStyle: 'short' })

  const accuracyStr = summary ? `${Math.round(summary.accuracy * 100)}%` : '—'
  const dPrimeStr = summary ? summary.dPrime.toFixed(2) : '—'
  const rtStr =
    summary && summary.meanReactionMs > 0
      ? `${Math.round(summary.meanReactionMs)} ms`
      : '—'

  return (
    <Link to={`/results/${session.id}`} className="session-row">
      <div className="session-row__left">
        <span className="session-row__exercise">
          {EXERCISE_SHORT[session.exerciseType]}
        </span>
        <span className="session-row__date">
          {dateStr} at {timeStr}
        </span>
      </div>
      <div className="session-row__metrics">
        <div className="session-metric">
          <span className="session-metric__value">{accuracyStr}</span>
          <span className="session-metric__label">Accuracy</span>
        </div>
        <div className="session-metric">
          <span className="session-metric__value">{dPrimeStr}</span>
          <span className="session-metric__label">d′</span>
        </div>
        <div className="session-metric session-metric--hide-mobile">
          <span className="session-metric__value">{rtStr}</span>
          <span className="session-metric__label">Mean RT</span>
        </div>
        <div className="session-metric session-metric--hide-mobile">
          <span className="session-metric__value">{session.difficulty}</span>
          <span className="session-metric__label">Difficulty</span>
        </div>
      </div>
      <span className="session-row__chevron" aria-hidden>›</span>
    </Link>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [exerciseFilter, setExerciseFilter] = useState<ExerciseFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const data = useAnalytics(timeRange, exerciseFilter)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Sort sessions
  const sortedSessions = data
    ? [...data.sessionsWithSummaries].sort((a, b) => {
        let cmp = 0
        switch (sortKey) {
          case 'date':
            cmp =
              new Date(a.session.startedAt).getTime() -
              new Date(b.session.startedAt).getTime()
            break
          case 'accuracy':
            cmp = (a.summary?.accuracy ?? 0) - (b.summary?.accuracy ?? 0)
            break
          case 'dPrime':
            cmp = (a.summary?.dPrime ?? 0) - (b.summary?.dPrime ?? 0)
            break
          case 'rt':
            cmp =
              (a.summary?.meanReactionMs ?? 0) - (b.summary?.meanReactionMs ?? 0)
            break
        }
        return sortDir === 'desc' ? -cmp : cmp
      })
    : null

  return (
    <div className="analytics-page">
      <div className="analytics-page__inner">
        <header className="analytics-page__header">
          <p className="analytics-page__label">Analytics</p>
          <h1 className="analytics-page__title">Session History</h1>
          <p className="analytics-page__subtitle">
            Review your past training sessions and track progress over time.
          </p>
        </header>

        <FilterBar
          timeRange={timeRange}
          exerciseFilter={exerciseFilter}
          sortKey={sortKey}
          sortDir={sortDir}
          onTimeRange={setTimeRange}
          onExercise={setExerciseFilter}
          onSort={handleSort}
        />

        <section className="analytics-page__section">
          {data === undefined && (
            <p className="analytics-page__loading">Loading…</p>
          )}

          {data !== undefined && sortedSessions!.length === 0 && (
            <div className="analytics-page__empty">
              <p>No sessions found for this filter.</p>
              <Link to="/train" className="analytics-page__btn">
                Start Training
              </Link>
            </div>
          )}

          {data !== undefined && sortedSessions!.length > 0 && (
            <>
              <div className="sessions-header">
                <span className="sessions-header__count">
                  {sortedSessions!.length}{' '}
                  {sortedSessions!.length === 1 ? 'session' : 'sessions'}
                </span>
                {exerciseFilter !== 'all' && (
                  <span className="sessions-header__type">
                    {EXERCISE_LABEL[exerciseFilter as ExerciseType]}
                  </span>
                )}
              </div>
              <div className="sessions-list">
                {sortedSessions!.map(({ session, summary }) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    summary={summary}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
