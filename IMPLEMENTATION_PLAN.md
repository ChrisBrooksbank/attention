# Implementation Plan

## Status

- Planning iterations: 1
- Build iterations: 0
- Last updated: 2026-03-15

## Tasks

### Phase 1: Foundation

- [x] Install vite-plugin-pwa and add PWA config to vite.config.ts (spec: 01-foundation.md)
- [x] Create src/styles/tokens.css — design tokens (calm/muted palette, spacing, type scale) (spec: 01-foundation.md)
- [x] Create src/styles/global.css — CSS reset and global base styles (spec: 01-foundation.md)
- [x] Create src/db/models.ts — TypeScript interfaces: Session, Trial, SessionSummary, ExerciseConfig (spec: 01-foundation.md)
- [x] Create src/db/index.ts — Dexie database class with sessions/trials/sessionSummaries tables and indexes (spec: 01-foundation.md)
- [x] Rewrite src/App.tsx — app shell with React Router layout, persistent nav bar, and 6 routes (spec: 01-foundation.md)
- [x] Create src/pages/Home.tsx — placeholder page (spec: 01-foundation.md)
- [x] Create src/pages/Train.tsx — placeholder page (spec: 01-foundation.md)
- [x] Create src/pages/Session.tsx — placeholder page (spec: 01-foundation.md)
- [x] Create src/pages/Results.tsx — placeholder page (spec: 01-foundation.md)
- [x] Create src/pages/Analytics.tsx — placeholder page (spec: 01-foundation.md)
- [x] Create src/pages/Learn.tsx — placeholder page (spec: 01-foundation.md)
- [x] Add web app manifest and service worker for offline PWA support (spec: 01-foundation.md)

### Phase 2: First Exercise

- [x] Create src/lib/scoring.ts — hits/misses/false-alarms/correct-rejections/accuracy/d-prime/RT calculations (spec: 02-first-exercise.md)
- [x] Create src/lib/generators.ts — stimulus sequence generator for Selective Attention (CPT) (spec: 02-first-exercise.md)
- [x] Create src/hooks/useTimer.ts — precise stimulus timing hook (spec: 02-first-exercise.md)
- [x] Create src/hooks/useSession.ts — session lifecycle hook (instructions→countdown→run→complete) (spec: 02-first-exercise.md)
- [x] Create src/components/exercises/ExerciseShell.tsx — wrapper: instructions → countdown → run → results flow (spec: 02-first-exercise.md)
- [x] Create src/components/exercises/SelectiveAttention.tsx — CPT exercise (stream of letters, tap target) (spec: 02-first-exercise.md)
- [x] Build out src/pages/Results.tsx — attention weight strip, hit/miss/FA/CR counts, accuracy, d-prime, RT (spec: 02-first-exercise.md)
- [x] Persist session and trials to Dexie after exercise completion (spec: 02-first-exercise.md)

### Phase 3: Full Exercise Suite

- [x] Create src/lib/generators.ts entries for Sustained Attention (rare-target vigilance, ~10% targets) (spec: 03-full-exercise-suite.md)
- [x] Create src/components/exercises/SustainedAttention.tsx — vigilance/SART exercise with long sequences (spec: 03-full-exercise-suite.md)
- [x] Create src/lib/generators.ts entries for N-Back working memory sequences (spec: 03-full-exercise-suite.md)
- [x] Create src/components/exercises/NBack.tsx — N-back exercise with configurable N level (spec: 03-full-exercise-suite.md)
- [x] Implement difficulty progression logic — >85% accuracy → suggest increase, <50% → suggest decrease (spec: 03-full-exercise-suite.md)
- [x] Build out src/pages/Train.tsx — exercise selection cards with transformer framing, difficulty badges, recommendations (spec: 03-full-exercise-suite.md)
- [x] Build out src/pages/Session.tsx — routes to correct exercise component based on type param (spec: 03-full-exercise-suite.md)

### Phase 4: Analytics

- [x] Create src/hooks/useAnalytics.ts — aggregate stats queries from Dexie (spec: 04-analytics.md)
- [x] Create src/lib/export.ts — JSON and CSV export functions (spec: 04-analytics.md)
- [x] Build out src/pages/Analytics.tsx — session history list (sortable/filterable) (spec: 04-analytics.md)
- [x] Add longitudinal trend charts to Analytics — accuracy/d-prime/RT per exercise type with time range selector (spec: 04-analytics.md)
- [x] Add calendar heatmap to Analytics — training frequency visualization (spec: 04-analytics.md)
- [x] Add consistency metrics to Analytics — streaks, total sessions, avg sessions/week (spec: 04-analytics.md)
- [ ] Add data export buttons (JSON/CSV) to Analytics page (spec: 04-analytics.md)

### Phase 5: Polish

- [ ] Build out src/pages/Learn.tsx — interactive Q/K/V explainer mapping transformer attention to human attention and ADHD (spec: 05-polish.md)
- [ ] Build out src/pages/Home.tsx — welcome, today's suggestion, recent sessions summary, streak display (spec: 05-polish.md)
- [ ] Add Framer Motion animations — page transitions, stimulus animations, results reveal (spec: 05-polish.md)
- [ ] Add reduced-motion support via prefers-reduced-motion media query (spec: 05-polish.md)
- [ ] Accessibility audit — keyboard navigation, ARIA labels, WCAG AA color contrast (spec: 05-polish.md)
- [ ] Performance optimization — code splitting, Dexie query optimization, service worker caching strategy (spec: 05-polish.md)

## Completed

<!-- Completed tasks move here -->

## Notes

### Architecture Decisions
- **Current state**: Bare Vite+React TypeScript starter. No app code exists — everything must be built from scratch.
- **Installed packages** (already in package.json): React 19, Dexie 4, Framer Motion, React Router 7, nanoid. Need to add vite-plugin-pwa.
- **File structure**: Follow the architecture from plan.md — db/, components/exercises/, pages/, hooks/, lib/, styles/
- **CSS approach**: CSS custom properties via tokens.css; no CSS-in-JS. Calm/minimal palette for ADHD users.
- **Data**: All local via Dexie/IndexedDB — no backend, no auth, full privacy.
- **Routing**: React Router 7. Session page takes exercise type as route param.
- **Scoring**: Use signal detection theory — d-prime = Z(hit rate) - Z(false alarm rate). Handle edge cases (0% or 100% rates) with 0.5 correction.
- **Generators**: generators.ts handles all three exercise types; scoring.ts is exercise-agnostic.
- **Task ordering**: Phase 1 → 2 → 3 → 4 → 5 strictly (each phase depends on prior). Within phases, infrastructure (db, lib) before components before pages.
