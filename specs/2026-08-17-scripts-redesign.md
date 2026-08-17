# Scripts Redesign — neat-learning

**Date:** 2026-08-17  
**Status:** Approved, ready for implementation

## Context

The current scripts grew organically — 5 files with unclear boundaries, a dead YAML+markdown state format, spaced repetition scheduling nobody asked for, and multi-goal support that adds complexity without meaningful use cases. This spec replaces all of it with two focused files and zero external dependencies.

## Decisions

| Question | Decision | Reason |
|---|---|---|
| State format | Pure JSON | Claude-only consumer; markdown body was never read back |
| API granularity | Coarse-grained, atomic | Claude describes what happened; system handles load+mutate+save |
| Spaced repetition | Removed | User-initiated reviews only; no scheduling needed |
| Multiple goals per topic | Removed | Weak use case; separate topic slugs serve the same need more cleanly |
| Compression | Removed | Maps stay small as pure JSON; fragile archive parser not worth keeping |
| External dependencies | Zero | gray-matter was the only dependency; pure Node.js built-ins suffice |

## Domain Model

One JSON file per topic at `docs/neat_learning/{topic-slug}/map.json`.

### Map (top-level)

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
    "confidence": "medium",
    "last_calculated": "2026-08-17T10:00:00.000Z"
  },
  "sections": [...]
}
```

### Concept (inside sections[].concepts[])

```json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit in Kubernetes",
  "status": "not-started",
  "dependencies": { "requires": [], "enables": ["Deployments"] },
  "activity": {
    "learn":      { "date": "...", "correct": 4, "total": 5 },
    "synthesize": { "completed": "..." },
    "practice":   { "date": "...", "independence": true },
    "calibrate":  { "date": "...", "correct": 2, "total": 3 }
  }
}
```

**Status values:** `not-started → learning → practicing → mastered`

**Status derivation rule (from activity chain):**
- No `activity.learn` → `not-started`
- `learn` present, no `practice` → `learning`
- `practice` present, no `calibrate` → `practicing`
- `calibrate.correct >= 2` → `mastered`; otherwise → `practicing`

**Removed fields vs current:** `review_interval`, `last_activity`, `compressed`, `goals[]`, `active_goal`, `exam_blueprint`

## Architecture

Two scripts. `store.js` handles files. `map.js` handles domain logic. `map.js` is the only file Claude ever calls.

```
store.js  ←  map.js  ←  Claude (via Bash tool)
```

## store.js — Persistence Layer

**Purpose:** Read and write JSON files. No domain knowledge.

**Exports:**

```javascript
load(filePath)        // → parsed object; throws Error if file not found
save(filePath, data)  // → writes JSON with 2-space indent; mkdirSync recursive
exists(filePath)      // → boolean
```

**Implementation:** Pure Node.js `fs` and `path`. No external dependencies. ~30 lines.

## map.js — Command Layer

**Purpose:** All domain operations. Each function is atomic (load → mutate → save in one call). The only public interface Claude uses.

**Exports:**

```javascript
createMap(topic, goal, domain, sections)
// Builds initial state, writes map.json, returns { mapPath }
// sections: [{ name, description, concepts: [{ name, description, dependencies }] }]

loadMap(mapPath)
// Returns full state object for Claude to inspect (read-only, no save)

recordActivity(mapPath, conceptName, activityType, results)
// activityType: 'learn' | 'synthesize' | 'practice' | 'calibrate'
// results shape per type:
//   learn:      { correct, total, hintsNeeded, confusionPatterns, strengths }
//   synthesize: { terms, mentalModel }
//   practice:   { exercises, independence, errorPatterns }
//   calibrate:  { correct }  (total always 3)
// Atomically: loads → writes activity fields → derives new status
//   → recalculates progress → recalculates stats → saves

addConcept(mapPath, sectionName, concept)
// Adds concept to named section mid-journey, saves
// concept: { name, description, dependencies }

getStatus(mapPath)
// Read-only. Returns:
// { currentConcept, nextActivity, progress, stats, sections }
// nextActivity: 'learn' | 'synthesize' | 'practice' | 'calibrate' | 'done'

endSession(mapPath)
// Increments total_sessions, updates last_session timestamp, saves
```

**Internal helpers (not exported):**

| Helper | Purpose |
|---|---|
| `deriveStatus(concept)` | Derives status string from activity chain |
| `nextActivity(concept)` | Returns next activity name from status |
| `recalculateProgress(sections)` | Counts mastered/total across all sections |
| `recalculateStats(data)` | Updates `learning_stats` (avg time, estimate, confidence) |
| `now()` | Returns ISO timestamp |
| `conceptTime(concept)` | Minutes between first and last activity, skipping gaps >8h |

**Size:** ~150–180 lines.

## File Changes

### New files
```
scripts/store.js
scripts/map.js
tests/store.test.js
tests/map.test.js
```

### Deleted files
```
scripts/utils.js              (helpers inlined into map.js)
scripts/state-manager.js      (replaced by store.js)
scripts/init-map.js           (absorbed into map.js createMap)
scripts/activity-updater.js   (absorbed into map.js recordActivity)
scripts/goal-manager.js       (feature dropped — multiple goals removed)
scripts/compression.js        (feature dropped)
tests/activity-updater.test.js
tests/compression.test.js
tests/init-map.test.js
tests/integration.test.js     (replaced by map.test.js)
tests/state-manager.test.js   (replaced by store.test.js)
```

### Updated files
```
SKILL.md                                 (Quick Reference, script call snippets)
references/state-format.md               (updated to JSON schema)
references/activities/*.md               (update any script references)
references/spaced-repetition.md          (deleted — feature dropped)
references/compression-checkpoints.md    (deleted — feature dropped)
references/goal-filters.md              (deleted — feature dropped)
package.json                             (remove gray-matter dependency)
```

## SKILL.md Quick Reference (after)

| Task | Tool |
|---|---|
| Create map | `createMap` in `scripts/map.js` |
| Load/inspect state | `loadMap` in `scripts/map.js` |
| Record activity result | `recordActivity` in `scripts/map.js` |
| Add concept mid-journey | `addConcept` in `scripts/map.js` |
| Session status | `getStatus` in `scripts/map.js` |
| End session | `endSession` in `scripts/map.js` |

## SKILL.md Sections Removed

- Phase 2 Step 5 (due reviews calculation) — no auto-review
- Phase 2 Step 6 (compression check) — dropped
- Phase 3 (Goal Change / Multiple Goals) — dropped
- Spaced Repetition section — dropped
- All `require()` code blocks referencing old scripts

## Testing Strategy

**store.test.js:** load/save round-trip, exists check, missing file error, directory auto-creation.

**map.test.js:** covers the full activity flow (createMap → recordActivity × 4 → mastered), addConcept, getStatus output, endSession counter, progress recalculation, stats calculation with gap exclusion.

## Success Criteria

- `node scripts/map.js` is not an error (exports clean)
- All tests in `tests/store.test.js` and `tests/map.test.js` pass
- `package.json` has zero dependencies
- SKILL.md Quick Reference points only to `scripts/map.js`
- No reference to `gray-matter`, `activity-selector`, `goal-manager`, `compression`, `state-manager`, `init-map`, or `utils` anywhere in scripts or skill files
