import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProgressionRecommendation, type ProgressionResult } from '../lib/progression'
import type { ExerciseType } from '../db/models'
import './Train.css'

// ── Exercise definitions ───────────────────────────────────────────────────────

interface ExerciseDef {
  type: ExerciseType
  name: string
  transformerLabel: string
  description: string
  defaultDifficulty: number
  difficultyHint: string
}

const EXERCISES: ExerciseDef[] = [
  {
    type: 'selective',
    name: 'Selective Attention',
    transformerLabel: 'Key–Query Alignment',
    description:
      'Filter signal from noise — respond only when the target letter appears in a rapid stream of distractors.',
    defaultDifficulty: 3,
    difficultyHint: 'Higher difficulty adds more visually similar distractors.',
  },
  {
    type: 'sustained',
    name: 'Sustained Attention',
    transformerLabel: 'Query Stabilisation',
    description:
      'Hold focus across time — rare targets demand vigilance. Your hit rate in the second half reveals mental stamina.',
    defaultDifficulty: 3,
    difficultyHint: 'Higher difficulty extends duration and reduces target frequency.',
  },
  {
    type: 'nback',
    name: 'N-Back',
    transformerLabel: 'Value Retention',
    description:
      'Strengthen working memory — respond when the current stimulus matches the one from N steps ago.',
    defaultDifficulty: 2,
    difficultyHint: 'Difficulty maps to N level (1-back → 2-back → 3-back).',
  },
]

// ── Recommendation badge ───────────────────────────────────────────────────────

function RecommendationBadge({ result }: { result: ProgressionResult | null }) {
  if (result === null) {
    return (
      <span className="rec-badge rec-badge--neutral">No history yet</span>
    )
  }

  const { recommendation, recentAccuracy } = result
  const pct =
    recentAccuracy !== null ? `${Math.round(recentAccuracy * 100)}% recent` : ''

  if (recommendation === 'increase') {
    return (
      <span className="rec-badge rec-badge--increase">
        ↑ Increase suggested{pct ? ` · ${pct}` : ''}
      </span>
    )
  }
  if (recommendation === 'decrease') {
    return (
      <span className="rec-badge rec-badge--decrease">
        ↓ Decrease suggested{pct ? ` · ${pct}` : ''}
      </span>
    )
  }
  return (
    <span className="rec-badge rec-badge--maintain">
      ✓ Good level{pct ? ` · ${pct}` : ''}
    </span>
  )
}

// ── Exercise card ──────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  def: ExerciseDef
  progression: ProgressionResult | null
  difficulty: number
  onDifficultyChange: (d: number) => void
  onStart: () => void
}

function ExerciseCard({
  def,
  progression,
  difficulty,
  onDifficultyChange,
  onStart,
}: ExerciseCardProps) {
  return (
    <motion.div
      className="exercise-card"
      whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.15 }}
    >
      <div className="exercise-card__header">
        <span className="exercise-card__transformer-label">
          {def.transformerLabel}
        </span>
        <h2 className="exercise-card__name">{def.name}</h2>
      </div>

      <p className="exercise-card__description">{def.description}</p>

      <div className="exercise-card__config">
        <div className="difficulty-row">
          <label className="difficulty-label" htmlFor={`difficulty-${def.type}`}>
            Difficulty
          </label>
          <div className="difficulty-controls">
            <button
              className="difficulty-btn"
              aria-label="Decrease difficulty"
              onClick={() => onDifficultyChange(Math.max(1, difficulty - 1))}
              disabled={difficulty <= 1}
            >
              −
            </button>
            <input
              id={`difficulty-${def.type}`}
              className="difficulty-input"
              type="number"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) onDifficultyChange(Math.max(1, Math.min(10, v)))
              }}
              aria-label={`Difficulty level for ${def.name}`}
            />
            <button
              className="difficulty-btn"
              aria-label="Increase difficulty"
              onClick={() => onDifficultyChange(Math.min(10, difficulty + 1))}
              disabled={difficulty >= 10}
            >
              +
            </button>
          </div>
          <RecommendationBadge result={progression} />
        </div>
        <p className="exercise-card__difficulty-hint">{def.difficultyHint}</p>
      </div>

      <motion.button
        className="exercise-card__start-btn"
        onClick={onStart}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        Start
      </motion.button>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Train() {
  const navigate = useNavigate()

  // Per-exercise difficulty state, keyed by exercise type
  const [difficulties, setDifficulties] = useState<Record<ExerciseType, number>>(
    () =>
      Object.fromEntries(
        EXERCISES.map((e) => [e.type, e.defaultDifficulty]),
      ) as Record<ExerciseType, number>,
  )

  // Progression recommendations, loaded async per exercise
  const [progressions, setProgressions] = useState<
    Partial<Record<ExerciseType, ProgressionResult>>
  >({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const results = await Promise.all(
        EXERCISES.map((e) =>
          getProgressionRecommendation(e.type, difficulties[e.type]),
        ),
      )
      if (cancelled) return
      const map: Partial<Record<ExerciseType, ProgressionResult>> = {}
      EXERCISES.forEach((e, i) => {
        map[e.type] = results[i]
      })
      setProgressions(map)

      // Apply suggested difficulties if user hasn't changed them yet
      setDifficulties((prev) => {
        const next = { ...prev }
        EXERCISES.forEach((e, i) => {
          const res = results[i]
          if (res && prev[e.type] === e.defaultDifficulty) {
            next[e.type] = res.suggestedDifficulty
          }
        })
        return next
      })
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setDifficulty(type: ExerciseType, value: number) {
    setDifficulties((prev) => ({ ...prev, [type]: value }))
  }

  function handleStart(type: ExerciseType) {
    navigate(`/session/${type}`, {
      state: { difficulty: difficulties[type] },
    })
  }

  return (
    <div className="train-page">
      <div className="train-page__inner">
        <header className="train-page__header">
          <p className="train-page__label">Training</p>
          <h1 className="train-page__title">Choose an Exercise</h1>
          <p className="train-page__subtitle">
            Each exercise maps to a component of transformer attention — Query,
            Key, and Value — to train distinct facets of human attention.
          </p>
        </header>

        <motion.div
          className="train-page__grid"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
        >
          {EXERCISES.map((def) => (
            <motion.div
              key={def.type}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
            >
              <ExerciseCard
                def={def}
                progression={progressions[def.type] ?? null}
                difficulty={difficulties[def.type]}
                onDifficultyChange={(d) => setDifficulty(def.type, d)}
                onStart={() => handleStart(def.type)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
