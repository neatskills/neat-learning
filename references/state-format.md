# State File Format

**Location:** `./learning/<topic-slug>/map.json`

**Format:** Pure JSON. Read and write via `scripts/map.js` — do not hand-edit fields.

## Top-Level Schema

```json
{
  "topic": "Kubernetes",
  "goal": "Deploy production applications",
  "domain": "technical",
  "last_session": "2026-08-17T10:00:00.000Z",
  "total_sessions": 4,
  "cert": true,
  "domains": [
    { "name": "Cluster Architecture", "weight_pct": 25 },
    { "name": "Troubleshooting",      "weight_pct": 30 }
  ],
  "sections": [...]
}
```

`cert` and `domains` are present only on cert maps. Omitted on topic maps.

`total_sessions` starts at 0 and is incremented by `endSession`.

## Concept Schema

```json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit",
  "activity": {
    "learn":      { "date": "...", "score": 4 },
    "synthesize": { "date": "..." },
    "practice":   { "date": "..." },
    "calibrate":  { "date": "...", "score": 2, "attempts": 1 }
  }
}
```

## Status Values

`not-started → learning → practicing → mastered`

Status is derived on demand from the activity chain — never stored:

| Condition | Status |
|---|---|
| No `activity.learn` | `not-started` |
| `learn` present, no `practice` | `learning` |
| `practice` present; no `calibrate` or `calibrate.score < 2` | `practicing` |
| `calibrate.score >= 2` | `mastered` |

`synthesize` does not affect status.

## Field Notes

- Dates: ISO 8601 strings
- `calibrate.attempts`: increments on each call; resets when practice is re-recorded after 3 failed attempts
- `progress` and `learning_stats` are computed on demand — not stored
