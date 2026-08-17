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
| Migration of existing .md files | None | Deliberately orphaned; users start fresh with new .json format |

## Domain Model

One JSON file per topic at `docs/neat_learning/{topic-slug}/map.json`.

**Slug algorithm:** `topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')`
Example: "Model Context Protocol" → `model-context-protocol`

### Map (top-level)

```json
{
  "topic": "Kubernetes",
  "goal": "Deploy production applications",
  "domain": "technical",
  "started": "2026-08-17T10:00:00.000Z",
  "last_session": "2026-08-17T10:00:00.000Z",
  "total_sessions": 0,
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

`total_sessions` starts at 0 and is incremented by `endSession` — value N means N sessions have completed.

### Concept (inside sections[].concepts[])

```json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit in Kubernetes",
  "status": "not-started",
  "dependencies": { "requires": [], "enables": ["Deployments"] },
  "activity": {
    "learn":      { "date": "2026-08-17T10:00:00.000Z", "correct": 4, "total": 5 },
    "synthesize": { "completed": "2026-08-17T10:30:00.000Z" },
    "practice":   { "date": "2026-08-17T11:00:00.000Z", "independence": true },
    "calibrate":  { "date": "2026-08-17T11:30:00.000Z", "correct": 2, "total": 3, "attempts": 1 }
  }
}
```

### Activity stored fields (minimal)

| Activity | Fields stored |
|---|---|
| `learn` | `date`, `correct`, `total` |
| `synthesize` | `completed` (ISO timestamp) |
| `practice` | `date`, `independence` (boolean) |
| `calibrate` | `date`, `correct`, `total` (always 3), `attempts` |

All other fields from the current system (`hints_needed`, `signals`, `coverage`, `terms`, `mental_model`, `exercises`, `error_patterns`, `expert_thinking`) are dropped.

### Status values and derivation

**Values:** `not-started → learning → practicing → mastered`

**Derived from activity chain** (not stored independently — always computed):

| Condition | Status |
|---|---|
| No `activity.learn` | `not-started` |
| `learn` present, no `practice` | `learning` |
| `practice` present, no `calibrate` or `calibrate.correct < 2` | `practicing` |
| `calibrate.correct >= 2` | `mastered` |

Note: `synthesize` does not affect status — it is stored but does not gate the status transition. Status reflects broad phase; `nextActivity` uses the activity chain.

### Next activity logic

| Activity present | Next activity |
|---|---|
| none | `learn` |
| `learn` only | `synthesize` |
| `learn` + `synthesize` | `practice` |
| `practice`, no `calibrate` | `calibrate` |
| `calibrate.correct < 2`, `attempts < 3` | `calibrate` (retry) |
| `calibrate.correct < 2`, `attempts >= 3` | `practice` (forced back; attempts resets) |
| `calibrate.correct >= 2` | `done` |

### Learning stats formula

Calculated after each `recordActivity` call:

- `avg_hours_per_concept`: average minutes across concepts with complete activity chains (learn→calibrate), divided by 60, excluding time gaps >8h between activities
- `sample_size`: count of concepts with complete chains
- `estimated_days_remaining`: `ceil(remaining_concepts × avg_hours / 3) × 1.3` where 3 is assumed hours per session

`learning_stats` is `null` until at least one concept has a complete chain.

**Removed fields vs current:** `confidence`, `avg_by_category`, `review_interval`, `last_activity`, `compressed`, `goals[]`, `active_goal`, `exam_blueprint`

## Architecture

Two scripts. `store.js` handles files. `map.js` handles domain logic. `map.js` is the only file Claude ever calls.

```
store.js  ←  map.js  ←  Claude (via Bash tool)
```

## store.js — Persistence Layer

**Purpose:** Read and write JSON files. No domain knowledge.

**Exports:**

```javascript
load(filePath)        // → parsed object; throws Error('Map not found: <path>') if missing
save(filePath, data)  // → writes JSON with 2-space indent; mkdirSync({ recursive: true })
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
// Throws if map already exists at that path

loadMap(mapPath)
// Returns full state object — read-only, no save
// Throws Error('Map not found: <path>') if missing

recordActivity(mapPath, conceptName, activityType, results)
// activityType: 'learn' | 'synthesize' | 'practice' | 'calibrate'
// results per type:
//   learn:      { correct, total }
//   synthesize: {}  (no fields needed beyond timestamp)
//   practice:   { independence }
//   calibrate:  { correct }  (total always 3; attempts tracked internally)
// Atomically: load → write activity fields → derive status → recalculate
//   progress + stats → save
// Throws Error('Concept "X" not found') if conceptName missing
// Throws Error('Invalid activity type: X') for unknown activityType

addConcept(mapPath, sectionName, concept)
// Adds concept to named section, saves
// concept: { name, description, dependencies: { requires[], enables[] } }
// Throws Error('Section "X" not found') if sectionName missing
// New concept gets status 'not-started', no activity object

getStatus(mapPath)
// Read-only, no save. Returns:
// { currentConcept, nextActivity, progress, stats }
// currentConcept: first concept where nextActivity !== 'done', or null if all done
// nextActivity: 'learn' | 'synthesize' | 'practice' | 'calibrate' | 'done'

endSession(mapPath)
// Increments total_sessions by 1, updates last_session to now(), saves
```

**Internal helpers (not exported):**

| Helper | Purpose |
|---|---|
| `deriveStatus(concept)` | Status from activity chain |
| `nextActivityFor(concept)` | Next activity name from activity chain |
| `recalculateProgress(sections)` | Counts mastered/total |
| `recalculateStats(data)` | Updates `learning_stats` or sets to null |
| `conceptTime(concept)` | Minutes first→last activity, skipping gaps >8h |
| `now()` | ISO timestamp |
| `toSlug(str)` | `str.toLowerCase().replace(/[^a-z0-9]+/g, '-')` |

**Size:** ~160–190 lines.

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
SKILL.md                              (Quick Reference, remove old script snippets)
references/state-format.md            (updated to JSON schema)
references/activities/practice.md     (remove script reference)
references/spaced-repetition.md       (deleted — feature dropped)
references/compression-checkpoints.md (deleted — feature dropped)
references/goal-filters.md            (deleted — feature dropped)
package.json                          (remove gray-matter, zero dependencies)
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

**store.test.js:** load/save round-trip, exists check, missing file throws, directory auto-creation on save.

**map.test.js:** full activity flow (createMap → learn → synthesize → practice → calibrate → mastered), failed calibrate retry, calibrate attempts cap forcing back to practice, addConcept, getStatus, endSession counter increment, progress recalculation, stats null until first complete chain, stats formula correctness.

## Success Criteria

- All tests in `tests/store.test.js` and `tests/map.test.js` pass
- `package.json` has zero dependencies
- SKILL.md Quick Reference points only to `scripts/map.js`
- No reference to `gray-matter`, `goal-manager`, `compression`, `state-manager`, `init-map`, or `utils` anywhere in scripts or skill files
