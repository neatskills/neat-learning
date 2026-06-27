# Spaced Repetition System

**Purpose:** Prevent forgetting through timed reviews

**Key principle:** Review just before you would forget

## Review Intervals

Based on performance after each review:

| Performance | Next Interval | Reasoning |
|-------------|---------------|-----------|
| **Perfect (5/5)** | 2× current | Strong recall → longer gap |
| **Good (4/5)** | 1.5× current | Solid recall → moderate increase |
| **OK (3/5)** | Same interval | Barely remembered → don't extend |
| **Weak (<3/5)** | ÷2 current | Forgot too much → review sooner |

**Initial interval:** 2 days (172800 seconds) after Calibrate

**Max interval:** 60 days (5184000 seconds)
**Min interval:** 1 day (86400 seconds)

## Review Schedule Calculation

**After Calibrate passes (initial):**
```javascript
concept.review_interval = 172800  // 2 days in seconds
concept.last_activity = new Date().toISOString()
```

**After review session:**
```javascript
const performance = correct / total

if (performance >= 0.8) {  // 4/5+
  concept.review_interval *= 2
} else if (performance >= 0.6) {  // 3/5
  concept.review_interval *= 1.5
} else if (performance >= 0.4) {  // 2/5
  // keep same
} else {  // <2/5
  concept.review_interval /= 2
}

// Clamp
concept.review_interval = Math.max(86400, Math.min(5184000, concept.review_interval))
concept.last_activity = new Date().toISOString()
```

## Due Calculation

**On returning session:**

```javascript
const now = Date.now()
const lastActivity = new Date(concept.activity.date).getTime()
const elapsed = now - lastActivity  // milliseconds
const reviewInterval = concept.review_interval * 1000  // convert to ms

const isDue = elapsed >= reviewInterval
const isOverdue = elapsed > reviewInterval * 1.2  // 20% grace period
```

## Review Types

**Due for review:** Run Discover activity (5 questions)

**Not due:** Continue with next concept or Practice/Calibrate

**Overdue (>20% past due):** Flag urgently:

```text
⚠️ Overdue for review:
- [Concept] (due 3 days ago)

Review now to prevent knowledge decay.
```

## Session Start Review

**Step 1: Calculate due concepts**

```javascript
concepts
  .filter(c => c.level >= 5)  // only mastered concepts
  .filter(c => {
    const elapsed = Date.now() - new Date(c.activity.date).getTime()
    return elapsed >= c.review_interval * 1000
  })
  .sort((a, b) => {
    // Sort by overdue amount (most overdue first)
    const aOverdue = Date.now() - new Date(a.activity.date).getTime() - a.review_interval * 1000
    const bOverdue = Date.now() - new Date(b.activity.date).getTime() - b.review_interval * 1000
    return bOverdue - aOverdue
  })
```

**Step 2: Present status**

```text
Welcome back! Last session: 3 days ago

📌 Due for review (2 concepts):
- Pod (mastered, due 1 day ago)
- Deployment (mastered, overdue 3 days ago)

Want to review before continuing? [y/n/menu]
```

**If user selects [y]:** Run Discover review for each concept in order

**If user selects [n]:** Continue with next learning activity

**If user selects [menu]:** Show full map, let user navigate

## Review Activity

**Same as Discover activity:**
1. Ask 5 predictive questions
2. Track performance (correct/total)
3. Update review interval based on performance
4. Update last_activity date

**State update after review:**

```markdown
#### Review (Discover)
date: 2026-06-27T00:00:00Z
questions:
  correct: 5
  total: 5
next_review: 2026-07-01T00:00:00Z  // 4 days (2 days × 2)

Perfect recall. Extended review interval.
```

## State Format

**In concept frontmatter:**

```yaml
review_interval: 345600  # seconds (4 days)
last_activity: 2026-06-27T00:00:00Z
```

**Calculated fields (not stored):**
- `next_review`: last_activity + review_interval
- `days_until_review`: (next_review - now) / 86400
- `is_due`: now >= next_review
- `is_overdue`: now > next_review * 1.2

## Example Review Progression

**Day 0 (Calibrate passed):**
- review_interval: 172800 (2 days)
- next_review: Day 2

**Day 2 (Review: 5/5):**
- Performance: 1.0 → 2× interval
- review_interval: 345600 (4 days)
- next_review: Day 6

**Day 6 (Review: 4/5):**
- Performance: 0.8 → 1.5× interval
- review_interval: 518400 (6 days)
- next_review: Day 12

**Day 12 (Review: 2/5):**
- Performance: 0.4 → keep same
- review_interval: 518400 (6 days)
- next_review: Day 18

**Day 20 (Review: 1/5, overdue 2 days):**
- Performance: 0.2 → ÷2 interval
- review_interval: 259200 (3 days)
- next_review: Day 23

## Notes

- Reviews always use Discover activity (questions)
- Never use Name/Practice/Calibrate for reviews
- Review interval stored in seconds for precision
- Dates stored in ISO 8601 format
- Max interval (60 days) prevents indefinite gaps
- Min interval (1 day) prevents review spam
