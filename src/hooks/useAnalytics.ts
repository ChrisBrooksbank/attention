import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ExerciseType, Session, SessionSummary } from '../db/models';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimeRange = '7d' | '30d' | 'all';
export type ExerciseFilter = ExerciseType | 'all';

export interface SessionWithSummary {
  session: Session;
  summary: SessionSummary | undefined;
}

export interface TrendPoint {
  sessionId: string;
  date: Date;
  accuracy: number;
  dPrime: number;
  meanReactionMs: number;
}

/** YYYY-MM-DD string → session count for that day */
export interface CalendarDay {
  date: string;
  count: number;
}

export interface ConsistencyMetrics {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  avgSessionsPerWeek: number;
}

export interface AnalyticsData {
  /** All sessions (filtered) paired with their summary */
  sessionsWithSummaries: SessionWithSummary[];
  /** Trend points grouped by exercise type */
  trendsByExercise: Record<ExerciseType, TrendPoint[]>;
  /** Calendar heat-map data (all-time, unfiltered by exerciseFilter) */
  calendarData: CalendarDay[];
  /** Streak and consistency metrics (all-time, unfiltered) */
  consistency: ConsistencyMetrics;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function cutoffDate(range: TimeRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  const days = range === '7d' ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function computeStreaks(sortedDates: string[]): { current: number; longest: number } {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  // Deduplicate
  const days = [...new Set(sortedDates)].sort();

  let longest = 1;
  let run = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: is the last training day today or yesterday?
  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const lastDay = days[days.length - 1];
  let current = 0;
  if (lastDay === today || lastDay === yesterday) {
    // Walk backwards from the last day
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const next = new Date(days[i + 1]);
      const curr2 = new Date(days[i]);
      const diff = Math.round((next.getTime() - curr2.getTime()) / (24 * 60 * 60 * 1000));
      if (diff === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

function avgSessionsPerWeek(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );
  const firstDate = new Date(sorted[0].startedAt);
  const lastDate = new Date(sorted[sorted.length - 1].startedAt);
  const spanMs = lastDate.getTime() - firstDate.getTime();
  const weeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
  return sessions.length / weeks;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Aggregates analytics data from Dexie.
 *
 * - `timeRange` filters trend data and session history
 * - `exerciseFilter` further filters trend data and session history
 * - Calendar and consistency metrics always use all-time data
 */
export function useAnalytics(
  timeRange: TimeRange = 'all',
  exerciseFilter: ExerciseFilter = 'all',
): AnalyticsData | undefined {
  return useLiveQuery(async () => {
    const cutoff = cutoffDate(timeRange);

    // ── 1. Load all sessions (for calendar + consistency, always all-time)
    const allSessions: Session[] = await db.sessions
      .orderBy('startedAt')
      .toArray();

    // ── 2. Load all summaries as a map
    const allSummaries: SessionSummary[] = await db.sessionSummaries.toArray();
    const summaryMap = new Map<string, SessionSummary>(
      allSummaries.map((s) => [s.sessionId, s]),
    );

    // ── 3. Filter sessions for history + trends using indexes where possible
    let filteredSessions: Session[];
    if (exerciseFilter !== 'all' && cutoff) {
      // Use compound index: [exerciseType+startedAt]
      filteredSessions = await db.sessions
        .where('[exerciseType+startedAt]')
        .between([exerciseFilter, cutoff], [exerciseFilter, new Date(8640000000000000)])
        .toArray();
    } else if (exerciseFilter !== 'all') {
      filteredSessions = await db.sessions
        .where('exerciseType')
        .equals(exerciseFilter)
        .sortBy('startedAt');
    } else if (cutoff) {
      filteredSessions = await db.sessions
        .where('startedAt')
        .aboveOrEqual(cutoff)
        .toArray();
    } else {
      filteredSessions = allSessions;
    }

    const sessionsWithSummaries: SessionWithSummary[] = filteredSessions.map((session) => ({
      session,
      summary: summaryMap.get(session.id),
    }));

    // ── 4. Build trends by exercise type
    const exerciseTypes: ExerciseType[] = ['selective', 'sustained', 'nback'];
    const trendsByExercise: Record<ExerciseType, TrendPoint[]> = {
      selective: [],
      sustained: [],
      nback: [],
    };

    for (const sw of sessionsWithSummaries) {
      if (!sw.summary) continue;
      const point: TrendPoint = {
        sessionId: sw.session.id,
        date: new Date(sw.session.startedAt),
        accuracy: sw.summary.accuracy,
        dPrime: sw.summary.dPrime,
        meanReactionMs: sw.summary.meanReactionMs,
      };
      trendsByExercise[sw.session.exerciseType].push(point);
    }

    // Sort each trend series by date ascending
    for (const type of exerciseTypes) {
      trendsByExercise[type].sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    // ── 5. Build calendar heat-map (all-time)
    const countByDay = new Map<string, number>();
    for (const s of allSessions) {
      const day = toISODate(new Date(s.startedAt));
      countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
    }
    const calendarData: CalendarDay[] = [...countByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ── 6. Consistency metrics (all-time)
    const allDates = allSessions.map((s) => toISODate(new Date(s.startedAt)));
    const { current: currentStreak, longest: longestStreak } = computeStreaks(allDates);

    const consistency: ConsistencyMetrics = {
      currentStreak,
      longestStreak,
      totalSessions: allSessions.length,
      avgSessionsPerWeek: avgSessionsPerWeek(allSessions),
    };

    return {
      sessionsWithSummaries,
      trendsByExercise,
      calendarData,
      consistency,
    } satisfies AnalyticsData;
  }, [timeRange, exerciseFilter]);
}
