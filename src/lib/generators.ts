import type { ExerciseConfig } from '../db/models';

export interface StimulusItem {
  stimulus: string;
  isTarget: boolean;
}

// Mulberry32 seeded PRNG for reproducible sequences
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using provided PRNG
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Letters that are visually distinct from each other at low difficulty
const EASY_DISTRACTORS = 'ABCDEFGHIJLMNOPQRSUVWZ'.split('');

// Letters visually similar to common targets at high difficulty
const SIMILAR_TO_X: Record<string, string[]> = {
  X: ['K', 'Y', 'Z', 'N', 'M', 'H', 'T'],
};

function getDistractors(target: string, difficulty: number): string[] {
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWYZ'.split('').filter((l) => l !== target);

  if (difficulty <= 3) {
    // Only easy-to-distinguish distractors
    return EASY_DISTRACTORS.filter((l) => l !== target);
  } else if (difficulty <= 6) {
    // Full alphabet minus target
    return allLetters;
  } else {
    // Add visually similar characters for harder difficulty
    const similar = SIMILAR_TO_X[target] ?? [];
    // Boost frequency of similar distractors by repeating them
    return [...allLetters, ...similar, ...similar];
  }
}

export interface GenerateSelectiveOptions {
  totalTrials?: number;
  targetRatio?: number; // fraction of trials that are targets, default 0.25
  difficulty?: number; // 1–10
  targetLetter?: string;
  seed?: number;
}

/**
 * Generate a Selective Attention (CPT) stimulus sequence.
 * Sequences are reproducible given the same seed.
 */
export function generateSelectiveAttention(opts: GenerateSelectiveOptions = {}): StimulusItem[] {
  const {
    totalTrials = 60,
    targetRatio = 0.25,
    difficulty = 1,
    targetLetter = 'X',
    seed = Date.now(),
  } = opts;

  const rand = mulberry32(seed);
  const distractors = getDistractors(targetLetter, difficulty);

  const targetCount = Math.round(totalTrials * targetRatio);
  const distractorCount = totalTrials - targetCount;

  const items: StimulusItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    items.push({ stimulus: targetLetter, isTarget: true });
  }

  for (let i = 0; i < distractorCount; i++) {
    const idx = Math.floor(rand() * distractors.length);
    items.push({ stimulus: distractors[idx], isTarget: false });
  }

  return shuffle(items, rand);
}

/**
 * Convert an ExerciseConfig to GenerateSelectiveOptions.
 */
export function configToSelectiveOptions(
  config: ExerciseConfig,
  difficulty: number,
  seed?: number,
): GenerateSelectiveOptions {
  return {
    totalTrials: config.totalTrials,
    targetLetter: config.targetLetter,
    difficulty,
    seed,
  };
}

export interface GenerateSustainedOptions {
  totalTrials?: number;
  targetRate?: number; // fraction of trials that are targets, default 0.10
  targetDigit?: string; // the rare target digit, default '3'
  difficulty?: number; // 1–10; higher = more distractors similar to target
  seed?: number;
}

/**
 * Generate a Sustained Attention (vigilance/SART) stimulus sequence.
 * Stimuli are digits 1–9; one digit is the rare target (~10% by default).
 * Higher difficulty adds more digits visually close to the target.
 * Sequences are reproducible given the same seed.
 */
export function generateSustainedAttention(opts: GenerateSustainedOptions = {}): StimulusItem[] {
  const {
    totalTrials = 150,
    targetRate = 0.1,
    targetDigit = '3',
    difficulty = 1,
    seed = Date.now(),
  } = opts;

  const rand = mulberry32(seed);

  // All digits except target are non-targets
  const allDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].filter(
    (d) => d !== targetDigit,
  );

  // At higher difficulty, include a second "confusable" digit more often.
  // The confusable digits look similar to the target (same curve or shape).
  const confusableMap: Record<string, string[]> = {
    '3': ['8', '6'],
    '1': ['7', '4'],
    '2': ['7', '5'],
    '4': ['9', '7'],
    '5': ['6', '8'],
    '6': ['8', '5'],
    '7': ['1', '4'],
    '8': ['3', '6'],
    '9': ['4', '6'],
  };

  let distractor_pool: string[];
  if (difficulty <= 3) {
    // Use only non-confusable digits
    const confusable = new Set(confusableMap[targetDigit] ?? []);
    distractor_pool = allDigits.filter((d) => !confusable.has(d));
  } else if (difficulty <= 6) {
    distractor_pool = allDigits;
  } else {
    // Boost confusable distractors by repeating them
    const confusable = confusableMap[targetDigit] ?? [];
    distractor_pool = [...allDigits, ...confusable, ...confusable];
  }

  const targetCount = Math.round(totalTrials * targetRate);
  const distractorCount = totalTrials - targetCount;

  const items: StimulusItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    items.push({ stimulus: targetDigit, isTarget: true });
  }

  for (let i = 0; i < distractorCount; i++) {
    const idx = Math.floor(rand() * distractor_pool.length);
    items.push({ stimulus: distractor_pool[idx], isTarget: false });
  }

  return shuffle(items, rand);
}

/**
 * Convert an ExerciseConfig to GenerateSustainedOptions.
 */
export function configToSustainedOptions(
  config: ExerciseConfig,
  difficulty: number,
  seed?: number,
): GenerateSustainedOptions {
  return {
    totalTrials: config.totalTrials,
    targetRate: config.targetRate,
    difficulty,
    seed,
  };
}

export interface NBackItem extends StimulusItem {
  /** The index in the sequence this item matches (i - nLevel), or null if not a target */
  matchIndex: number | null;
}

export interface GenerateNBackOptions {
  totalTrials?: number;
  nLevel?: number; // 1, 2, or 3; default 1
  targetRate?: number; // fraction of trials that are targets, default ~0.30
  stimulusSet?: string[]; // symbols to draw from; default letters A-Z minus confusables
  difficulty?: number; // 1–10; higher = more items in stimulus set (harder to discriminate)
  seed?: number;
}

// Letters easy to distinguish at low difficulty (no similar-looking pairs)
const NBACK_EASY_LETTERS = 'ABCDFGHJKLMNPQRSTUVWXYZ'.split('');

/**
 * Generate an N-Back working memory stimulus sequence.
 * Each item is a letter; `isTarget` is true when the current letter matches
 * the letter shown exactly N positions earlier.
 * Sequences are reproducible given the same seed.
 */
export function generateNBack(opts: GenerateNBackOptions = {}): NBackItem[] {
  const {
    totalTrials = 30,
    nLevel = 1,
    targetRate = 0.3,
    difficulty = 1,
    seed = Date.now(),
  } = opts;

  const rand = mulberry32(seed);

  // Choose stimulus pool based on difficulty: more letters → harder to track
  let pool: string[];
  if (opts.stimulusSet) {
    pool = opts.stimulusSet;
  } else if (difficulty <= 3) {
    pool = NBACK_EASY_LETTERS.slice(0, 6);  // small pool, easier to hold in memory
  } else if (difficulty <= 6) {
    pool = NBACK_EASY_LETTERS.slice(0, 10);
  } else {
    pool = NBACK_EASY_LETTERS.slice(0, 16);
  }

  const items: NBackItem[] = [];

  // Decide which positions (after nLevel seed positions) should be targets
  const eligibleCount = totalTrials - nLevel;
  const targetCount = Math.min(Math.round(eligibleCount * targetRate), eligibleCount);

  // Build a random target schedule for the eligible positions
  const targetSchedule = new Array(eligibleCount).fill(false);
  let placed = 0;
  // Place targets using reservoir-style random selection
  for (let i = 0; i < eligibleCount && placed < targetCount; i++) {
    const remaining = eligibleCount - i;
    const needed = targetCount - placed;
    if (rand() < needed / remaining) {
      targetSchedule[i] = true;
      placed++;
    }
  }

  // Fill seed positions with random non-repeating stimuli
  for (let i = 0; i < nLevel; i++) {
    const idx = Math.floor(rand() * pool.length);
    items.push({ stimulus: pool[idx], isTarget: false, matchIndex: null });
  }

  // Fill remaining positions following the target schedule
  for (let i = 0; i < eligibleCount; i++) {
    const shouldBeTarget = targetSchedule[i];
    if (shouldBeTarget) {
      // Repeat the stimulus from N steps back
      const matchIndex = i; // index in items array (already has nLevel items)
      const stimulus = items[matchIndex].stimulus;
      items.push({ stimulus, isTarget: true, matchIndex });
    } else {
      // Pick a random stimulus that is NOT the N-back item (to avoid accidental targets)
      const nBackStimulus = items[i].stimulus;
      const candidates = pool.filter((s) => s !== nBackStimulus);
      const idx = Math.floor(rand() * candidates.length);
      items.push({ stimulus: candidates[idx], isTarget: false, matchIndex: null });
    }
  }

  return items;
}

/**
 * Convert an ExerciseConfig to GenerateNBackOptions.
 */
export function configToNBackOptions(
  config: ExerciseConfig,
  difficulty: number,
  seed?: number,
): GenerateNBackOptions {
  return {
    totalTrials: config.totalTrials,
    nLevel: config.nLevel,
    difficulty,
    seed,
  };
}
