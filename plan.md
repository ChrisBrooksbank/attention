# Attention — App Plan

An attention training PWA that maps transformer attention mechanisms (Query, Key, Value) onto human attention, helping users with ADHD strengthen selective attention, sustained attention, and working memory.

## Core Concept

The transformer "Attention Is All You Need" metaphor is front-and-center:
- **Query** = "What am I looking for?" — the user's current attentional goal
- **Key** = features of each stimulus — what makes a target vs distractor
- **Value** = the information extracted when attention lands correctly
- **Attention Weights** = the user's actual performance — where focus went

In ADHD, the dysfunction sits at the weights step: queries spread too broadly (distractibility), shift before values are processed (task-switching), or values leak from working memory before use.

## Design Principles

- **Calm / minimal** — muted palette, generous whitespace, reduce visual noise (critical for ADHD users)
- **Progressive disclosure** — start simple, reveal complexity as the user grows
- **Offline-first PWA** — installable, works without network, data stays on device
- **Local-only data (Dexie/IndexedDB)** — no accounts, no cloud, total privacy
- **Educational** — the transformer metaphor teaches users *why* each exercise works, not just what to do

## Tech Stack

- **Vite + React 19 + TypeScript** (already scaffolded)
- **Dexie 4** — IndexedDB persistence + React hooks (already installed)
- **Framer Motion** — smooth, calm animations (already installed)
- **React Router 7** — navigation (already installed)
- **nanoid** — session/exercise IDs (already installed)
- **PWA plugin** — vite-plugin-pwa (to add)

## Architecture

```
src/
├── main.tsx
├── App.tsx                    # Layout shell + router
├── db/
│   ├── index.ts               # Dexie database definition
│   └── models.ts              # TypeScript interfaces for stored data
├── components/
│   ├── ui/                    # Shared UI primitives (Button, Card, Timer, etc.)
│   └── exercises/
│       ├── ExerciseShell.tsx   # Common wrapper: instructions → run → results
│       ├── SelectiveAttention.tsx  # CPT-style exercise
│       ├── SustainedAttention.tsx  # Rare-target vigilance exercise
│       └── NBack.tsx              # N-back working memory exercise
├── pages/
│   ├── Home.tsx               # Dashboard / landing
│   ├── Train.tsx              # Exercise selection
│   ├── Session.tsx            # Active exercise session
│   ├── Results.tsx            # Post-session breakdown
│   ├── Analytics.tsx          # Longitudinal trends
│   └── Learn.tsx              # Transformer metaphor explainer
├── hooks/
│   ├── useTimer.ts            # Precise timing for stimulus presentation
│   ├── useSession.ts          # Session lifecycle management
│   └── useAnalytics.ts       # Aggregate stats from Dexie
├── lib/
│   ├── scoring.ts             # Hit/miss/false-alarm/d-prime calculations
│   ├── generators.ts          # Stimulus sequence generators per exercise type
│   └── export.ts              # Data export (JSON/CSV)
└── styles/
    ├── tokens.css             # Design tokens (colors, spacing, type scale)
    └── global.css             # Reset + global styles
```

## Data Model (Dexie)

```typescript
interface Session {
  id: string              // nanoid
  exerciseType: 'selective' | 'sustained' | 'nback'
  startedAt: Date
  completedAt: Date
  difficulty: number      // 1-10 scale
  config: ExerciseConfig  // exercise-specific params
}

interface Trial {
  id: string
  sessionId: string       // FK → Session
  stimulus: string        // what was shown
  isTarget: boolean       // should user have responded?
  responded: boolean      // did user respond?
  reactionTimeMs: number | null
  correct: boolean
  timestamp: Date
}

interface SessionSummary {
  sessionId: string
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  accuracy: number        // (hits + CR) / total
  dPrime: number          // signal detection sensitivity
  meanReactionMs: number
  medianReactionMs: number
}
```

## Exercises

### 1. Selective Attention (CPT — Continuous Performance Task)
- **Transformer framing**: "Train your Query-Key matching"
- Stream of letters/symbols appears one at a time
- User taps/clicks when the target appears (e.g., "press when you see X")
- Distractors increase in similarity to target at higher difficulties
- Measures: hit rate, false alarm rate, d-prime, reaction time

### 2. Sustained Attention (Vigilance / SART)
- **Transformer framing**: "Stabilize your Query over time"
- Long sequence of stimuli, targets are rare (~10%)
- User must maintain focus for 3-10 minutes
- Measures: hit rate over time (vigilance decrement), reaction time variability
- Key metric: does performance degrade in the second half?

### 3. Working Memory (N-Back)
- **Transformer framing**: "Strengthen your Value retention"
- Sequence of items; user responds when current item matches N steps back
- N increases with proficiency (1-back → 2-back → 3-back)
- Dual n-back variant possible (visual position + audio letter)
- Measures: accuracy at each N level, reaction time

## Analytics & Tracking

### Session-Level (Results page)
- Hit / miss / false alarm / correct rejection counts
- Accuracy percentage and d-prime (signal detection theory)
- Reaction time distribution (histogram)
- Attention weight strip: colored dot sequence showing trial-by-trial performance
- Comparison to previous session of same type

### Longitudinal (Analytics page)
- Line charts: accuracy, d-prime, and mean RT over sessions
- Per-exercise-type trends
- Calendar heatmap of training frequency
- Streaks and consistency metrics
- Export to JSON/CSV for personal analysis

## Pages & Navigation

1. **Home** — welcome, today's suggestion, recent session summary, streak
2. **Train** — pick an exercise, see the transformer framing for each
3. **Session** — the active exercise (full-screen, distraction-free)
4. **Results** — post-session breakdown with attention weight strip
5. **Analytics** — longitudinal trends, charts, export
6. **Learn** — interactive explainer mapping Q/K/V to human attention

## PWA Features

- Service worker for offline support
- Web app manifest for installability
- Cache exercise assets for instant load
- No network dependency at any point

## Build Phases

### Phase 1: Foundation
- [ ] Replace template with app shell (layout, nav, routing)
- [ ] Set up Dexie database schema
- [ ] Design token system (calm/minimal palette)
- [ ] PWA configuration (vite-plugin-pwa)

### Phase 2: First Exercise
- [ ] ExerciseShell component (instructions → countdown → run → results flow)
- [ ] Selective Attention (CPT) exercise
- [ ] Scoring engine (hits, misses, false alarms, d-prime)
- [ ] Results page with attention weight strip
- [ ] Session persistence to Dexie

### Phase 3: Full Exercise Suite
- [ ] Sustained Attention exercise
- [ ] N-Back exercise
- [ ] Difficulty progression system
- [ ] Exercise configuration UI

### Phase 4: Analytics
- [ ] Session history list
- [ ] Longitudinal trend charts
- [ ] Calendar heatmap
- [ ] Data export (JSON/CSV)

### Phase 5: Polish
- [ ] Learn page (interactive Q/K/V explainer)
- [ ] Home dashboard with suggestions
- [ ] Animations and transitions (Framer Motion)
- [ ] Accessibility audit (keyboard nav, screen readers, reduced motion)
- [ ] Performance optimization
