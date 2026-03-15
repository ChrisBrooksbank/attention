# AGENTS.md - Operational Guide

Keep this file under 60 lines. It's loaded every iteration.

## Tech Stack

- Vite 8 + React 19 + TypeScript 5.9
- Dexie 4 (IndexedDB) + dexie-react-hooks
- Framer Motion 12
- React Router 7
- nanoid for IDs

## Build Commands

```bash
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build
npm run preview        # Preview production build
```

## Validation (run before committing)

```bash
npx tsc -b && npx eslint .
```

## Lint

```bash
npm run lint           # ESLint
```

## Project Structure

```
src/
  main.tsx             # Entry point
  App.tsx              # Layout shell + router
  db/                  # Dexie database + models
  components/
    ui/                # Shared UI primitives
    exercises/         # Exercise components
  pages/               # Route pages
  hooks/               # Custom React hooks
  lib/                 # Scoring, generators, export
  styles/              # CSS tokens + globals
```

## Project Notes

- Offline-first PWA — no network dependencies
- Local-only data via Dexie/IndexedDB — no accounts, no cloud
- Calm/minimal design — muted palette, generous whitespace
- Transformer attention metaphor (Q/K/V) maps onto exercise framing
