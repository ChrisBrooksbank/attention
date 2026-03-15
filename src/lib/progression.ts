import { db } from '../db';
import type { ExerciseType } from '../db/models';

export type DifficultyRecommendation = 'increase' | 'decrease' | 'maintain';

export interface ProgressionResult {
  recommendation: DifficultyRecommendation;
  suggestedDifficulty: number;
  /** Number of recent sessions used for the recommendation */
  sessionCount: number;
  /** Average accuracy across recent sessions (0–1), or null if no data */
  recentAccuracy: number | null;
}

const HIGH_ACCURACY_THRESHOLD = 0.85;
const LOW_ACCURACY_THRESHOLD = 0.5;
/** How many recent sessions to consider */
const LOOKBACK = 3;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

/**
 * Analyse recent sessions for an exercise type and recommend a difficulty change.
 *
 * Rules:
 * - If ALL recent sessions have accuracy > 85%  → suggest increase by 1
 * - If ALL recent sessions have accuracy < 50%  → suggest decrease by 1
 * - Otherwise                                   → maintain current difficulty
 *
 * Returns immediately with the current difficulty if there are no prior sessions.
 */
export async function getProgressionRecommendation(
  exerciseType: ExerciseType,
  currentDifficulty: number,
): Promise<ProgressionResult> {
  // Fetch the most recent LOOKBACK completed sessions for this exercise type
  const recentSessions = await db.sessions
    .where('exerciseType')
    .equals(exerciseType)
    .reverse()
    .sortBy('completedAt')
    .then((rows) => rows.slice(0, LOOKBACK));

  if (recentSessions.length === 0) {
    return {
      recommendation: 'maintain',
      suggestedDifficulty: currentDifficulty,
      sessionCount: 0,
      recentAccuracy: null,
    };
  }

  // Look up summaries for those sessions
  const sessionIds = recentSessions.map((s) => s.id);
  const summaries = await db.sessionSummaries
    .where('sessionId')
    .anyOf(sessionIds)
    .toArray();

  if (summaries.length === 0) {
    return {
      recommendation: 'maintain',
      suggestedDifficulty: currentDifficulty,
      sessionCount: recentSessions.length,
      recentAccuracy: null,
    };
  }

  const accuracies = summaries.map((s) => s.accuracy);
  const recentAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;

  const allHigh = accuracies.every((a) => a > HIGH_ACCURACY_THRESHOLD);
  const allLow = accuracies.every((a) => a < LOW_ACCURACY_THRESHOLD);

  let recommendation: DifficultyRecommendation;
  let suggestedDifficulty: number;

  if (allHigh) {
    recommendation = 'increase';
    suggestedDifficulty = Math.min(currentDifficulty + 1, MAX_DIFFICULTY);
  } else if (allLow) {
    recommendation = 'decrease';
    suggestedDifficulty = Math.max(currentDifficulty - 1, MIN_DIFFICULTY);
  } else {
    recommendation = 'maintain';
    suggestedDifficulty = currentDifficulty;
  }

  return {
    recommendation,
    suggestedDifficulty,
    sessionCount: summaries.length,
    recentAccuracy,
  };
}

/**
 * Synchronous helper: given a list of accuracy values from recent sessions,
 * return a difficulty recommendation.  Useful for tests and pure-logic contexts.
 */
export function recommendFromAccuracies(
  accuracies: number[],
  currentDifficulty: number,
): Pick<ProgressionResult, 'recommendation' | 'suggestedDifficulty'> {
  if (accuracies.length === 0) {
    return { recommendation: 'maintain', suggestedDifficulty: currentDifficulty };
  }

  const allHigh = accuracies.every((a) => a > HIGH_ACCURACY_THRESHOLD);
  const allLow = accuracies.every((a) => a < LOW_ACCURACY_THRESHOLD);

  if (allHigh) {
    return {
      recommendation: 'increase',
      suggestedDifficulty: Math.min(currentDifficulty + 1, MAX_DIFFICULTY),
    };
  }
  if (allLow) {
    return {
      recommendation: 'decrease',
      suggestedDifficulty: Math.max(currentDifficulty - 1, MIN_DIFFICULTY),
    };
  }
  return { recommendation: 'maintain', suggestedDifficulty: currentDifficulty };
}
