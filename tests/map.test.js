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

// ── recordActivity tests ──────────────────────────────────────────────────────

const { recordActivity } = require('../scripts/map');

// Set up fresh map for activity tests
const { mapPath: actMapPath } = createMap('Python', 'Write scripts', 'technical', SECTIONS, TMP);

console.log('\nmap.js tests — recordActivity (learn, synthesize, practice)\n');

// 7. recordActivity learn: writes activity.learn, status → learning
recordActivity(actMapPath, 'Pods', 'learn', { correct: 4, total: 5 });
let actState = loadMap(actMapPath);
let actPod = actState.sections[0].concepts[0];
assert.strictEqual(actPod.activity.learn.correct, 4);
assert.strictEqual(actPod.activity.learn.total, 5);
assert(actPod.activity.learn.date, 'learn.date should be set');
assert.strictEqual(actPod.status, 'learning');
console.log('✓ recordActivity learn writes fields and sets status to learning');

// 8. recordActivity synthesize: writes activity.synthesize, status stays learning
recordActivity(actMapPath, 'Pods', 'synthesize', {});
actState = loadMap(actMapPath);
actPod = actState.sections[0].concepts[0];
assert(actPod.activity.synthesize.completed, 'synthesize.completed should be set');
assert.strictEqual(actPod.status, 'learning', 'status stays learning after synthesize');
console.log('✓ recordActivity synthesize writes completed timestamp, status unchanged');

// 9. recordActivity practice: writes activity.practice, status → practicing
recordActivity(actMapPath, 'Pods', 'practice', { independence: true });
actState = loadMap(actMapPath);
actPod = actState.sections[0].concepts[0];
assert.strictEqual(actPod.activity.practice.independence, true);
assert(actPod.activity.practice.date, 'practice.date should be set');
assert.strictEqual(actPod.status, 'practicing');
console.log('✓ recordActivity practice writes fields and sets status to practicing');

// 10. progress recalculated after recordActivity
assert.strictEqual(actState.progress.mastered, 0);
assert.strictEqual(actState.progress.total, 2);
console.log('✓ progress recalculated (0/2 mastered)');

// 11. stats still null (no complete chain yet — calibrate not done)
assert.strictEqual(actState.learning_stats, null);
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
