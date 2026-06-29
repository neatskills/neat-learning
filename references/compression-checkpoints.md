# Compression Checkpoints

**Purpose:** Consolidate mastered concepts to keep learning maps manageable

**Problem:** Over time, maps with many mastered concepts become cluttered. User has to scroll past 20+ concepts they already know to find what they're learning.

**Solution:** Periodic compression to summarize mastered concepts

## When to Compress

**Trigger conditions:**

- 10+ concepts mastered (Level 5+) AND
- 30+ days since first mastered concept AND
- No reviews due for any mastered concepts

**User prompt:**

```text
You've mastered 12 concepts! 🎉

Your map is getting long. Want to compress mastered concepts into a summary?

[y] Compress (keep learning focused)
[n] Keep detailed (I like seeing everything)
[l] Later (ask again in 7 days)
```

## What Gets Compressed

**Before compression:**

```markdown
### Pod
**Level:** 7 (Can design systems)
**Status:** Mastered
**Review:** Next review in 14 days

[Full activity history: Learn, Synthesize, Practice, Calibrate]

---

### Service
**Level:** 6 (Can explain tradeoffs)
**Status:** Mastered
**Review:** Next review in 10 days

[Full activity history: Learn, Synthesize, Practice, Calibrate]

---

### Deployment
**Level:** 5 (Can teach others)
**Status:** Mastered
**Review:** Next review in 8 days

[Full activity history: Learn, Synthesize, Practice, Calibrate]
```

**After compression:**

```markdown
## Foundation (3 mastered)

**Mastered concepts:**
- **Pod** (Level 7) - Next review: 14 days
- **Service** (Level 6) - Next review: 10 days  
- **Deployment** (Level 5) - Next review: 8 days

*Mastered 2026-06-15 to 2026-07-10. Full history archived.*
```

## What Gets Preserved

**Full history archived to:**
`docs/neat_util_learning/<topic>/archive/<section-name>-mastered-<date>.md`

**Example:**
`docs/neat_util_learning/kubernetes/archive/foundation-mastered-2026-07-15.md`

**Archive format:**

```markdown
# Foundation - Mastered Concepts Archive

Archived: 2026-07-15
Concepts: 3 (Pod, Service, Deployment)

---

### Pod

[Complete activity history preserved]

---

### Service

[Complete activity history preserved]

---

### Deployment

[Complete activity history preserved]
```

## State Updates After Compression

**Compressed concepts in state:**

```yaml
sections:
  - name: Foundation
    compressed: true
    compressed_date: 2026-07-15T00:00:00Z
    archive_path: archive/foundation-mastered-2026-07-15.md
    mastered_count: 3
    concepts:
      - name: Pod
        level: 7
        review_interval: 1209600
        last_activity: 2026-07-01T00:00:00Z
        compressed: true
      - name: Service
        level: 6
        review_interval: 864000
        last_activity: 2026-07-05T00:00:00Z
        compressed: true
      - name: Deployment
        level: 5
        review_interval: 691200
        last_activity: 2026-07-10T00:00:00Z
        compressed: true
```

**What's kept:**

- Concept name, level
- Review scheduling (review_interval, last_activity)
- Compression flag

**What's removed:**

- Full activity history (Learn, Synthesize, Practice, Calibrate details)
- Exercise records
- Performance signals

## Review Handling for Compressed Concepts

**When review is due for compressed concept:**

1. Check if archived
2. If archived and user struggles (< 3/5 correct):
   - Offer to restore full history from archive
   - "You got 2/5 on Pod. Want to see your original learning history? [y/n]"
3. If yes: Load archive, restore concept to active learning
4. If no: Continue as normal, update review interval

## Decompression

**User can request decompression:**

```text
User: "Show me my Pod learning history"

AI: "Pod is in the mastered archive. Want to restore it to active view? [y/n]"

[If yes] Load from archive/foundation-mastered-2026-07-15.md, move Pod back to active
```

## Example Flow

**Session 1 (30 concepts total, 12 mastered):**

```text
AI: "You've mastered 12 concepts! 🎉
     
     Your map is getting long. Want to compress mastered concepts?
     
     [y] Compress (focused)
     [n] Keep detailed
     [l] Later (ask in 7 days)"

User: "y"

AI: "Compressing Foundation (3 mastered) and Core (9 mastered)...
     
     ✓ Archived full history to:
       - archive/foundation-mastered-2026-07-15.md
       - archive/core-mastered-2026-07-15.md
     
     Your map now shows 18 concepts (12 compressed summaries + 6 active).
     Reviews still work normally."
```

**Session 2 (after compression):**

```text
📊 Kubernetes Learning Progress

Foundation (3 mastered, compressed)
  → Pod, Service, Deployment

Core (9 mastered, compressed)
  → 9 concepts mastered

Advanced (6 active):
  → StatefulSet - Level 2 (in Synthesize)
  ○ CronJob - Level 0 (not started)
  ...
```

## Implementation Notes

**Compression is optional.** User can:

- Decline compression (keep everything visible)
- Defer compression (ask again in 7 days)
- Decompress anytime (restore from archive)

**Archives are permanent.** Never delete archived history.

**Review scheduling unaffected.** Compressed concepts still trigger reviews on schedule.

**Compression state is per-section.** Can compress Foundation but keep Core expanded.
