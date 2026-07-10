# Compression Checkpoints

**Purpose:** Consolidate mastered concepts to keep learning maps manageable

## When to Compress

**Trigger:** 10+ concepts mastered AND 30+ days since first mastered AND no reviews due

`shouldOfferCompression(sections, started)` in `scripts/compression.js` checks this:

```javascript
const { shouldOfferCompression, compressSection } = require('./scripts/compression.js');
const { shouldOffer, masteredCount } = shouldOfferCompression(data.sections, data.started);
```

**User prompt:**

```text
You've mastered 12 concepts!
Your map is getting long. Compress mastered concepts into summary?

[y] Compress (focused)
[n] Keep detailed
[l] Later (ask in 7 days)
```

## What Gets Compressed

`compressSection(section, archivePath)` writes the full activity history to an
archive file and strips compressed concepts down to review-scheduling fields.

**Before:** each mastered concept carries its full `activity` history.

**After (map display):**

```markdown
## Foundation (3 mastered)

**Mastered concepts:**

- **Pod** (mastered) - Next review: 14 days
- **Service** (mastered) - Next review: 10 days
- **Deployment** (mastered) - Next review: 8 days

*Mastered 2026-06-15 to 2026-07-10. Full history archived.*
```

## Archive Location

**Path:** `docs/neat_learning/<topic>/archive/<section-name>-mastered-<date>.md`

**Example:** `docs/neat_learning/kubernetes/archive/foundation-mastered-2026-07-15.md`

**Preserved:** Complete activity history for all compressed concepts

## State Updates

**Compressed concepts:**

```yaml
sections:
  - name: Foundation
    compressed: true
    compressed_date: '2026-07-15T00:00:00.000Z'
    archive_path: archive/foundation-mastered-2026-07-15.md
    mastered_count: 3
    concepts:
      - name: Pod
        status: mastered
        review_interval: 1209600
        last_activity: '2026-07-01T00:00:00.000Z'
        compressed: true
```

**Kept:** Name, status, review scheduling, compression flag
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

Use `decompressConcept(conceptName, archiveFullPath)` from `scripts/compression.js`.

## Implementation Notes

- **Optional:** User can decline, defer (7 days), or decompress anytime
- **Archives permanent:** Never delete archived history
- **Reviews unaffected:** Compressed concepts still trigger on schedule
- **Per-section:** Can compress Foundation but keep Core expanded
