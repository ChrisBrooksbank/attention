import { useState } from 'react'
import './Learn.css'

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionId = 'overview' | 'query' | 'key' | 'value' | 'weights' | 'adhd'

const NAV_ITEMS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'query', label: 'Query (Q)' },
  { id: 'key', label: 'Key (K)' },
  { id: 'value', label: 'Value (V)' },
  { id: 'weights', label: 'Weights' },
  { id: 'adhd', label: 'ADHD' },
]

const SECTION_META: Record<SectionId, { tag: string; title: string }> = {
  overview: { tag: 'The Model', title: 'Attention as Computation' },
  query: { tag: 'Q — Attentional Goal', title: '"What am I looking for?"' },
  key: { tag: 'K — Stimulus Features', title: '"What features does each input have?"' },
  value: { tag: 'V — Extracted Information', title: '"What do I carry forward?"' },
  weights: { tag: 'Attention Weights', title: 'Where your focus went' },
  adhd: { tag: 'Attention & ADHD', title: 'When weights go wrong' },
}

// ── Attention weight visualizer ────────────────────────────────────────────────

const DEMO_LETTERS = ['B', 'X', 'T', 'X', 'A', 'X', 'T', 'X', 'T', 'B']
const TARGET_LETTER = 'T'
const BAR_MAX_PX = 72

function normalizeWeights(raw: number[]): number[] {
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

const FOCUSED_WEIGHTS = normalizeWeights(
  DEMO_LETTERS.map((l) => (l === TARGET_LETTER ? 0.88 : 0.04)),
)

const SCATTERED_WEIGHTS = normalizeWeights([
  0.12, 0.09, 0.22, 0.15, 0.13, 0.18, 0.19, 0.14, 0.18, 0.11,
])

function WeightBarChart({ weights }: { weights: number[] }) {
  const maxW = Math.max(...weights)
  return (
    <div className="wbc" role="img" aria-label="Attention weight distribution chart">
      {DEMO_LETTERS.map((letter, i) => {
        const barH = Math.max(2, Math.round((weights[i] / maxW) * BAR_MAX_PX))
        const pct = Math.round(weights[i] * 100)
        return (
          <div
            key={i}
            className={`wbc__col ${letter === TARGET_LETTER ? 'wbc__col--target' : ''}`}
          >
            <div className="wbc__bar-wrap">
              <div
                className="wbc__bar"
                style={{ height: `${barH}px` }}
                aria-label={`${letter}: ${pct}%`}
              />
            </div>
            <span className="wbc__letter">{letter}</span>
            <span className="wbc__pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function WeightDemoInteractive() {
  const [mode, setMode] = useState<'focused' | 'scattered'>('focused')

  return (
    <div className="weight-demo">
      <div className="weight-demo__toggle">
        <button
          className={`toggle-btn ${mode === 'focused' ? 'toggle-btn--active' : ''}`}
          onClick={() => setMode('focused')}
        >
          Focused
        </button>
        <button
          className={`toggle-btn ${mode === 'scattered' ? 'toggle-btn--active' : ''}`}
          onClick={() => setMode('scattered')}
        >
          Scattered (ADHD-like)
        </button>
      </div>
      <WeightBarChart weights={mode === 'focused' ? FOCUSED_WEIGHTS : SCATTERED_WEIGHTS} />
      <p className="weight-demo__caption">
        {mode === 'focused'
          ? 'Target letters (T, highlighted) capture most attention weight. Distractors are suppressed.'
          : 'Attention spreads across distractors too — the target signal is diluted.'}
      </p>
    </div>
  )
}

// ── Section content ───────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div className="learn-prose">
      <p>
        In transformer neural networks, attention decides how much each input should
        influence the output — computing a weighted combination of available information.
      </p>
      <p>
        Three learned vectors drive the process: <strong>Query</strong>, <strong>Key</strong>,
        and <strong>Value</strong>. Attention weight flows to inputs whose Keys best match
        the current Query; those inputs then contribute their Values to the output.
      </p>
      <div
        className="learn-equation"
        aria-label="Q times K gives attention weights; weights times V gives output"
      >
        <span className="leq leq--q">Q</span>
        <span className="leq leq--op">×</span>
        <span className="leq leq--k">K</span>
        <span className="leq leq--op">→</span>
        <span className="leq leq--w">weights</span>
        <span className="leq leq--op">×</span>
        <span className="leq leq--v">V</span>
        <span className="leq leq--op">=</span>
        <span className="leq leq--out">output</span>
      </div>
      <p>
        Human attention works the same way. The exercises in this app train each component
        of this system — and your results pages give a direct readout of attention weights
        in action.
      </p>
    </div>
  )
}

function QuerySection() {
  return (
    <div className="learn-prose">
      <p>
        The <strong>Query</strong> encodes your current attentional goal — the internal
        representation of what you're searching for right now.
      </p>
      <div className="learn-callout">
        <p className="learn-callout__label">In the Selective Attention exercise</p>
        <p>
          Your query is: <em>"Watch for the letter T in the stream."</em> You hold this
          goal actively in mind while stimuli flash past at high speed.
        </p>
      </div>
      <p>
        A sharp, stable query narrows the attentional beam. A vague or drifting query
        produces broad, inefficient attention — you catch some targets but also react to
        distractors.
      </p>
      <p>
        <strong>Training effect:</strong> Practice strengthens query stability, allowing
        you to hold an attentional goal through longer, faster, and more distracting sequences.
      </p>
    </div>
  )
}

function KeySection() {
  return (
    <div className="learn-prose">
      <p>
        Each stimulus has a <strong>Key</strong> — a set of perceptual features compared
        against the current Query to compute how relevant that stimulus is.
      </p>
      <div className="learn-callout">
        <p className="learn-callout__label">In the Selective Attention exercise</p>
        <p>
          The letter T has distinctive features that match a "watching for T" query.
          Distractors (B, X, A…) have different feature keys — a well-tuned system
          assigns them near-zero attention weight.
        </p>
      </div>
      <p>
        Higher difficulty introduces visually similar letters whose keys are{' '}
        <em>closer</em> to the target — requiring finer discrimination under time pressure.
      </p>
      <p>
        <strong>Training effect:</strong> Repeated exposure sharpens perceptual templates,
        making the target's key more distinct from distractors in mental representation.
      </p>
    </div>
  )
}

function ValueSection() {
  return (
    <div className="learn-prose">
      <p>
        The <strong>Value</strong> is the information content extracted from an attended
        stimulus — what actually gets carried forward into working memory once attention
        has landed.
      </p>
      <div className="learn-callout">
        <p className="learn-callout__label">In the N-Back exercise</p>
        <p>
          When you attend to a stimulus, you encode its value into working memory. N steps
          later, you compare the current input against that stored value. If encoding was
          incomplete or the value has decayed, performance drops.
        </p>
      </div>
      <p>
        Working memory capacity is limited. The N-back task directly stresses the
        maintenance window — how long a value remains accessible before interference
        overwrites it.
      </p>
      <p>
        <strong>Training effect:</strong> Practice consolidates the encoding process,
        reduces decay rate, and builds resistance to interference from subsequent stimuli.
      </p>
    </div>
  )
}

function WeightsSection() {
  return (
    <div className="learn-prose">
      <p>
        Attention weights — softmax(Q·K<sup>T</sup> / √d) in the transformer formulation
        — form a probability distribution over all stimuli showing how much each one
        influenced the response.
      </p>
      <p>
        In the exercises, each trial has an implicit attention weight: how strongly that
        stimulus captured your focus. The results page visualizes this as a strip of
        colored cells (hit, miss, false alarm, correct rejection).
      </p>
      <p>
        The interactive demo below contrasts focused and scattered attention weight
        distributions:
      </p>
      <WeightDemoInteractive />
    </div>
  )
}

function AdhdSection() {
  return (
    <div className="learn-prose">
      <p>
        ADHD involves dysregulation of the attention-weight computation — not a deficit
        in intelligence or effort, but in the <em>precision</em> of the weighting mechanism.
      </p>
      <div className="adhd-patterns">
        <div className="adhd-pattern">
          <div className="adhd-pattern__icon" aria-hidden="true">
            ◎
          </div>
          <div>
            <p className="adhd-pattern__title">Broad weight distribution — Distractibility</p>
            <p className="adhd-pattern__body">
              Weights spread to irrelevant stimuli (sounds, movement, thoughts) that a
              focused system would suppress to near zero. Every input competes.
            </p>
          </div>
        </div>
        <div className="adhd-pattern">
          <div className="adhd-pattern__icon" aria-hidden="true">
            ⇄
          </div>
          <div>
            <p className="adhd-pattern__title">Premature weight shift — Task-switching</p>
            <p className="adhd-pattern__body">
              Attention moves to a new stimulus before the Value from the current one
              has been fully encoded into working memory — partially processed information
              is abandoned.
            </p>
          </div>
        </div>
        <div className="adhd-pattern">
          <div className="adhd-pattern__icon" aria-hidden="true">
            ⊘
          </div>
          <div>
            <p className="adhd-pattern__title">Value decay — Working memory leakage</p>
            <p className="adhd-pattern__body">
              Even when encoding succeeds, retained values degrade faster under
              interference — the effective N-back maintenance window is shorter.
            </p>
          </div>
        </div>
      </div>
      <p>
        Training doesn't alter underlying neurology, but it can sharpen the system's
        operating parameters — improving weight precision, slowing decay, and stabilizing
        the query signal over time.
      </p>
    </div>
  )
}

function SectionContent({ id }: { id: SectionId }) {
  if (id === 'overview') return <OverviewSection />
  if (id === 'query') return <QuerySection />
  if (id === 'key') return <KeySection />
  if (id === 'value') return <ValueSection />
  if (id === 'weights') return <WeightsSection />
  return <AdhdSection />
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Learn() {
  const [active, setActive] = useState<SectionId>('overview')

  const meta = SECTION_META[active]
  const activeIdx = NAV_ITEMS.findIndex((s) => s.id === active)

  return (
    <div className="learn-page">
      <div className="learn-page__inner">
        <header className="learn-page__header">
          <p className="learn-page__label">Learn</p>
          <h1 className="learn-page__title">The Attention Model</h1>
          <p className="learn-page__subtitle">
            How transformer attention maps onto human cognition — and how each exercise
            trains a distinct component of the system.
          </p>
        </header>

        <div className="learn-layout">
          <nav className="learn-nav" aria-label="Learn sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`learn-nav__btn ${active === item.id ? 'learn-nav__btn--active' : ''}`}
                onClick={() => setActive(item.id)}
                aria-current={active === item.id ? 'true' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="learn-content">
            <div className="learn-card">
              <p className="learn-card__tag">{meta.tag}</p>
              <h2 className="learn-card__title">{meta.title}</h2>
              <div className="learn-card__body">
                <SectionContent id={active} />
              </div>
            </div>

            <div className="learn-nav-row">
              {activeIdx > 0 && (
                <button
                  className="learn-nav-arrow"
                  onClick={() => setActive(NAV_ITEMS[activeIdx - 1].id)}
                >
                  ← {NAV_ITEMS[activeIdx - 1].label}
                </button>
              )}
              {activeIdx < NAV_ITEMS.length - 1 && (
                <button
                  className="learn-nav-arrow learn-nav-arrow--next"
                  onClick={() => setActive(NAV_ITEMS[activeIdx + 1].id)}
                >
                  {NAV_ITEMS[activeIdx + 1].label} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
