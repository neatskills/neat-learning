# State File Format

**Location:** `./learning/{topic-slug}/map.json`

**Format:** Pure JSON. Read/write via `scripts/map.js` — do not hand-edit.

## Top-Level Schema

```json
{
  "topic": "Kubernetes",
  "goal": "Deploy production applications",
  "domain": "technical",
  "started": "2026-06-27T00:00:00.000Z",
  "last_session": "2026-08-17T10:00:00.000Z",
  "total_sessions": 4,
  "cert": true,
  "domains": [
    { "name": "Cluster Architecture", "weight_pct": 25 },
    { "name": "Troubleshooting",      "weight_pct": 30 }
  ],
  "sections": [...],
  "progress": { "mastered": 3, "total": 12 },
  "learning_stats": { "avg_hours_per_concept": 1.2, "estimated_days_remaining": 4, "sample_size": 3 }
}
```

`cert` and `domains` are present only on cert maps. Omitted on topic maps.

`total_sessions` starts at 0 and is incremented by `endSession`.

## Concept Schema

```json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit",
  "status": "mastered",
  "activity": {
    "learn":      { "date": "...", "correct": 4, "total": 5 },
    "synthesize": { "completed": "..." },
    "practice":   { "date": "..." },
    "calibrate":  { "date": "...", "correct": 2, "attempts": 1 }
  }
}
```

## Status Values

`not-started → learning → practicing → mastered`

Status is derived from the activity chain and cached as `status` on each concept — recomputed and overwritten on every write (`createMap`, `createCertMap`, `recordActivity`, `addConcept`):

| Condition | Status |
| --- | --- |
| No `activity.learn` | `not-started` |
| `learn` present, no `practice` | `learning` |
| `practice` present; no `calibrate` or `calibrate.correct < 2` | `practicing` |
| `calibrate.correct >= 2` | `mastered` |

`synthesize` does not affect status.

## Field Notes

- Dates: ISO 8601 strings
- `calibrate.attempts`: increments on each call; resets when practice is re-recorded after 3 failed attempts
- `progress` and `learning_stats` are recomputed and stored at the top level on every write; `getStatus` returns the stored `learning_stats` value under the key `stats`
