import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAnalytics,
  type TimeRange,
  type ExerciseFilter,
  type TrendPoint,
  type AnalyticsData,
} from '../hooks/useAnalytics'
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

// ── Trend Charts ───────────────────────────────────────────────────────────────

const EXERCISE_TYPE_LIST: ExerciseType[] = ['selective', 'sustained', 'nback']

const CHART_W = 560
const CHART_H = 140
const CHART_PAD = { top: 8, right: 16, bottom: 28, left: 44 }

interface TrendLineChartProps {
  label: string
  trendsByExercise: Record<ExerciseType, TrendPoint[]>
  getValue: (p: TrendPoint) => number | null
  formatY: (v: number) => string
  yDomainMin?: number
  yDomainMax?: number
}

function TrendLineChart({
  label,
  trendsByExercise,
  getValue,
  formatY,
  yDomainMin,
  yDomainMax,
}: TrendLineChartProps) {
  const plotW = CHART_W - CHART_PAD.left - CHART_PAD.right
  const plotH = CHART_H - CHART_PAD.top - CHART_PAD.bottom

  const seriesData = EXERCISE_TYPE_LIST.map((type) => ({
    type,
    points: trendsByExercise[type]
      .map((p) => ({ date: p.date, value: getValue(p) }))
      .filter((p): p is { date: Date; value: number } => p.value !== null),
  })).filter((s) => s.points.length > 0)

  if (seriesData.length === 0) {
    return (
      <div className="trend-chart">
        <p className="trend-chart__title">{label}</p>
        <p className="trend-chart__empty">No data yet</p>
      </div>
    )
  }

  const allValues = seriesData.flatMap((s) => s.points.map((p) => p.value))
  const allTimes = seriesData.flatMap((s) => s.points.map((p) => p.date.getTime()))

  let vMin = yDomainMin ?? Math.min(...allValues)
  let vMax = yDomainMax ?? Math.max(...allValues)
  if (vMin === vMax) { vMin -= 1; vMax += 1 }

  const tMin = Math.min(...allTimes)
  const tMax = Math.max(...allTimes)
  const tRange = tMax - tMin || 1

  function toX(ts: number): number {
    return CHART_PAD.left + ((ts - tMin) / tRange) * plotW
  }
  function toY(v: number): number {
    return CHART_PAD.top + (1 - (v - vMin) / (vMax - vMin)) * plotH
  }

  const yTicks = [vMin, (vMin + vMax) / 2, vMax]
  const xLabelLeft = new Date(tMin).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const xLabelRight = new Date(tMax).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="trend-chart">
      <p className="trend-chart__title">{label}</p>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="trend-chart__svg"
        role="img"
        aria-label={`${label} over time`}
      >
        {/* Grid lines */}
        {yTicks.map((v, i) => {
          const y = toY(v)
          return (
            <g key={i}>
              <line
                x1={CHART_PAD.left} y1={y}
                x2={CHART_W - CHART_PAD.right} y2={y}
                className="chart-grid"
              />
              <text x={CHART_PAD.left - 6} y={y + 4} className="chart-axis-text" textAnchor="end">
                {formatY(v)}
              </text>
            </g>
          )
        })}

        {/* X axis labels */}
        <text x={CHART_PAD.left} y={CHART_H - 4} className="chart-axis-text" textAnchor="start">
          {xLabelLeft}
        </text>
        {tMin !== tMax && (
          <text x={CHART_W - CHART_PAD.right} y={CHART_H - 4} className="chart-axis-text" textAnchor="end">
            {xLabelRight}
          </text>
        )}

        {/* Lines (>= 2 points) */}
        {seriesData
          .filter((s) => s.points.length >= 2)
          .map(({ type, points }) => {
            const d = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.date.getTime())},${toY(p.value)}`)
              .join(' ')
            return <path key={type} d={d} className={`chart-line chart-line--${type}`} fill="none" />
          })}

        {/* Dots */}
        {seriesData.map(({ type, points }) =>
          points.map((p, i) => (
            <circle
              key={i}
              cx={toX(p.date.getTime())}
              cy={toY(p.value)}
              r={3.5}
              className={`chart-dot chart-dot--${type}`}
            />
          )),
        )}
      </svg>

      {/* Legend */}
      <div className="trend-chart__legend">
        {seriesData.map(({ type }) => (
          <span key={type} className={`trend-legend trend-legend--${type}`}>
            {EXERCISE_SHORT[type]}
          </span>
        ))}
      </div>
    </div>
  )
}

function TrendSection({ data }: { data: AnalyticsData }) {
  const { trendsByExercise } = data
  const hasAnyData = EXERCISE_TYPE_LIST.some((type) => trendsByExercise[type].length > 0)
  if (!hasAnyData) return null

  return (
    <section className="analytics-page__section">
      <h2 className="analytics-trends-title">Progress Over Time</h2>
      <div className="trends-grid">
        <TrendLineChart
          label="Accuracy"
          trendsByExercise={trendsByExercise}
          getValue={(p) => p.accuracy * 100}
          formatY={(v) => `${Math.round(v)}%`}
          yDomainMin={0}
          yDomainMax={100}
        />
        <TrendLineChart
          label="d′ Sensitivity"
          trendsByExercise={trendsByExercise}
          getValue={(p) => p.dPrime}
          formatY={(v) => v.toFixed(1)}
        />
        <TrendLineChart
          label="Mean RT (ms)"
          trendsByExercise={trendsByExercise}
          getValue={(p) => (p.meanReactionMs > 0 ? p.meanReactionMs : null)}
          formatY={(v) => `${Math.round(v)}`}
        />
      </div>
    </section>
  )
}

// ── Calendar Heatmap ──────────────────────────────────────────────────────────

const HEATMAP_WEEKS = 17
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABEL_SHOW = [1, 3, 5] // Mon, Wed, Fri

function getHeatmapColor(count: number): string {
  if (count === 0) return 'var(--color-surface-2)'
  if (count === 1) return 'var(--heatmap-level-1)'
  if (count === 2) return 'var(--heatmap-level-2)'
  return 'var(--heatmap-level-3)'
}

interface CalendarHeatmapProps {
  calendarData: { date: string; count: number }[]
}

function CalendarHeatmap({ calendarData }: CalendarHeatmapProps) {
  const countMap = new Map<string, number>(calendarData.map((d) => [d.date, d.count]))

  // Build a grid: HEATMAP_WEEKS columns (oldest→newest), 7 rows (Sun→Sat)
  // End at today's day; pad the start column if needed
  const today = new Date()
  const todayDow = today.getDay() // 0=Sun

  // The grid's last cell is today. Last column = this week (Sun of this week to today)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - todayDow - (HEATMAP_WEEKS - 1) * 7)

  // Build weeks array: each week is an array of 7 { dateStr, count } (or null before startDate)
  const weeks: Array<Array<{ dateStr: string; count: number } | null>> = []

  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const week: Array<{ dateStr: string; count: number } | null> = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + w * 7 + d)
      if (cellDate > today) {
        week.push(null)
      } else {
        const dateStr = cellDate.toISOString().slice(0, 10)
        week.push({ dateStr, count: countMap.get(dateStr) ?? 0 })
      }
    }
    weeks.push(week)
  }

  // Month labels: one per column where the 1st of a month appears
  const monthLabels: Array<{ col: number; label: string }> = []
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const firstNonNull = weeks[w].find((c) => c !== null)
    if (firstNonNull) {
      const d = new Date(firstNonNull.dateStr)
      if (d.getDate() <= 7) {
        monthLabels.push({
          col: w,
          label: d.toLocaleDateString(undefined, { month: 'short' }),
        })
      }
    }
  }

  const totalSessions = calendarData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="calendar-heatmap">
      <div className="calendar-heatmap__header">
        <p className="calendar-heatmap__title">Training Frequency</p>
        {totalSessions > 0 && (
          <p className="calendar-heatmap__total">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} total
          </p>
        )}
      </div>

      <div className="calendar-heatmap__grid-wrap">
        {/* Day-of-week labels */}
        <div className="calendar-heatmap__dow-labels">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="calendar-heatmap__dow-label">
              {DAY_LABEL_SHOW.includes(i) ? label : ''}
            </span>
          ))}
        </div>

        <div className="calendar-heatmap__cols-wrap">
          {/* Month labels row */}
          <div className="calendar-heatmap__month-labels">
            {weeks.map((_, w) => {
              const ml = monthLabels.find((m) => m.col === w)
              return (
                <span key={w} className="calendar-heatmap__month-label">
                  {ml ? ml.label : ''}
                </span>
              )
            })}
          </div>

          {/* Cells grid */}
          <div className="calendar-heatmap__cols">
            {weeks.map((week, w) => (
              <div key={w} className="calendar-heatmap__week">
                {week.map((cell, d) => (
                  <div
                    key={d}
                    className="calendar-heatmap__cell"
                    style={{ background: cell ? getHeatmapColor(cell.count) : 'transparent' }}
                    title={
                      cell
                        ? cell.count > 0
                          ? `${cell.dateStr}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`
                          : cell.dateStr
                        : ''
                    }
                    aria-label={
                      cell
                        ? cell.count > 0
                          ? `${cell.dateStr}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`
                          : `${cell.dateStr}: no sessions`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-heatmap__legend">
        <span className="calendar-heatmap__legend-label">Less</span>
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className="calendar-heatmap__legend-cell"
            style={{ background: getHeatmapColor(level) }}
          />
        ))}
        <span className="calendar-heatmap__legend-label">More</span>
      </div>
    </div>
  )
}

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

        {data && <TrendSection data={data} />}

        {data && data.calendarData.length > 0 && (
          <section className="analytics-page__section">
            <CalendarHeatmap calendarData={data.calendarData} />
          </section>
        )}

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
