# Compression Checkpoints

**Purpose:** Consolidate mastered concepts to keep learning maps manageable

## When to Compress

**Trigger:** 10+ concepts mastered (Level 5+) AND 30+ days since first mastered AND no reviews due

**User prompt:**

```
You've mastered 12 concepts! 🎉
Your map is getting long. Compress mastered concepts into summary?

[y] Compress (focused)
[n] Keep detailed
[l] Later (ask in 7 days)
```

## What Gets Compressed

**Before:**

```markdown
### Pod
Level: 7 | Status: Mastered | Review: 14 days
[Full activity history...]

### Service
Level: 6 | Status: Mastered | Review: 10 days
[Full activity history...]
```

**After:**

```markdown
## Foundation (3 mastered)

**Mastered concepts:**
- **Pod** (Level 7) - Next review: 14 days
- **Service** (Level 6) - Next review: 10 days  
- **Deployment** (Level 5) - Next review: 8 days

*Mastered 2026-06-15 to 2026-07-10. Full history archived.*
```

## Archive Location

**Path:** `docs/neat_util_learning/<topic>/archive/<section-name>-mastered-<date>.md`

**Example:** `docs/neat_util_learning/kubernetes/archive/foundation-mastered-2026-07-15.md`

**Preserved:** Complete activity history for all compressed concepts

## State Updates

**Compressed concepts:**

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
```

**Kept:** Name, level, review scheduling, compression flag  
**Removed:** Activity history, exercise records, performance signals

## Review Handling

**When review due for compressed concept:**

1. Check if archived
2. If user struggles (<3/5): "You got 2/5 on Pod. Want to see your original learning history? [y/n]"
3. If yes: Load archive, restore to active learning
4. If no: Continue, update review interval

## Decompression

**User request:** "Show me my Pod learning history"  
**AI:** "Pod is in the mastered archive. Want to restore it to active view? [y/n]"

## Implementation Notes

- **Optional:** User can decline, defer (7 days), or decompress anytime
- **Archives permanent:** Never delete archived history
- **Reviews unaffected:** Compressed concepts still trigger on schedule
- **Per-section:** Can compress Foundation but keep Core expanded
