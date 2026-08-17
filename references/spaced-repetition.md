# Spaced Repetition System

**Purpose:** Prevent forgetting through timed reviews

**Key principle:** Review just before you would forget

## Review Intervals

| Performance | Next Interval | Reasoning |
| ------------- | --------------- | ----------- |
| **Perfect (5/5)** | 2x current | Strong recall, longer gap |
| **Good (4/5)** | 1.5x current | Solid recall, moderate increase |
| **OK (3/5)** | Same interval | Barely remembered, don't extend |
| **Weak (<3/5)** | Half current | Forgot too much, review sooner |

With a different question count, apply the same bands by ratio:
100% = 2x, 80-99% = 1.5x, 60-79% = same, below 60% = half.

**Initial:** 2 days (172800s) after Calibrate
**Max:** 60 days (5184000s)
**Min:** 1 day (86400s)

## Interval Calculation

`updateReviewInterval` in `scripts/activity-updater.js` implements these rules
(including clamping) and sets `last_activity` - use it instead of computing manually:

```javascript
const { updateReviewInterval } = require('./scripts/activity-updater.js');
updateReviewInterval(concept, correct, total);
```

The initial 2-day interval is set automatically by `recordCalibrate` when the
concept reaches mastered.

## Due Calculation

Apply inline at session start:

```javascript
const elapsedMs = Date.now() - new Date(concept.last_activity).getTime()
const isDue = elapsedMs >= concept.review_interval * 1000
const isOverdue = elapsedMs > concept.review_interval * 1000 * 1.2  // 20% grace
```

Iterate all mastered concepts, collect those where `isDue`, sort most-overdue first
(highest `elapsedMs - review_interval * 1000`). Present them in the session status
(see the returning-session template in SKILL.md).

## Review Activity

**Same as Learn:** 5 predictive questions, track performance, update interval and date

**State update:** record via `updateReviewInterval(concept, correct, total)` - it
adjusts `review_interval` and refreshes `last_activity`.

## State Format

**In concept frontmatter:**

```yaml
review_interval: 345600  # seconds (4 days)
last_activity: '2026-06-27T00:00:00.000Z'
```

**Calculated fields (not stored):**

- `next_review`: last_activity + review_interval
- `days_until_review`: (next_review - now) / 86400
- `is_due`: now >= next_review
- `is_overdue`: now > next_review + review_interval * 0.2 (20% grace)

## Example Progression

| Day | Review | Performance | Interval | Next Review |
| ----- | -------- | ------------- | ---------- | ------------- |
| 0 | Calibrate passed | - | 2 days | Day 2 |
| 2 | 5/5 | 1.0, doubles | 4 days | Day 6 |
| 6 | 4/5 | 0.8, 1.5x | 6 days | Day 12 |
| 12 | 3/5 | 0.6, same | 6 days | Day 18 |
| 20 | 1/5 (overdue) | 0.2, halves | 3 days | Day 23 |

## Notes

- Reviews always use Learn activity (questions)
- Never use Synthesize/Practice/Calibrate for reviews
- Interval stored in seconds for precision
- Dates in ISO 8601 format
- Max interval prevents indefinite gaps
- Min interval prevents review spam
