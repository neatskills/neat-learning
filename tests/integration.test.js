#!/usr/bin/env node

/**
 * Integration test - full learning session flow
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createNewMap, saveState, loadState } = require('../scripts/state-manager');
const { recordLearn, recordSynthesize, recordPractice, recordCalibrate, updateReviewInterval, calculateProgress } = require('../scripts/activity-updater');

console.log('Integration Test: Full Learning Session Flow\n');

const testDir = path.join(__dirname, '../test-output');

// Cleanup and setup
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}
fs.mkdirSync(testDir, { recursive: true });

// Test: Create new learning map
console.log('1. Creating new Kubernetes learning map...');
let { data, content } = createNewMap('Kubernetes', 'Deploy applications', 'technical');

const mapData = {
  sections: [
    {
      name: 'Foundation',
      concepts: [{ name: 'Kubernetes Basics', description: 'Fundamental concepts', status: 'not-started', dependencies: { requires: [], enables: ['Kubernetes Practice'] } }]
    },
    {
      name: 'Core',
      concepts: [{ name: 'Kubernetes Practice', description: 'Practical application', status: 'not-started', dependencies: { requires: ['Kubernetes Basics'], enables: [] } }]
    }
  ]
};
data.sections = mapData.sections;
data.progress = calculateProgress(mapData.sections);

const mapPath = path.join(testDir, 'kubernetes-map.md');
saveState(mapPath, data, content);
console.log('✓ Map created and saved\n');

// Test: Load state
console.log('2. Loading state from file...');
let state = loadState(mapPath);
assert(state.data.sections.length > 0, 'Should have sections');
assert.strictEqual(state.data.goal, 'Deploy applications');
console.log(`✓ State loaded: ${state.data.sections.length} sections\n`);

// Test: First concept - Learn activity
console.log('3. Running Learn activity on Kubernetes Basics...');
let podConcept = state.data.sections[0].concepts[0];
assert.strictEqual(podConcept.name, 'Kubernetes Basics');
assert.strictEqual(podConcept.status, 'not-started');

podConcept = recordLearn(podConcept, 5, 5, 0, [], ['lifecycle', 'restart-policy']);
assert.strictEqual(podConcept.status, 'learning');

state.data.sections[0].concepts[0] = podConcept;
state.data.progress = calculateProgress(state.data.sections);
saveState(mapPath, state.data, state.content);
console.log('✓ Learn completed, status learning, ready for Synthesize\n');

// Test: Synthesize activity
console.log('4. Running Synthesize activity on Kubernetes Basics...');
state = loadState(mapPath);
podConcept = state.data.sections[0].concepts[0];
podConcept = recordSynthesize(podConcept, ['Pod', 'Pod spec', 'Pod lifecycle']);
assert.strictEqual(podConcept.status, 'learning');

state.data.sections[0].concepts[0] = podConcept;
state.data.progress = calculateProgress(state.data.sections);
saveState(mapPath, state.data, state.content);
console.log('✓ Synthesize completed, ready for Practice\n');

// Test: Practice activity
console.log('5. Running Practice activity on Kubernetes Basics...');
state = loadState(mapPath);
podConcept = state.data.sections[0].concepts[0];
const exercises = [
  { name: 'Write Pod manifest', status: 'complete', errors: 0 },
  { name: 'Debug Pod', status: 'complete', errors: 0 }
];
podConcept = recordPractice(podConcept, exercises, true, []);
assert.strictEqual(podConcept.status, 'practicing');

state.data.sections[0].concepts[0] = podConcept;
state.data.progress = calculateProgress(state.data.sections);
saveState(mapPath, state.data, state.content);
console.log('✓ Practice completed, status practicing, ready for Calibrate\n');

// Test: Calibrate activity
console.log('6. Running Calibrate activity on Kubernetes Basics...');
state = loadState(mapPath);
podConcept = state.data.sections[0].concepts[0];
podConcept = recordCalibrate(podConcept, 3, ['knows tradeoffs', 'expert thinking']);
assert.strictEqual(podConcept.status, 'mastered');
assert.strictEqual(podConcept.activity.calibrate.judgment.correct, 3);
assert.strictEqual(podConcept.review_interval, 172800); // 2 days

state.data.sections[0].concepts[0] = podConcept;
state.data.progress = calculateProgress(state.data.sections);
assert.strictEqual(state.data.progress.mastered, 1);
saveState(mapPath, state.data, state.content);
console.log('✓ Calibrate completed, mastered\n');

// Test: Second concept still untouched
console.log('7. Verifying second concept is not-started...');
state = loadState(mapPath);
const secondConcept = state.data.sections[1].concepts[0];
assert.strictEqual(secondConcept.status, 'not-started', 'Second concept should be untouched');
console.log(`✓ Second concept: ${secondConcept.name} (not-started)\n`);

// Test: Review due check (simulate time passing)
console.log('8. Simulating 3 days passing...');
state = loadState(mapPath);
podConcept = state.data.sections[0].concepts[0];
// Manually set last_activity to 3 days ago
podConcept.last_activity = new Date(Date.now() - 3 * 86400000).toISOString();
state.data.sections[0].concepts[0] = podConcept;
saveState(mapPath, state.data, state.content);

state = loadState(mapPath);
const masteredConcept = state.data.sections[0].concepts[0];
const elapsedMs = Date.now() - new Date(masteredConcept.last_activity).getTime();
const reviewIntervalMs = masteredConcept.review_interval * 1000;
assert(elapsedMs >= reviewIntervalMs, 'Kubernetes Basics should be due for review');
assert(elapsedMs > reviewIntervalMs * 1.2, 'Kubernetes Basics should be overdue (past 20% grace)');
console.log('✓ Kubernetes Basics is now overdue for review\n');

// Test: Review activity updates interval
console.log('9. Running review (perfect performance)...');
podConcept = state.data.sections[0].concepts[0];
const oldInterval = podConcept.review_interval;
podConcept = updateReviewInterval(podConcept, 5, 5); // Perfect
assert.strictEqual(podConcept.review_interval, oldInterval * 2); // Should double
console.log(`✓ Review completed, interval increased from ${oldInterval / 86400} days to ${podConcept.review_interval / 86400} days\n`);

// Test: Progress tracking
console.log('10. Checking overall progress...');
state = loadState(mapPath);
const progress = calculateProgress(state.data.sections);
console.log(`   Mastered: ${progress.mastered}/${progress.total} concepts`);
assert(progress.mastered >= 1, 'Should have at least 1 mastered');
assert(progress.total >= 2, 'Should have at least 2 total concepts');
console.log('✓ Progress tracked correctly\n');

// Cleanup
fs.rmSync(testDir, { recursive: true });
console.log('All integration tests passed! ✓');
console.log('\nFull flow verified:');
console.log('  1. Create map');
console.log('  2. Learn → Synthesize → Practice → Calibrate → Mastered');
console.log('  3. Spaced repetition scheduling');
console.log('  4. Review interval updates');
console.log('  5. Progress tracking');
