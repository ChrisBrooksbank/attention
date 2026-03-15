# Phase 2: First Exercise

## Overview

Build the ExerciseShell component and the Selective Attention (CPT) exercise with scoring and results.

## Requirements

### ExerciseShell Component
- [ ] Create ExerciseShell that manages the exercise lifecycle: instructions -> countdown -> run -> results
- [ ] Instructions screen shows exercise name, transformer framing, and how to play
- [ ] Countdown (3-2-1) before exercise starts
- [ ] During run, ExerciseShell provides timing and captures user responses
- [ ] After completion, transition to results display

### Selective Attention (CPT) Exercise
- [ ] Stream of letters/symbols appears one at a time (configurable interval)
- [ ] User taps/clicks when the target appears (e.g., "press when you see X")
- [ ] Transformer framing: "Train your Query-Key matching"
- [ ] Distractors increase in similarity to target at higher difficulties
- [ ] Configurable parameters: stimulus count, display duration, target ratio, difficulty level

### Stimulus Generator
- [ ] Generate randomized sequences with controlled target ratio (~20-30% targets)
- [ ] At higher difficulties, distractors are visually similar to target
- [ ] Sequences are reproducible given a seed (for consistency)

### Scoring Engine
- [ ] Calculate hits (correct target responses)
- [ ] Calculate misses (missed targets)
- [ ] Calculate false alarms (responded to non-target)
- [ ] Calculate correct rejections (correctly ignored non-target)
- [ ] Calculate accuracy: (hits + CR) / total
- [ ] Calculate d-prime (signal detection sensitivity)
- [ ] Calculate mean and median reaction time

### Results Page
- [ ] Display all scoring metrics
- [ ] Attention weight strip: colored dot sequence showing trial-by-trial performance
- [ ] Comparison to previous session of same type (if exists)

### Session Persistence
- [ ] Save Session record to Dexie on completion
- [ ] Save all Trial records to Dexie
- [ ] Save SessionSummary to Dexie

## Acceptance Criteria

- [ ] Can start and complete a Selective Attention exercise
- [ ] Results page shows accurate hit/miss/FA/CR counts and d-prime
- [ ] Attention weight strip visually shows trial-by-trial performance
- [ ] Session data persists in IndexedDB across page reloads
- [ ] Validation passes: `npx tsc -b && npx eslint .`

## Out of Scope

- Sustained Attention exercise (Phase 3)
- N-Back exercise (Phase 3)
- Longitudinal analytics (Phase 4)
