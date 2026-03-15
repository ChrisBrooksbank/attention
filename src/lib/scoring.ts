import type { Trial, SessionSummary } from '../db/models';

// Phi inverse (probit) approximation using rational approximation (Abramowitz & Stegun 26.2.17)
function probit(p: number): number {
  // Clamp to avoid ±Inf
  const clamped = Math.max(1e-6, Math.min(1 - 1e-6, p));
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let x: number;
  if (clamped < pLow) {
    const q = Math.sqrt(-2 * Math.log(clamped));
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (clamped <= pHigh) {
    const q = clamped - 0.5;
    const r = q * q;
    x =
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - clamped));
    x =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  return x;
}

export interface TrialCounts {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
}

export function countTrials(trials: Trial[]): TrialCounts {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;

  for (const t of trials) {
    if (t.isTarget && t.responded) hits++;
    else if (t.isTarget && !t.responded) misses++;
    else if (!t.isTarget && t.responded) falseAlarms++;
    else correctRejections++;
  }

  return { hits, misses, falseAlarms, correctRejections };
}

export function calcAccuracy(counts: TrialCounts): number {
  const total = counts.hits + counts.misses + counts.falseAlarms + counts.correctRejections;
  if (total === 0) return 0;
  return (counts.hits + counts.correctRejections) / total;
}

// Signal detection theory d-prime with 0.5 correction for edge cases
export function calcDPrime(counts: TrialCounts): number {
  const targets = counts.hits + counts.misses;
  const nonTargets = counts.falseAlarms + counts.correctRejections;

  if (targets === 0 || nonTargets === 0) return 0;

  // Apply 0.5 correction to avoid 0% or 100% rates
  const hitRate = (counts.hits + 0.5) / (targets + 1);
  const faRate = (counts.falseAlarms + 0.5) / (nonTargets + 1);

  return probit(hitRate) - probit(faRate);
}

export function calcReactionTimes(trials: Trial[]): { mean: number; median: number } {
  const rts = trials
    .filter((t) => t.isTarget && t.responded && t.reactionTimeMs !== null)
    .map((t) => t.reactionTimeMs as number);

  if (rts.length === 0) return { mean: 0, median: 0 };

  const mean = rts.reduce((sum, rt) => sum + rt, 0) / rts.length;

  const sorted = [...rts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { mean, median };
}

export function scoreSession(sessionId: string, trials: Trial[]): SessionSummary {
  const counts = countTrials(trials);
  const accuracy = calcAccuracy(counts);
  const dPrime = calcDPrime(counts);
  const { mean: meanReactionMs, median: medianReactionMs } = calcReactionTimes(trials);

  return {
    sessionId,
    hits: counts.hits,
    misses: counts.misses,
    falseAlarms: counts.falseAlarms,
    correctRejections: counts.correctRejections,
    accuracy,
    dPrime,
    meanReactionMs,
    medianReactionMs,
  };
}
