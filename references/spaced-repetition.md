# Spaced Repetition System

**Purpose:** Prevent forgetting through timed reviews

**Key principle:** Review just before you would forget

## Review Intervals

| Performance | Next Interval | Reasoning |
| ------------- | --------------- | ----------- |
| **Perfect (5/5)** | 2× current | Strong recall → longer gap |
| **Good (4/5)** | 1.5× current | Solid recall → moderate increase |
| **OK (3/5)** | Same interval | Barely remembered → don't extend |
| **Weak (<3/5)** | ÷2 current | Forgot too much → review sooner |

**Initial:** 2 days (172800s) after Calibrate  
**Max:** 60 days (5184000s)  
**Min:** 1 day (86400s)

## Interval Calculation

**After Calibrate (initial):**

```javascript
concept.review_interval = 172800  // 2 days
concept.last_activity = new Date().toISOString()
```text

**After review:**

```javascript
const performance = correct / total

if (performance >= 0.8) {
  concept.review_interval *= 2
} else if (performance >= 0.6) {
  concept.review_interval *= 1.5
} else if (performance >= 0.4) {
  // keep same
} else {
  concept.review_interval /= 2
}

// Clamp to min/max
concept.review_interval = Math.max(86400, Math.min(5184000, concept.review_interval))
concept.last_activity = new Date().toISOString()
```text

## Due Calculation

```javascript
const elapsed = Date.now() - new Date(concept.activity.date).getTime()
const isDue = elapsed >= concept.review_interval * 1000
const isOverdue = elapsed > concept.review_interval * 1.2  // 20% grace
```text

## Session Start Review

**Calculate due concepts:**

```javascript
concepts
  .filter(c => c.level >= 5)  // mastered only
  .filter(c => {
    const elapsed = Date.now() - new Date(c.activity.date).getTime()
    return elapsed >= c.review_interval * 1000
  })
  .sort((a, b) => {
    // Most overdue first
    const aOverdue = Date.now() - new Date(a.activity.date).getTime() - a.review_interval * 1000
    const bOverdue = Date.now() - new Date(b.activity.date).getTime() - b.review_interval * 1000
    return bOverdue - aOverdue
  })
```text

**Present status:**

```text
Welcome back! Last session: 3 days ago

📌 Due for review (2 concepts):
- Pod (mastered, due 1 day ago)
- Deployment (mastered, overdue 3 days ago)

Want to review before continuing? [y/n/menu]
```text

## Review Activity

**Same as Learn:** 5 predictive questions, track performance, update interval and date

**State update:**

```markdown
#### Review (Learn)
date: 2026-06-27T00:00:00Z
questions: {correct: 5, total: 5}
next_review: 2026-07-01T00:00:00Z  // 4 days (2 × 2)

Perfect recall. Extended review interval.
```text

## State Format

**In concept frontmatter:**

```yaml
review_interval: 345600  # seconds (4 days)
last_activity: 2026-06-27T00:00:00Z
```text

**Calculated fields (not stored):**

- `next_review`: last_activity + review_interval
- `days_until_review`: (next_review - now) / 86400
- `is_due`: now >= next_review
- `is_overdue`: now > next_review * 1.2

## Example Progression

| Day | Review | Performance | Interval | Next Review |
| ----- | -------- | ------------- | ---------- | ------------- |
| 0 | Calibrate passed | - | 2 days | Day 2 |
| 2 | 5/5 | 1.0 → 2× | 4 days | Day 6 |
| 6 | 4/5 | 0.8 → 1.5× | 6 days | Day 12 |
| 12 | 2/5 | 0.4 → same | 6 days | Day 18 |
| 20 | 1/5 (overdue) | 0.2 → ÷2 | 3 days | Day 23 |

## Notes

- Reviews always use Learn activity (questions)
- Never use Synthesize/Practice/Calibrate for reviews
- Interval stored in seconds for precision
- Dates in ISO 8601 format
- Max interval prevents indefinite gaps
- Min interval prevents review spam
