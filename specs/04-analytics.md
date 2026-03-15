# Phase 4: Analytics

## Overview

Build session history, longitudinal trend charts, calendar heatmap, and data export.

## Requirements

### Session History
- [ ] List all past sessions with date, exercise type, difficulty, and key metrics
- [ ] Sortable and filterable by exercise type and date range
- [ ] Tap a session to see its full Results page

### Longitudinal Trend Charts
- [ ] Line charts showing accuracy over sessions (per exercise type)
- [ ] Line charts showing d-prime over sessions
- [ ] Line charts showing mean reaction time over sessions
- [ ] Selectable time range (last 7 days, 30 days, all time)

### Calendar Heatmap
- [ ] Grid showing training frequency by day
- [ ] Color intensity reflects number of sessions that day
- [ ] Streak counter (consecutive days with at least one session)

### Consistency Metrics
- [ ] Current streak (consecutive training days)
- [ ] Longest streak
- [ ] Total sessions completed
- [ ] Average sessions per week

### Data Export
- [ ] Export all session data as JSON
- [ ] Export all session data as CSV
- [ ] Download triggers a file save dialog

### useAnalytics Hook
- [ ] Aggregate stats from Dexie for charts and metrics
- [ ] Efficient queries (don't load all trials for summary views)

## Acceptance Criteria

- [ ] Analytics page shows trend charts for each exercise type
- [ ] Calendar heatmap renders correctly with real session data
- [ ] Streak and consistency metrics are accurate
- [ ] JSON and CSV exports contain complete session data
- [ ] Charts update when new sessions are completed

## Out of Scope

- Cloud sync or sharing
- Comparison with other users
- Predictive analytics
