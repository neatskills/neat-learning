# State File Format

**Location:** `docs/neat_learning/<topic-slug>/map.json`

**Format:** Pure JSON. Read and write via `scripts/map.js` — do not hand-edit fields.

**Slug rule:** `topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

## Top-Level Schema

```json
{
  "topic": "Kubernetes",
  "goal": "Deploy production applications",
  "domain": "technical",
  "started": "2026-08-17T10:00:00.000Z",
  "last_session": "2026-08-17T10:00:00.000Z",
  "total_sessions": 4,
  "progress": { "mastered": 3, "total": 8 },
  "learning_stats": {
    "avg_hours_per_concept": 2.1,
    "estimated_days_remaining": 12,
    "sample_size": 3,
    "last_calculated": "2026-08-17T10:00:00.000Z"
  },
  "sections": [...]
}
```

`learning_stats` is `null` until the first concept completes the full activity chain (learn → synthesize → practice → calibrate passed).

`total_sessions` starts at 0 and is incremented by `endSession` — value N means N sessions have ended.

## Concept Schema

```json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit",
  "status": "not-started",
  "dependencies": { "requires": [], "enables": ["Deployments"] },
  "activity": {
    "learn":      { "date": "...", "correct": 4, "total": 5 },
    "synthesize": { "completed": "..." },
    "practice":   { "date": "...", "independence": true },
    "calibrate":  { "date": "...", "correct": 2, "total": 3, "attempts": 1 }
  }
}
```

## Status Values

`not-started → learning → practicing → mastered`

Status is derived from the activity chain — it is stored for convenience but always matches:

| Condition | Status |
|---|---|
| No `activity.learn` | `not-started` |
| `learn` present, no `practice` | `learning` |
| `practice` present; no `calibrate` or `calibrate.correct < 2` | `practicing` |
| `calibrate.correct >= 2` | `mastered` |

Note: `synthesize` does not affect status.

## Field Types

- Dates: ISO 8601 strings (`2026-08-17T10:00:00.000Z`)
- `calibrate.total`: always `3`
- `calibrate.attempts`: increments on each call; resets when practice is re-recorded after cap
- `practice.independence`: boolean — true if the learner worked without hints
