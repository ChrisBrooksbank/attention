# Phase 3: Full Exercise Suite

## Overview

Add Sustained Attention and N-Back exercises, plus difficulty progression and exercise configuration.

## Requirements

### Sustained Attention (Vigilance / SART)
- [ ] Transformer framing: "Stabilize your Query over time"
- [ ] Long sequence of stimuli, targets are rare (~10%)
- [ ] User must maintain focus for 3-10 minutes (configurable)
- [ ] Measures: hit rate over time (vigilance decrement), reaction time variability
- [ ] Key metric: does performance degrade in the second half?
- [ ] Uses ExerciseShell lifecycle

### N-Back Working Memory
- [ ] Transformer framing: "Strengthen your Value retention"
- [ ] Sequence of items; user responds when current item matches N steps back
- [ ] N increases with proficiency (1-back -> 2-back -> 3-back)
- [ ] Configurable N level and sequence length
- [ ] Measures: accuracy at each N level, reaction time
- [ ] Uses ExerciseShell lifecycle

### Difficulty Progression System
- [ ] Track user performance across sessions per exercise type
- [ ] Suggest difficulty increases when accuracy consistently high (>85%)
- [ ] Suggest difficulty decreases when accuracy consistently low (<50%)
- [ ] Difficulty affects: stimulus similarity (CPT), target rarity (SART), N level (N-Back)

### Exercise Configuration UI
- [ ] Train page shows all 3 exercises with transformer framing descriptions
- [ ] Each exercise card shows recommended difficulty based on history
- [ ] User can adjust difficulty, duration, and exercise-specific params before starting

## Acceptance Criteria

- [ ] Sustained Attention exercise is playable with correct scoring
- [ ] N-Back exercise is playable at 1-back, 2-back, and 3-back levels
- [ ] Difficulty suggestions appear based on session history
- [ ] Train page displays all 3 exercises with configuration options
- [ ] All exercise data persists correctly in Dexie

## Out of Scope

- Dual n-back variant (future enhancement)
- Analytics charts (Phase 4)
- Animations (Phase 5)
