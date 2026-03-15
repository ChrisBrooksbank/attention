import { useNavigate, Link } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import type { ExerciseType } from '../db/models'
import './Home.css'

// ── Constants ──────────────────────────────────────────────────────────────────

const EXERCISE_INFO: Record<ExerciseType, { name: string; transformerLabel: string; description: string }> = {
  selective: {
    name: 'Selective Attention',
    transformerLabel: 'Key–Query Alignment',
    description: 'Filter signal from noise in a rapid letter stream.',
  },
  sustained: {
    name: 'Sustained Attention',
    transformerLabel: 'Query Stabilisation',
    description: 'Hold focus across time — rare targets demand vigilance.',
  },
  nback: {
    name: 'N-Back',
    transformerLabel: 'Value Retention',
    description: 'Strengthen working memory with N-back sequences.',
  },
}

const EXERCISE_TYPES: ExerciseType[] = ['selective', 'sustained', 'nback']

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Suggestion logic ──────────────────────────────────────────────────────────

function getSuggestion(
  sessionsWithSummaries: ReturnType<typeof useAnalytics> extends undefined ? never : NonNullable<ReturnType<typeof useAnalytics>>['sessionsWithSummaries'],
  consistency: NonNullable<ReturnType<typeof useAnalytics>>['consistency'],
): { type: ExerciseType; reason: string } {
  if (sessionsWithSummaries.length === 0) {
    return { type: 'selective', reason: 'Start with the classic attention filter exercise.' }
  }

  // Find the type practiced least recently (round-robin suggestion)
  const lastByType: Partial<Record<ExerciseType, Date>> = {}
  for (const { session } of sessionsWithSummaries) {
    const d = new Date(session.startedAt)
    const prev = lastByType[session.exerciseType]
    if (!prev || d > prev) lastByType[session.exerciseType] = d
  }

  // Any type never practiced?
  const neverPracticed = EXERCISE_TYPES.find((t) => !lastByType[t])
  if (neverPracticed) {
    return { type: neverPracticed, reason: `You haven't tried ${EXERCISE_INFO[neverPracticed].name} yet.` }
  }

  // Find type practiced longest ago
  const oldest = EXERCISE_TYPES.reduce((prev, curr) =>
    (lastByType[prev]!.getTime() < lastByType[curr]!.getTime()) ? prev : curr
  )

  // Check if last session had poor accuracy → suggest same type
  const lastSession = [...sessionsWithSummaries].sort(
    (a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime(),
  )[0]
  if (lastSession.summary && lastSession.summary.accuracy < 0.5) {
    return {
      type: lastSession.session.exerciseType,
      reason: `Last session accuracy was low — keep practicing ${EXERCISE_INFO[lastSession.session.exerciseType].name}.`,
    }
  }

  const daysSince = Math.floor(
    (Date.now() - lastByType[oldest]!.getTime()) / (24 * 60 * 60 * 1000),
  )
  const reason =
    daysSince === 0
      ? `You haven't done ${EXERCISE_INFO[oldest].name} today yet.`
      : daysSince === 1
        ? `You last did ${EXERCISE_INFO[oldest].name} yesterday.`
        : `It's been ${daysSince} days since your last ${EXERCISE_INFO[oldest].name} session.`

  // Suppress streak if user is consistent enough
  if (consistency.currentStreak === 0) {
    return { type: oldest, reason: 'Time to restart your streak — ' + reason.toLowerCase() }
  }

  return { type: oldest, reason }
}

// ── Streak badge ──────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) {
    return (
      <div className="home-streak home-streak--inactive">
        <span className="home-streak__icon" aria-hidden>○</span>
        <span className="home-streak__text">No active streak</span>
      </div>
    )
  }
  return (
    <div className="home-streak home-streak--active">
      <span className="home-streak__icon" aria-hidden>◆</span>
      <span className="home-streak__text">
        <strong>{streak}</strong>-day streak
      </span>
    </div>
  )
}

// ── Suggestion card ───────────────────────────────────────────────────────────

interface SuggestionCardProps {
  type: ExerciseType
  reason: string
  onStart: () => void
}

function SuggestionCard({ type, reason, onStart }: SuggestionCardProps) {
  const info = EXERCISE_INFO[type]
  return (
    <div className="home-suggestion">
      <div className="home-suggestion__inner">
        <div className="home-suggestion__label">Today's suggestion</div>
        <h2 className="home-suggestion__title">{info.name}</h2>
        <p className="home-suggestion__reason">{reason}</p>
        <p className="home-suggestion__transformer">{info.transformerLabel}</p>
      </div>
      <button className="home-suggestion__btn" onClick={onStart}>
        Start Session
      </button>
    </div>
  )
}

// ── Recent session row ────────────────────────────────────────────────────────

interface RecentSessionProps {
  session: { id: string; exerciseType: ExerciseType; startedAt: Date; difficulty: number }
  summary: { accuracy: number; dPrime: number; meanReactionMs: number } | undefined
}

function RecentSessionRow({ session, summary }: RecentSessionProps) {
  const date = new Date(session.startedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  let dateLabel: string
  if (diffDays === 0) {
    dateLabel = 'Today'
  } else if (diffDays === 1) {
    dateLabel = 'Yesterday'
  } else {
    dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const accuracyStr = summary ? `${Math.round(summary.accuracy * 100)}%` : '—'
  const dPrimeStr = summary ? summary.dPrime.toFixed(1) : '—'

  return (
    <Link to={`/results/${session.id}`} className="home-recent-row">
      <div className="home-recent-row__left">
        <span className="home-recent-row__type">{EXERCISE_INFO[session.exerciseType].name}</span>
        <span className="home-recent-row__date">{dateLabel}</span>
      </div>
      <div className="home-recent-row__metrics">
        <span className="home-recent-metric">
          <span className="home-recent-metric__value">{accuracyStr}</span>
          <span className="home-recent-metric__label">acc</span>
        </span>
        <span className="home-recent-metric">
          <span className="home-recent-metric__value">{dPrimeStr}</span>
          <span className="home-recent-metric__label">d′</span>
        </span>
      </div>
      <span className="home-recent-row__chevron" aria-hidden>›</span>
    </Link>
  )
}

// ── Quick start buttons ───────────────────────────────────────────────────────

interface QuickStartProps {
  onStart: (type: ExerciseType) => void
}

function QuickStart({ onStart }: QuickStartProps) {
  return (
    <div className="home-quick-start">
      <p className="home-quick-start__label">Quick start</p>
      <div className="home-quick-start__grid">
        {EXERCISE_TYPES.map((type) => {
          const info = EXERCISE_INFO[type]
          return (
            <button
              key={type}
              className="home-quick-btn"
              onClick={() => onStart(type)}
            >
              <span className="home-quick-btn__name">{info.name}</span>
              <span className="home-quick-btn__transformer">{info.transformerLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const data = useAnalytics('all', 'all')

  function handleStart(type: ExerciseType, difficulty = 3) {
    navigate(`/session/${type}`, { state: { difficulty } })
  }

  const recentSessions = data
    ? [...data.sessionsWithSummaries]
        .sort((a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime())
        .slice(0, 3)
    : null

  const suggestion =
    data
      ? getSuggestion(data.sessionsWithSummaries, data.consistency)
      : null

  return (
    <div className="home-page">
      <div className="home-page__inner">
        {/* Header */}
        <header className="home-header">
          <div className="home-header__top">
            <div>
              <p className="home-header__greeting">{getGreeting()}</p>
              <h1 className="home-header__title">Attention Training</h1>
              <p className="home-header__subtitle">
                Train the three facets of attention — selective, sustained, and working memory — through the lens of transformer attention.
              </p>
            </div>
            {data && (
              <StreakBadge streak={data.consistency.currentStreak} />
            )}
          </div>

          {data && data.consistency.totalSessions > 0 && (
            <div className="home-stats">
              <div className="home-stat">
                <span className="home-stat__value">{data.consistency.totalSessions}</span>
                <span className="home-stat__label">sessions</span>
              </div>
              <div className="home-stat">
                <span className="home-stat__value">
                  {data.consistency.avgSessionsPerWeek > 0
                    ? data.consistency.avgSessionsPerWeek.toFixed(1)
                    : '—'}
                </span>
                <span className="home-stat__label">avg / week</span>
              </div>
              <div className="home-stat">
                <span className="home-stat__value">
                  {data.consistency.longestStreak > 0 ? `${data.consistency.longestStreak}d` : '—'}
                </span>
                <span className="home-stat__label">best streak</span>
              </div>
            </div>
          )}
        </header>

        {/* Suggestion */}
        {suggestion && (
          <section className="home-section">
            <SuggestionCard
              type={suggestion.type}
              reason={suggestion.reason}
              onStart={() => handleStart(suggestion.type)}
            />
          </section>
        )}

        {/* Recent sessions */}
        {recentSessions && recentSessions.length > 0 && (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">Recent Sessions</h2>
              <Link to="/analytics" className="home-section__link">View all</Link>
            </div>
            <div className="home-recent-list">
              {recentSessions.map(({ session, summary }) => (
                <RecentSessionRow key={session.id} session={session} summary={summary} />
              ))}
            </div>
          </section>
        )}

        {/* Quick start */}
        <section className="home-section">
          <QuickStart onStart={(type) => handleStart(type)} />
        </section>

        {/* Empty state */}
        {data && data.consistency.totalSessions === 0 && (
          <section className="home-section">
            <div className="home-empty">
              <p className="home-empty__text">
                No sessions yet. Choose an exercise above to begin your first training session.
              </p>
              <Link to="/learn" className="home-empty__link">
                Learn about the Q/K/V attention framework →
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
