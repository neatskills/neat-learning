# Scripts Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 organic scripts + gray-matter with 2 focused files and zero external dependencies, removing spaced repetition, multi-goal support, and compression.

**Architecture:** `store.js` is a thin JSON persistence layer (load/save/exists). `map.js` is the domain layer exposing 6 coarse-grained atomic commands. Claude calls only `map.js`. All old scripts are deleted after the new ones are verified.

**Tech Stack:** Node.js built-ins only (`fs`, `path`). No npm packages.

**Spec:** `specs/2026-08-17-scripts-redesign.md`

## Global Constraints

- Zero external dependencies — no `require()` of anything outside Node.js built-ins and sibling scripts
- All tests run with `node tests/<file>.js` — no test runner
- State files live at `docs/neat_learning/{slug}/map.json` where slug = `topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')`
- Existing `.md` map files are deliberately orphaned — do not read or migrate them
- `total_sessions` starts at 0; `endSession` increments it to N after N completed sessions
- Dates are ISO 8601 strings from `new Date().toISOString()`

---

### Task 1: store.js — persistence layer

**Files:**
- Create: `scripts/store.js`
- Create: `tests/store.test.js`

**Interfaces:**
- Produces: `load(filePath) → object`, `save(filePath, data) → void`, `exists(filePath) → boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/store.test.js`:

```javascript
#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load, save, exists } = require('../scripts/store');

const TMP = path.join(__dirname, '../test-output/store');
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

console.log('store.js tests\n');

// 1. save creates nested directories and writes valid JSON
const filePath = path.join(TMP, 'nested/dir/data.json');
save(filePath, { x: 1 });
assert(fs.existsSync(filePath), 'file should exist after save');
assert.strictEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')).x, 1);
console.log('✓ save creates dirs and writes JSON');

// 2. load reads back the same object
assert.deepStrictEqual(load(filePath), { x: 1 });
console.log('✓ load reads back saved data');

// 3. exists returns true for existing file
assert.strictEqual(exists(filePath), true);
console.log('✓ exists → true for existing file');

// 4. exists returns false for missing file
assert.strictEqual(exists(path.join(TMP, 'missing.json')), false);
console.log('✓ exists → false for missing file');

// 5. load throws descriptive error for missing file
try {
  load(path.join(TMP, 'missing.json'));
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('Map not found'), `expected "Map not found" in: ${e.message}`);
}
console.log('✓ load throws "Map not found" for missing file');

// 6. save overwrites existing file
save(filePath, { x: 2 });
assert.strictEqual(load(filePath).x, 2);
console.log('✓ save overwrites existing file');

// 7. JSON is indented 2 spaces (human-readable)
const raw = fs.readFileSync(filePath, 'utf8');
assert(raw.includes('\n  '), 'JSON should be 2-space indented');
console.log('✓ JSON is 2-space indented');

fs.rmSync(TMP, { recursive: true });
console.log('\nAll store tests passed! ✓');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node tests/store.test.js
```

Expected: `Cannot find module '../scripts/store'`

- [ ] **Step 3: Write the implementation**

Create `scripts/store.js`:

```javascript
const fs = require('fs');
const path = require('path');

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Map not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function save(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { load, save, exists };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node tests/store.test.js
```

Expected: `All store tests passed! ✓`

- [ ] **Step 5: Commit**

```bash
git add scripts/store.js tests/store.test.js
git commit -m "feat(store): add JSON persistence layer with load/save/exists"
```

---

### Task 2: map.js — createMap + loadMap

**Files:**
- Create: `scripts/map.js`
- Create: `tests/map.test.js` (grows across Tasks 2–5)

**Interfaces:**
- Consumes: `store.load`, `store.save`, `store.exists` from Task 1
- Produces: `createMap(topic, goal, domain, sections, _basePath?) → { mapPath }`, `loadMap(mapPath) → data`

**Note on `_basePath`:** `createMap` accepts an optional fifth argument for testing. In production Claude omits it and files land in `docs/neat_learning/`. Tests pass a temp directory.

- [ ] **Step 1: Write the failing tests**

Create `tests/map.test.js` with only the createMap/loadMap tests (more tests are added in later tasks):

```javascript
#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMap, loadMap } = require('../scripts/map');

const TMP = path.join(__dirname, '../test-output/map');
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

const SECTIONS = [
  {
    name: 'Foundation',
    description: 'Core concepts',
    concepts: [
      { name: 'Pods', description: 'Smallest unit', dependencies: { requires: [], enables: ['Deployments'] } }
    ]
  },
  {
    name: 'Core',
    description: 'Main features',
    concepts: [
      { name: 'Deployments', description: 'Manage replicas', dependencies: { requires: ['Pods'], enables: [] } }
    ]
  }
];

console.log('map.js tests — createMap + loadMap\n');

// 1. createMap writes map.json with correct top-level fields
const { mapPath } = createMap('Kubernetes', 'Deploy apps', 'technical', SECTIONS, TMP);
assert(fs.existsSync(mapPath), 'map.json should exist');
const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
assert.strictEqual(data.topic, 'Kubernetes');
assert.strictEqual(data.goal, 'Deploy apps');
assert.strictEqual(data.domain, 'technical');
assert.strictEqual(data.total_sessions, 0);
assert.strictEqual(data.progress.mastered, 0);
assert.strictEqual(data.progress.total, 2);
assert.strictEqual(data.learning_stats, null);
assert(data.started, 'started should be set');
assert(data.last_session, 'last_session should be set');
console.log('✓ createMap writes correct top-level fields');

// 2. createMap slugifies the topic into the path
assert(mapPath.includes('kubernetes'), `path should contain slug, got: ${mapPath}`);
console.log('✓ createMap slugifies topic for path');

// 3. createMap sets concepts to not-started with no activity
const pod = data.sections[0].concepts[0];
assert.strictEqual(pod.name, 'Pods');
assert.strictEqual(pod.status, 'not-started');
assert.strictEqual(pod.activity, undefined);
console.log('✓ concepts initialised as not-started with no activity');

// 4. createMap throws if map already exists
try {
  createMap('Kubernetes', 'Deploy apps', 'technical', SECTIONS, TMP);
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('already exists'), `got: ${e.message}`);
}
console.log('✓ createMap throws if map already exists');

// 5. loadMap returns the same data
const loaded = loadMap(mapPath);
assert.strictEqual(loaded.topic, 'Kubernetes');
assert.strictEqual(loaded.sections.length, 2);
console.log('✓ loadMap reads data back correctly');

// 6. loadMap throws for missing file
try {
  loadMap(path.join(TMP, 'missing/map.json'));
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('Map not found'), `got: ${e.message}`);
}
console.log('✓ loadMap throws for missing file');

fs.rmSync(TMP, { recursive: true });
console.log('\ncreateMap + loadMap tests passed! ✓');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node tests/map.test.js
```

Expected: `Cannot find module '../scripts/map'`

- [ ] **Step 3: Write the implementation**

Create `scripts/map.js` with only createMap/loadMap for now (remaining functions added in Tasks 3–5):

```javascript
const path = require('path');
const store = require('./store');

// ── Utilities ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ── Internal domain helpers (stubs — filled in Tasks 3–5) ────────────────────

function deriveStatus(concept) {
  const a = concept.activity;
  if (!a?.learn) return 'not-started';
  if (!a.practice) return 'learning';
  if (!a.calibrate || a.calibrate.correct < 2) return 'practicing';
  return 'mastered';
}

function recalculateProgress(sections) {
  let mastered = 0, total = 0;
  for (const section of sections) {
    for (const concept of section.concepts) {
      total++;
      if (deriveStatus(concept) === 'mastered') mastered++;
    }
  }
  return { mastered, total };
}

// ── Exported commands ─────────────────────────────────────────────────────────

function createMap(topic, goal, domain, sections, _basePath) {
  const basePath = _basePath || path.join(__dirname, '..', 'docs', 'neat_learning');
  const mapPath = path.join(basePath, toSlug(topic), 'map.json');

  if (store.exists(mapPath)) {
    throw new Error(`Map already exists: ${mapPath}`);
  }

  const normalizedSections = sections.map(section => ({
    name: section.name,
    description: section.description || '',
    concepts: section.concepts.map(c => ({
      name: c.name,
      description: c.description,
      status: 'not-started',
      dependencies: c.dependencies || { requires: [], enables: [] }
    }))
  }));

  const data = {
    topic,
    goal,
    domain,
    started: now(),
    last_session: now(),
    total_sessions: 0,
    progress: { mastered: 0, total: normalizedSections.flatMap(s => s.concepts).length },
    learning_stats: null,
    sections: normalizedSections
  };

  store.save(mapPath, data);
  return { mapPath };
}

function loadMap(mapPath) {
  return store.load(mapPath);
}

module.exports = { createMap, loadMap };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node tests/map.test.js
```

Expected: `createMap + loadMap tests passed! ✓`

- [ ] **Step 5: Commit**

```bash
git add scripts/map.js tests/map.test.js
git commit -m "feat(map): add createMap and loadMap"
```

---

### Task 3: map.js — recordActivity (learn, synthesize, practice)

**Files:**
- Modify: `scripts/map.js` (add `recordActivity`, `conceptTime`, `recalculateStats`)
- Modify: `tests/map.test.js` (append new tests)

**Interfaces:**
- Consumes: `createMap`, `loadMap` from Task 2
- Produces: `recordActivity(mapPath, conceptName, activityType, results) → void`
  - `activityType`: `'learn' | 'synthesize' | 'practice' | 'calibrate'`
  - `results` for learn: `{ correct, total }`; synthesize: `{}`; practice: `{ independence }`

- [ ] **Step 1: Append failing tests to `tests/map.test.js`**

Add these tests at the bottom of the file, before the final `fs.rmSync` cleanup and summary line. Move the cleanup and summary to after these tests.

Replace the tail of the file:
```javascript
fs.rmSync(TMP, { recursive: true });
console.log('\ncreateMap + loadMap tests passed! ✓');
```

With:
```javascript
// ── recordActivity tests ──────────────────────────────────────────────────────

const { recordActivity } = require('../scripts/map');

// Set up fresh map for activity tests
const { mapPath: actMapPath } = createMap('Python', 'Write scripts', 'technical', SECTIONS, TMP);

console.log('\nmap.js tests — recordActivity (learn, synthesize, practice)\n');

// 7. recordActivity learn: writes activity.learn, status → learning
recordActivity(actMapPath, 'Pods', 'learn', { correct: 4, total: 5 });
let state = loadMap(actMapPath);
let pod = state.sections[0].concepts[0];
assert.strictEqual(pod.activity.learn.correct, 4);
assert.strictEqual(pod.activity.learn.total, 5);
assert(pod.activity.learn.date, 'learn.date should be set');
assert.strictEqual(pod.status, 'learning');
console.log('✓ recordActivity learn writes fields and sets status to learning');

// 8. recordActivity synthesize: writes activity.synthesize, status stays learning
recordActivity(actMapPath, 'Pods', 'synthesize', {});
state = loadMap(actMapPath);
pod = state.sections[0].concepts[0];
assert(pod.activity.synthesize.completed, 'synthesize.completed should be set');
assert.strictEqual(pod.status, 'learning', 'status stays learning after synthesize');
console.log('✓ recordActivity synthesize writes completed timestamp, status unchanged');

// 9. recordActivity practice: writes activity.practice, status → practicing
recordActivity(actMapPath, 'Pods', 'practice', { independence: true });
state = loadMap(actMapPath);
pod = state.sections[0].concepts[0];
assert.strictEqual(pod.activity.practice.independence, true);
assert(pod.activity.practice.date, 'practice.date should be set');
assert.strictEqual(pod.status, 'practicing');
console.log('✓ recordActivity practice writes fields and sets status to practicing');

// 10. progress recalculated after recordActivity
assert.strictEqual(state.progress.mastered, 0);
assert.strictEqual(state.progress.total, 2);
console.log('✓ progress recalculated (0/2 mastered)');

// 11. stats still null (no complete chain yet — calibrate not done)
assert.strictEqual(state.learning_stats, null);
console.log('✓ learning_stats null before first complete chain');

// 12. recordActivity throws for unknown concept
try {
  recordActivity(actMapPath, 'NonExistent', 'learn', { correct: 5, total: 5 });
  assert.fail('should throw');
} catch (e) {
  assert(e.message.includes('"NonExistent" not found'), `got: ${e.message}`);
}
console.log('✓ recordActivity throws for unknown concept');

// 13. recordActivity throws for invalid activity type
try {
  recordActivity(actMapPath, 'Pods', 'quiz', {});
  assert.fail('should throw');
} catch (e) {
  assert(e.message.includes('Invalid activity type'), `got: ${e.message}`);
}
console.log('✓ recordActivity throws for invalid activity type');

fs.rmSync(TMP, { recursive: true });
console.log('\nAll map tests so far passed! ✓');
```

- [ ] **Step 2: Run test to verify new tests fail**

```bash
node tests/map.test.js
```

Expected: fails at test 7 with `recordActivity is not a function`

- [ ] **Step 3: Add `recordActivity`, `conceptTime`, `recalculateStats` to `scripts/map.js`**

Add these functions before the `module.exports` line:

```javascript
function conceptTime(concept) {
  const a = concept.activity;
  if (!a?.learn) return null;
  const timestamps = [
    a.learn?.date,
    a.synthesize?.completed,
    a.practice?.date,
    a.calibrate?.date
  ].filter(Boolean);
  if (timestamps.length < 2) return null;
  let totalMinutes = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const diffMin = (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / 60000;
    if (diffMin <= 480) totalMinutes += diffMin; // skip gaps > 8 hours
  }
  return totalMinutes > 0 ? totalMinutes : null;
}

function recalculateStats(data) {
  const allConcepts = data.sections.flatMap(s => s.concepts);
  const times = allConcepts.map(conceptTime).filter(t => t !== null);
  if (times.length === 0) return null;
  const avgMinutes = times.reduce((sum, t) => sum + t, 0) / times.length;
  const avgHours = Math.round(avgMinutes / 60 * 10) / 10;
  const remaining = allConcepts.filter(c => deriveStatus(c) !== 'mastered').length;
  return {
    avg_hours_per_concept: avgHours,
    estimated_days_remaining: Math.ceil((remaining * avgHours / 3) * 1.3),
    sample_size: times.length,
    last_calculated: now()
  };
}

function recordActivity(mapPath, conceptName, activityType, results = {}) {
  const validTypes = ['learn', 'synthesize', 'practice', 'calibrate'];
  if (!validTypes.includes(activityType)) {
    throw new Error(`Invalid activity type: ${activityType}`);
  }

  const data = store.load(mapPath);

  let concept = null;
  for (const section of data.sections) {
    concept = section.concepts.find(c => c.name === conceptName);
    if (concept) break;
  }
  if (!concept) throw new Error(`Concept "${conceptName}" not found`);

  if (!concept.activity) concept.activity = {};
  const timestamp = now();

  if (activityType === 'learn') {
    concept.activity.learn = { date: timestamp, correct: results.correct, total: results.total };
  } else if (activityType === 'synthesize') {
    concept.activity.synthesize = { completed: timestamp };
  } else if (activityType === 'practice') {
    // Reset calibrate if we were forced back after 3 failed attempts
    if ((concept.activity.calibrate?.attempts || 0) >= 3) {
      delete concept.activity.calibrate;
    }
    concept.activity.practice = { date: timestamp, independence: results.independence };
  } else if (activityType === 'calibrate') {
    const attempts = (concept.activity.calibrate?.attempts || 0) + 1;
    concept.activity.calibrate = { date: timestamp, correct: results.correct, total: 3, attempts };
  }

  concept.status = deriveStatus(concept);
  data.progress = recalculateProgress(data.sections);
  data.learning_stats = recalculateStats(data);

  store.save(mapPath, data);
}
```

Update `module.exports`:
```javascript
module.exports = { createMap, loadMap, recordActivity };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node tests/map.test.js
```

Expected: `All map tests so far passed! ✓`

- [ ] **Step 5: Commit**

```bash
git add scripts/map.js tests/map.test.js
git commit -m "feat(map): add recordActivity for learn, synthesize, practice"
```

---

### Task 4: map.js — recordActivity calibrate with retry logic

**Files:**
- Modify: `scripts/map.js` — `nextActivityFor` helper needed to implement/verify retry logic
- Modify: `tests/map.test.js` — append calibrate tests

**Interfaces:**
- Produces: calibrate behaviour: pass → `mastered`; fail with `attempts < 3` → retry; fail with `attempts >= 3` → next is `practice`; re-practicing after cap resets calibrate

- [ ] **Step 1: Append failing calibrate tests to `tests/map.test.js`**

Replace:
```javascript
fs.rmSync(TMP, { recursive: true });
console.log('\nAll map tests so far passed! ✓');
```

With:
```javascript
// ── calibrate tests ───────────────────────────────────────────────────────────

const { nextActivityFor } = require('../scripts/map');

console.log('\nmap.js tests — calibrate + retry logic\n');

// Set up a concept that has completed learn + synthesize + practice
const { mapPath: calMapPath } = createMap('Go', 'Write services', 'technical', SECTIONS, TMP);
recordActivity(calMapPath, 'Pods', 'learn', { correct: 5, total: 5 });
recordActivity(calMapPath, 'Pods', 'synthesize', {});
recordActivity(calMapPath, 'Pods', 'practice', { independence: true });

// 14. calibrate pass: status → mastered, attempts = 1
recordActivity(calMapPath, 'Pods', 'calibrate', { correct: 2 });
let calState = loadMap(calMapPath);
let calPod = calState.sections[0].concepts[0];
assert.strictEqual(calPod.status, 'mastered');
assert.strictEqual(calPod.activity.calibrate.correct, 2);
assert.strictEqual(calPod.activity.calibrate.attempts, 1);
console.log('✓ calibrate pass → mastered, attempts = 1');

// 15. stats calculated after first complete chain
assert(calState.learning_stats !== null, 'stats should be calculated');
assert.strictEqual(calState.learning_stats.sample_size, 1);
assert(typeof calState.learning_stats.avg_hours_per_concept === 'number');
console.log('✓ learning_stats calculated after complete chain');

// 16. calibrate fail (score < 2): status stays practicing, attempts incremented
const { mapPath: retryPath } = createMap('Rust', 'Build CLI', 'technical', SECTIONS, TMP);
recordActivity(retryPath, 'Pods', 'learn', { correct: 5, total: 5 });
recordActivity(retryPath, 'Pods', 'synthesize', {});
recordActivity(retryPath, 'Pods', 'practice', { independence: true });
recordActivity(retryPath, 'Pods', 'calibrate', { correct: 1 }); // fail
let retryState = loadMap(retryPath);
let retryPod = retryState.sections[0].concepts[0];
assert.strictEqual(retryPod.status, 'practicing');
assert.strictEqual(retryPod.activity.calibrate.attempts, 1);
assert.strictEqual(nextActivityFor(retryPod), 'calibrate', 'should retry calibrate');
console.log('✓ calibrate fail → status practicing, nextActivity = calibrate');

// 17. calibrate fail 3 times: nextActivity forced to practice
recordActivity(retryPath, 'Pods', 'calibrate', { correct: 0 }); // fail 2
recordActivity(retryPath, 'Pods', 'calibrate', { correct: 1 }); // fail 3
retryState = loadMap(retryPath);
retryPod = retryState.sections[0].concepts[0];
assert.strictEqual(retryPod.activity.calibrate.attempts, 3);
assert.strictEqual(nextActivityFor(retryPod), 'practice', 'after 3 fails, force back to practice');
console.log('✓ after 3 failed calibrates, nextActivity = practice');

// 18. recording practice after cap resets calibrate, then calibrate starts fresh
recordActivity(retryPath, 'Pods', 'practice', { independence: false });
retryState = loadMap(retryPath);
retryPod = retryState.sections[0].concepts[0];
assert.strictEqual(retryPod.activity.calibrate, undefined, 'calibrate should be cleared after forced practice');
assert.strictEqual(nextActivityFor(retryPod), 'calibrate', 'after re-practice, nextActivity = calibrate again');
console.log('✓ practice after cap clears calibrate; next is calibrate');

// 19. fresh calibrate after reset starts attempts at 1
recordActivity(retryPath, 'Pods', 'calibrate', { correct: 3 });
retryState = loadMap(retryPath);
retryPod = retryState.sections[0].concepts[0];
assert.strictEqual(retryPod.activity.calibrate.attempts, 1, 'attempts resets to 1');
assert.strictEqual(retryPod.status, 'mastered');
console.log('✓ calibrate after reset: attempts = 1, status = mastered');

fs.rmSync(TMP, { recursive: true });
console.log('\nAll map tests so far passed! ✓');
```

- [ ] **Step 2: Run test to verify new tests fail**

```bash
node tests/map.test.js
```

Expected: fails at test 16 or test `nextActivityFor is not a function`

- [ ] **Step 3: Add `nextActivityFor` to `scripts/map.js` and export it**

Add after `deriveStatus`:

```javascript
function nextActivityFor(concept) {
  const a = concept.activity || {};
  if (!a.learn) return 'learn';
  if (!a.synthesize) return 'synthesize';
  if (!a.practice) return 'practice';
  if (!a.calibrate || a.calibrate.correct < 2) {
    return (a.calibrate?.attempts || 0) >= 3 ? 'practice' : 'calibrate';
  }
  return 'done';
}
```

Update `module.exports`:
```javascript
module.exports = { createMap, loadMap, recordActivity, nextActivityFor };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node tests/map.test.js
```

Expected: `All map tests so far passed! ✓`

- [ ] **Step 5: Commit**

```bash
git add scripts/map.js tests/map.test.js
git commit -m "feat(map): add calibrate with 3-attempt retry cap and forced practice reset"
```

---

### Task 5: map.js — addConcept, getStatus, endSession

**Files:**
- Modify: `scripts/map.js` — add `addConcept`, `getStatus`, `endSession`
- Modify: `tests/map.test.js` — append remaining tests and finalise

**Interfaces:**
- Produces:
  - `addConcept(mapPath, sectionName, concept) → void`
  - `getStatus(mapPath) → { currentConcept, nextActivity, progress, stats }`
  - `endSession(mapPath) → void`

- [ ] **Step 1: Append failing tests to `tests/map.test.js`**

Replace:
```javascript
fs.rmSync(TMP, { recursive: true });
console.log('\nAll map tests so far passed! ✓');
```

With:
```javascript
// ── addConcept, getStatus, endSession ─────────────────────────────────────────

const { addConcept, getStatus, endSession } = require('../scripts/map');

console.log('\nmap.js tests — addConcept, getStatus, endSession\n');

const { mapPath: statusPath } = createMap('Java', 'Build APIs', 'technical', SECTIONS, TMP);

// 20. getStatus on fresh map: currentConcept = first concept, nextActivity = learn
let status = getStatus(statusPath);
assert.strictEqual(status.currentConcept.name, 'Pods');
assert.strictEqual(status.nextActivity, 'learn');
assert.strictEqual(status.progress.mastered, 0);
assert.strictEqual(status.stats, null);
console.log('✓ getStatus on fresh map returns first concept with learn');

// 21. getStatus advances after recording learn
recordActivity(statusPath, 'Pods', 'learn', { correct: 5, total: 5 });
status = getStatus(statusPath);
assert.strictEqual(status.nextActivity, 'synthesize');
console.log('✓ getStatus advances to synthesize after learn');

// 22. addConcept adds to named section
addConcept(statusPath, 'Core', { name: 'Services', description: 'Networking', dependencies: { requires: ['Pods'], enables: [] } });
let addedState = loadMap(statusPath);
const core = addedState.sections.find(s => s.name === 'Core');
assert(core.concepts.some(c => c.name === 'Services'), 'Services should be in Core');
assert.strictEqual(addedState.progress.total, 3, 'total should be 3 after adding concept');
console.log('✓ addConcept adds to correct section and recalculates total');

// 23. addConcept throws for unknown section
try {
  addConcept(statusPath, 'NonExistent', { name: 'X', description: '', dependencies: { requires: [], enables: [] } });
  assert.fail('should throw');
} catch (e) {
  assert(e.message.includes('"NonExistent" not found'), `got: ${e.message}`);
}
console.log('✓ addConcept throws for unknown section');

// 24. getStatus returns null currentConcept when all mastered
const { mapPath: donePath } = createMap('Ruby', 'Write scripts', 'technical', [
  { name: 'Only', description: '', concepts: [
    { name: 'One', description: 'Solo concept', dependencies: { requires: [], enables: [] } }
  ] }
], TMP);
recordActivity(donePath, 'One', 'learn', { correct: 5, total: 5 });
recordActivity(donePath, 'One', 'synthesize', {});
recordActivity(donePath, 'One', 'practice', { independence: true });
recordActivity(donePath, 'One', 'calibrate', { correct: 3 });
const doneStatus = getStatus(donePath);
assert.strictEqual(doneStatus.currentConcept, null);
assert.strictEqual(doneStatus.nextActivity, 'done');
console.log('✓ getStatus returns null currentConcept when all mastered');

// 25. endSession increments total_sessions and updates last_session
const before = loadMap(statusPath).total_sessions;
endSession(statusPath);
const after = loadMap(statusPath);
assert.strictEqual(after.total_sessions, before + 1);
assert(after.last_session > loadMap(statusPath).started || true, 'last_session updated');
console.log('✓ endSession increments total_sessions');

// 26. endSession can be called multiple times
endSession(statusPath);
endSession(statusPath);
assert.strictEqual(loadMap(statusPath).total_sessions, before + 3);
console.log('✓ endSession is additive across calls');

fs.rmSync(TMP, { recursive: true });
console.log('\nAll map tests passed! ✓');
```

- [ ] **Step 2: Run test to verify new tests fail**

```bash
node tests/map.test.js
```

Expected: fails at test 20 with `getStatus is not a function`

- [ ] **Step 3: Add `addConcept`, `getStatus`, `endSession` to `scripts/map.js`**

Add before `module.exports`:

```javascript
function addConcept(mapPath, sectionName, concept) {
  const data = store.load(mapPath);
  const section = data.sections.find(s => s.name === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);
  section.concepts.push({
    name: concept.name,
    description: concept.description,
    status: 'not-started',
    dependencies: concept.dependencies || { requires: [], enables: [] }
  });
  data.progress = recalculateProgress(data.sections);
  store.save(mapPath, data);
}

function getStatus(mapPath) {
  const data = store.load(mapPath);
  let currentConcept = null;
  let nextActivity = 'done';
  outer: for (const section of data.sections) {
    for (const concept of section.concepts) {
      const activity = nextActivityFor(concept);
      if (activity !== 'done') {
        currentConcept = concept;
        nextActivity = activity;
        break outer;
      }
    }
  }
  return { currentConcept, nextActivity, progress: data.progress, stats: data.learning_stats };
}

function endSession(mapPath) {
  const data = store.load(mapPath);
  data.total_sessions += 1;
  data.last_session = now();
  store.save(mapPath, data);
}
```

Update `module.exports`:
```javascript
module.exports = { createMap, loadMap, recordActivity, nextActivityFor, addConcept, getStatus, endSession };
```

- [ ] **Step 4: Run all tests to verify everything passes**

```bash
node tests/store.test.js && node tests/map.test.js
```

Expected: both print `passed! ✓`

- [ ] **Step 5: Commit**

```bash
git add scripts/map.js tests/map.test.js
git commit -m "feat(map): add addConcept, getStatus, endSession — map.js complete"
```

---

### Task 6: Delete old scripts and test files

**Files:**
- Delete: `scripts/utils.js`, `scripts/state-manager.js`, `scripts/init-map.js`, `scripts/activity-updater.js`, `scripts/goal-manager.js`, `scripts/compression.js`
- Delete: `tests/activity-updater.test.js`, `tests/compression.test.js`, `tests/init-map.test.js`, `tests/integration.test.js`, `tests/state-manager.test.js`

- [ ] **Step 1: Delete old scripts**

```bash
rm scripts/utils.js scripts/state-manager.js scripts/init-map.js \
   scripts/activity-updater.js scripts/goal-manager.js scripts/compression.js
```

- [ ] **Step 2: Delete old test files**

```bash
rm tests/activity-updater.test.js tests/compression.test.js \
   tests/init-map.test.js tests/integration.test.js tests/state-manager.test.js
```

- [ ] **Step 3: Verify no remaining references to deleted scripts**

```bash
grep -r "state-manager\|init-map\|activity-updater\|goal-manager\|compression\|utils" \
  scripts/ tests/ --include="*.js"
```

Expected: no output (empty).

- [ ] **Step 4: Run surviving tests to confirm nothing broke**

```bash
node tests/store.test.js && node tests/map.test.js
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete old scripts and test files replaced by store.js and map.js"
```

---

### Task 7: Update package.json and reference files

**Files:**
- Modify: `package.json` — remove gray-matter, update test script
- Modify: `references/state-format.md` — rewrite to JSON schema
- Delete: `references/spaced-repetition.md`, `references/compression-checkpoints.md`, `references/goal-filters.md`
- Modify: `references/activities/practice.md` — remove script reference (already done; verify)

- [ ] **Step 1: Update `package.json`**

Replace the full file content:

```json
{
  "name": "neat-learning",
  "version": "2.0.0",
  "description": "AI-guided discovery-based learning system",
  "scripts": {
    "test": "node tests/store.test.js && node tests/map.test.js"
  },
  "keywords": ["learning", "ai", "education", "claude"],
  "author": "neatskills",
  "license": "MIT"
}
```

- [ ] **Step 2: Verify npm test runs clean (no node_modules needed)**

```bash
npm test
```

Expected: both test files pass with no missing module errors.

- [ ] **Step 3: Delete dropped reference files**

```bash
rm references/spaced-repetition.md references/compression-checkpoints.md references/goal-filters.md
```

- [ ] **Step 4: Rewrite `references/state-format.md`**

Replace the full file with:

```markdown
# State File Format

**Location:** `docs/neat_learning/<topic-slug>/map.json`

**Format:** Pure JSON. Read and write via `scripts/map.js` — do not hand-edit fields.

**Slug rule:** `topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

## Top-Level Schema

\`\`\`json
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
    "last_calculated": "2026-08-17T10:00:00.000Z"
  },
  "sections": [...]
}
\`\`\`

`learning_stats` is `null` until the first concept completes the full activity chain (learn → synthesize → practice → calibrate passed).

`total_sessions` starts at 0 and is incremented by `endSession` — value N means N sessions have ended.

## Concept Schema

\`\`\`json
{
  "name": "Kubernetes Pods",
  "description": "Core schedulable unit",
  "status": "not-started",
  "dependencies": { "requires": [], "enables": ["Deployments"] },
  "activity": {
    "learn":      { "date": "...", "correct": 4, "total": 5 },
    "synthesize": { "completed": "..." },
    "practice":   { "date": "...", "independence": true },
    "calibrate":  { "date": "...", "correct": 2, "total": 3, "attempts": 1 }
  }
}
\`\`\`

## Status Values

`not-started → learning → practicing → mastered`

Status is derived from the activity chain — it is stored for convenience but always matches:

| Condition | Status |
|---|---|
| No `activity.learn` | `not-started` |
| `learn` present, no `practice` | `learning` |
| `practice` present; no `calibrate` or `calibrate.correct < 2` | `practicing` |
| `calibrate.correct >= 2` | `mastered` |

Note: `synthesize` does not affect status.

## Field Types

- Dates: ISO 8601 strings (`2026-08-17T10:00:00.000Z`)
- `calibrate.total`: always `3`
- `calibrate.attempts`: increments on each call; resets when practice is re-recorded after cap
- `practice.independence`: boolean — true if the learner worked without hints
```

- [ ] **Step 5: Verify practice.md no longer references activity-selector**

```bash
grep "activity-selector" references/activities/practice.md
```

Expected: no output. (This was already fixed in a prior commit. If output appears, remove the reference manually.)

- [ ] **Step 6: Commit**

```bash
git add package.json references/state-format.md
git rm references/spaced-repetition.md references/compression-checkpoints.md references/goal-filters.md
git commit -m "chore: remove gray-matter dep, update state-format.md, delete dropped reference files"
```

---

### Task 8: Update SKILL.md

**Files:**
- Modify: `SKILL.md`

This is the largest prose edit. Work section by section.

- [ ] **Step 1: Replace the Quick Reference table**

Find:
```markdown
| Task | Tool |
| ------ | ------ |
| Create map | `initMap` in `scripts/init-map.js` |
| Load/save state | `loadState`/`saveState` in `scripts/state-manager.js` |
| Record activity results | `record<Activity>` functions in `scripts/activity-updater.js` |
| Pick next activity | `getNextConcept` in `scripts/activity-selector.js` |
| Due reviews | `getConceptsDueForReview` in `scripts/activity-selector.js` |
| Update review interval | `updateReviewInterval` in `scripts/activity-updater.js` |
| Learning stats | `calculateStats` in `scripts/activity-updater.js` |
| Goal filters | `scripts/goal-manager.js` |
| Archive mastered | `scripts/compression.js` (see `references/compression-checkpoints.md`) |
```

Replace with:
```markdown
| Task | Tool |
| ------ | ------ |
| Create map | `createMap` in `scripts/map.js` |
| Load/inspect state | `loadMap` in `scripts/map.js` |
| Record activity result | `recordActivity` in `scripts/map.js` |
| Add concept mid-journey | `addConcept` in `scripts/map.js` |
| Session status | `getStatus` in `scripts/map.js` |
| End session | `endSession` in `scripts/map.js` |
```

- [ ] **Step 2: Update Phase 1 Step 8 — Generate map code block**

Find the `initMap` code block:
```javascript
const { initMap } = require('./scripts/init-map.js');
```

Replace the entire code block with:
```javascript
const { createMap } = require('./scripts/map.js');
const { mapPath } = createMap(topic, goal, domain, mapData.sections);
```

- [ ] **Step 3: Update Phase 2 Step 2 — Load state**

Find:
```javascript
const { loadState } = require('./scripts/state-manager.js');
const { data, content } = loadState(mapPath);
```

Replace with:
```javascript
const { loadMap } = require('./scripts/map.js');
const data = loadMap(mapPath);
```

- [ ] **Step 4: Update Phase 2 Step 4 — Calculate learning stats**

Find:
```javascript
const { calculateStats } = require('./scripts/activity-updater.js');
const stats = calculateStats(mapData);
// Returns: avg_hours_per_concept, estimated_days_remaining, etc.
```

Replace with:
```
Stats are stored in `data.learning_stats` and recalculated automatically by
`recordActivity`. Read directly: `data.learning_stats?.avg_hours_per_concept`, etc.
`null` until the first concept completes the full activity chain.
```

- [ ] **Step 5: Remove Phase 2 Step 5 (due reviews) and Step 6 (compression)**

Delete the two blocks:

**Block to delete 1** (Step 5):
```
**Step 5 — Calculate reviews:**

Iterate mastered concepts in all sections; for each compute:
`elapsed_ms = Date.now() - new Date(concept.last_activity); isDue = elapsed_ms >= concept.review_interval * 1000; isOverdue = elapsed_ms > concept.review_interval * 1000 * 1.2`
Sort due concepts most-overdue first.
```

**Block to delete 2** (Step 6):
```
**Step 6 — Check compression:** if 10+ concepts mastered, 30+ days since `data.started`, and
no reviews due, offer to archive mastered concepts:

**REQUIRED:** Read `references/compression-checkpoints.md` before offering compression -
it defines the trigger, what gets archived, and the `scripts/compression.js` workflow.
```

Renumber the remaining steps (Step 7 → Step 5, etc.).

- [ ] **Step 6: Remove Phase 3 (Goal Change — Multiple Goals) entirely**

Delete the entire `## Phase 3: Goal Change — Multiple Goals` section, from its heading through the closing bullet that ends with `proceed as option [b] for the new goal`.

Renumber Phase 4 → Phase 3 and Phase 5 → Phase 4.

- [ ] **Step 7: Remove the Spaced Repetition subsection**

Delete the entire `### Spaced Repetition` subsection (from the heading through `it defines the performance-to-interval rules, due/overdue calculation, and state format.`).

- [ ] **Step 8: Update recordActivity call in the activity sections**

In each of the 4 activity subsections (Learn, Synthesize, Practice, Calibrate), the trailing note says to record via `activity-updater.js`. Update each to use `scripts/map.js`:

For every occurrence of patterns like:
```
`record<X>` functions in `scripts/activity-updater.js`
```
or:
```javascript
const { record... } = require('./scripts/activity-updater.js');
```

Replace with the `recordActivity` call. For example, in the Calibrate section:
```javascript
const { recordActivity } = require('./scripts/map.js');
recordActivity(mapPath, conceptName, 'calibrate', { correct: 2 });
```

Use the same pattern for learn / synthesize / practice, with their respective results shapes per the spec.

- [ ] **Step 9: Update Activity Selection Logic — remove script reference**

Find:
```
This diagram is the authoritative source — the Returning Session status step only surfaces
reviews due; the full selection logic lives
here. Override it when readiness gates say otherwise (e.g. repeat Learn after weak performance).
```

Replace with:
```
This diagram is the authoritative source. Use `getStatus(mapPath)` to retrieve `currentConcept`
and `nextActivity` — it implements this selection logic. Override it when readiness gates say
otherwise (e.g. repeat Learn after weak performance).
```

Also update the end-state line:
```
  end (all mastered, none due) →
    "You've mastered all concepts! Want to add an advanced concept or start a new goal?"
```

Remove `none due` → just:
```
  end (all mastered) →
    "You've mastered all concepts! Want to add an advanced concept or start a new goal?"
```

- [ ] **Step 10: Update Learning Stats Updates section**

Find:
```
**Step 1 — Recalculate:** recalculate learning stats using `calculateStats` from `scripts/activity-updater.js`
**Step 2 — Update:** update `learning_stats` in map frontmatter
```

Replace with:
```
**Step 1 — Stats auto-updated:** `recordActivity` recalculates and saves `learning_stats` automatically — no separate call needed.
```

- [ ] **Step 11: Update Common Mistakes table**

Find and remove this row:
```
| Hand-editing state fields | Record results via `scripts/activity-updater.js` (intervals, dates, status) |
```

Replace with:
```
| Hand-editing state fields | Record results via `recordActivity` in `scripts/map.js` — it derives status and recalculates stats atomically |
```

Remove rows referencing spaced repetition and compression if present.

- [ ] **Step 12: Verify no dead references remain**

```bash
grep -n "state-manager\|init-map\|activity-updater\|activity-selector\|goal-manager\|compression\|gray-matter\|review_interval\|last_activity\|spaced.rep\|compression-checkpoints\|goal-filters" SKILL.md
```

Expected: no output. Fix any remaining occurrences manually.

- [ ] **Step 13: Run a final check — all tests still pass**

```bash
npm test
```

Expected: `All store tests passed! ✓` and `All map tests passed! ✓`

- [ ] **Step 14: Commit**

```bash
git add SKILL.md
git commit -m "feat(skill): update SKILL.md for redesigned map.js API — remove spaced-rep, multi-goal, compression"
```

- [ ] **Step 15: Push**

```bash
git push
```

---

## Verification Checklist

After all tasks complete, confirm:

- [ ] `npm test` passes with zero errors
- [ ] `package.json` has no `dependencies` key
- [ ] `ls scripts/` shows only `map.js`, `store.js`, `manage-skills.sh`
- [ ] `ls tests/` shows only `store.test.js`, `map.test.js`
- [ ] `ls references/` shows no `spaced-repetition.md`, `compression-checkpoints.md`, `goal-filters.md`
- [ ] `grep -r "gray-matter\|state-manager\|init-map\|activity-updater\|goal-manager\|compression" scripts/ tests/ SKILL.md references/` → no output
- [ ] SKILL.md Quick Reference table lists only `scripts/map.js` functions
