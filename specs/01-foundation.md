# Phase 1: Foundation

## Overview

Set up the app shell, database, design system, and PWA configuration.

## Requirements

- [ ] Replace Vite template with app shell (layout component with header/nav)
- [ ] Set up React Router with routes: Home, Train, Session, Results, Analytics, Learn
- [ ] Create Dexie database schema with Session, Trial, and SessionSummary tables
- [ ] Define TypeScript interfaces for all data models (Session, Trial, SessionSummary, ExerciseConfig)
- [ ] Create design token system in CSS (calm/minimal palette, muted colors, generous whitespace)
- [ ] Set up global CSS reset and base styles
- [ ] Add vite-plugin-pwa for offline support, service worker, and web app manifest
- [ ] Ensure app is installable and works without network

## Data Model

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
  sessionId: string       // FK -> Session
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

## Design Principles

- Calm / minimal — muted palette, generous whitespace, reduce visual noise
- Progressive disclosure — start simple, reveal complexity as the user grows
- ADHD-friendly — minimize distractions in the UI itself

## Acceptance Criteria

- [ ] App loads with layout shell, header, and working navigation
- [ ] All 6 routes render placeholder pages
- [ ] Dexie database initializes without errors
- [ ] Design tokens are applied globally (colors, spacing, typography)
- [ ] App passes Lighthouse PWA audit (installable, offline-capable)

## Out of Scope

- Exercise implementations (Phase 2-3)
- Analytics charts (Phase 4)
- Animations (Phase 5)
