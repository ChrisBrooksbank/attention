# CLAUDE.md

## Project Overview

Attention Trainer — a PWA for training attention using selective, sustained, and N-back exercises, framed through the Q/K/V attention mechanism from transformer neural networks.

**Live:** https://attention-app.netlify.app

## Tech Stack

- React 19 + TypeScript
- Vite
- Framer Motion (animations)
- Dexie (IndexedDB wrapper for local data persistence)
- PWA — offline-first, installable

## Development Commands

```bash
npm install
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run check      # Run lint, typecheck, test, format
```

## Architecture

- `src/exercises/` — Selective, Sustained, N-Back exercise components
- `src/db/` — Dexie schema for session results
- `src/components/` — Shared UI components
- `public/` — PWA manifest and icons

## Data Storage

All data (session results, settings) is stored locally in IndexedDB via Dexie. No server, no accounts, no telemetry.

## Deployment

Deployed on Netlify. Auto-deploys from main branch.
