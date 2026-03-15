# Phase 5: Polish

## Overview

Add the Learn page, Home dashboard, animations, accessibility, and performance optimization.

## Requirements

### Learn Page (Interactive Q/K/V Explainer)
- [ ] Interactive explainer mapping transformer Q/K/V to human attention
- [ ] Query = "What am I looking for?" (attentional goal)
- [ ] Key = features of each stimulus (target vs distractor properties)
- [ ] Value = information extracted when attention lands correctly
- [ ] Attention Weights = user's actual performance (where focus went)
- [ ] Explain ADHD connection: weights spread too broadly (distractibility), shift before values processed (task-switching), values leak from working memory
- [ ] Visual/interactive elements to make concepts tangible

### Home Dashboard
- [ ] Welcome message
- [ ] Today's training suggestion based on history
- [ ] Recent session summary (last 1-3 sessions)
- [ ] Current streak display
- [ ] Quick-start buttons for each exercise

### Animations and Transitions (Framer Motion)
- [ ] Page transitions (smooth route changes)
- [ ] Exercise stimulus animations (appear/disappear)
- [ ] Results reveal animations
- [ ] Micro-interactions on buttons and cards
- [ ] Respect prefers-reduced-motion media query

### Accessibility
- [ ] Full keyboard navigation for all exercises
- [ ] Screen reader support (ARIA labels, live regions for exercise stimuli)
- [ ] Sufficient color contrast (WCAG AA minimum)
- [ ] Focus indicators visible on all interactive elements
- [ ] prefers-reduced-motion support (disable animations)

### Performance Optimization
- [ ] Code splitting per route (lazy loading)
- [ ] Optimize Dexie queries (indexes on frequently queried fields)
- [ ] Service worker caching strategy for assets
- [ ] Lighthouse performance score > 90

## Acceptance Criteria

- [ ] Learn page clearly explains Q/K/V metaphor with interactive elements
- [ ] Home dashboard shows personalized content based on session history
- [ ] Animations are smooth and respect reduced-motion preference
- [ ] App passes WCAG AA accessibility audit
- [ ] Lighthouse scores: Performance > 90, Accessibility > 90, PWA badge

## Out of Scope

- User accounts or authentication
- Cloud sync
- Social features
- Native mobile app
