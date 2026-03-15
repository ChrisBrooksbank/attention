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
