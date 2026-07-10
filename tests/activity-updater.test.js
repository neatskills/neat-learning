#!/usr/bin/env node

const assert = require('assert');
const {
  recordLearn,
  recordSynthesize,
  recordPractice,
  recordCalibrate,
  updateReviewInterval,
  calculateProgress
} = require('../scripts/activity-updater');

console.log('Testing activity-updater.js...\n');

// Test 1: recordLearn with strong performance
console.log('Test 1: recordLearn - strong performance');
let concept = { status: 'not-started' };
concept = recordLearn(concept, 5, 5, 0, [], ['lifecycle', 'restart-policy']);
assert.strictEqual(concept.status, 'learning', 'Status should be learning after Learn');
assert.strictEqual(concept.activity.learn.questions.correct, 5);
assert.strictEqual(concept.activity.learn.hints_needed, 0);
console.log('✓ Strong learn performance recorded correctly\n');

// Test 2: recordLearn with weak performance
console.log('Test 2: recordLearn - weak performance');
concept = { status: 'not-started' };
concept = recordLearn(concept, 2, 5, 3, ['confused Pod vs Container'], []);
assert.strictEqual(concept.status, 'learning', 'Status should be learning even after weak Learn');
assert.strictEqual(concept.activity.learn.signals.confusion.length, 1);
console.log('✓ Weak learn performance recorded correctly\n');

// Test 3: recordLearn with coverage
console.log('Test 3: recordLearn - coverage tracked');
concept = { status: 'not-started' };
concept = recordLearn(concept, 4, 4, 1, [], ['regions-vs-azs'], {
  core: ['regions-vs-azs', 'account-boundaries'],
  depth: ['multi-account-strategy'],
  breadth: []
});
assert.strictEqual(concept.activity.learn.coverage.core.length, 2, 'Coverage core topics recorded');
console.log('✓ Learn coverage recorded correctly\n');

// Test 4: recordSynthesize
console.log('Test 4: recordSynthesize');
concept = { status: 'learning' };
concept = recordSynthesize(concept, ['Pod', 'Pod spec', 'Pod lifecycle'], 'Pod wraps containers');
assert.strictEqual(concept.status, 'learning', 'Status stays learning after Synthesize');
assert.strictEqual(concept.activity.synthesize.terms.length, 3);
assert.ok(concept.activity.synthesize.completed, 'Synthesize records completed timestamp');
console.log('✓ Synthesize activity recorded correctly\n');

// Test 5: recordPractice
console.log('Test 5: recordPractice');
concept = { status: 'learning' };
const exercises = [
  { name: 'Write Pod manifest', status: 'complete', errors: 0 },
  { name: 'Debug Pod', status: 'complete', errors: 1 }
];
concept = recordPractice(concept, exercises, true, []);
assert.strictEqual(concept.status, 'practicing', 'Status should be practicing after Practice');
assert.strictEqual(concept.activity.practice.independence, true);
assert.strictEqual(concept.activity.practice.exercises.length, 2);
console.log('✓ Practice recorded correctly\n');

// Test 6: recordCalibrate - passed (2/3)
console.log('Test 6: recordCalibrate - passed 2/3');
concept = { status: 'practicing' };
concept = recordCalibrate(concept, 2, ['knows when NOT to use', 'understands tradeoffs']);
assert.strictEqual(concept.status, 'mastered', 'Status should be mastered after passing calibrate');
assert.strictEqual(concept.activity.calibrate.judgment.correct, 2);
assert.strictEqual(concept.review_interval, 172800, 'Review interval should be 2 days');
assert.ok(concept.last_activity, 'last_activity should be set on mastery');
console.log('✓ Calibrate pass (2/3) recorded correctly\n');

// Test 7: recordCalibrate - passed perfectly (3/3)
console.log('Test 7: recordCalibrate - passed 3/3');
concept = { status: 'practicing' };
concept = recordCalibrate(concept, 3, ['all expert patterns']);
assert.strictEqual(concept.status, 'mastered');
console.log('✓ Calibrate perfect pass (3/3) recorded correctly\n');

// Test 8: recordCalibrate - failed (1/3)
console.log('Test 8: recordCalibrate - failed 1/3');
concept = { status: 'practicing' };
concept = recordCalibrate(concept, 1, []);
assert.strictEqual(concept.status, 'practicing', 'Status should stay practicing after failed calibrate');
assert.strictEqual(concept.review_interval, undefined, 'No review interval until mastered');
console.log('✓ Calibrate failure recorded correctly\n');

// Test 9: updateReviewInterval - perfect (5/5) doubles
console.log('Test 9: updateReviewInterval - perfect (5/5)');
concept = { status: 'mastered', review_interval: 172800 };
concept = updateReviewInterval(concept, 5, 5);
assert.strictEqual(concept.review_interval, 345600, 'Interval should double (2 days → 4 days)');
console.log('✓ Review interval doubled correctly\n');

// Test 10: updateReviewInterval - good (4/5) increases 1.5x
console.log('Test 10: updateReviewInterval - good (4/5)');
concept = { status: 'mastered', review_interval: 172800 };
concept = updateReviewInterval(concept, 4, 5);
assert.strictEqual(concept.review_interval, 259200, 'Interval should be 1.5x (2 days → 3 days)');
console.log('✓ Review interval increased 1.5x correctly\n');

// Test 11: updateReviewInterval - OK (3/5) stays the same
console.log('Test 11: updateReviewInterval - OK (3/5)');
concept = { status: 'mastered', review_interval: 172800 };
concept = updateReviewInterval(concept, 3, 5);
assert.strictEqual(concept.review_interval, 172800, 'Interval should stay the same');
console.log('✓ Review interval kept the same correctly\n');

// Test 12: updateReviewInterval - weak (1/5) halves
console.log('Test 12: updateReviewInterval - weak (1/5)');
concept = { status: 'mastered', review_interval: 345600 };
concept = updateReviewInterval(concept, 1, 5);
assert.strictEqual(concept.review_interval, 172800, 'Interval should halve (4 days → 2 days)');
console.log('✓ Review interval halved correctly\n');

// Test 13: updateReviewInterval - clamping to max
console.log('Test 13: updateReviewInterval - max clamp');
concept = { status: 'mastered', review_interval: 3000000 };
concept = updateReviewInterval(concept, 5, 5);
assert.strictEqual(concept.review_interval, 5184000, 'Interval should clamp to 60 days');
console.log('✓ Review interval clamped to max correctly\n');

// Test 14: updateReviewInterval - clamping to min
console.log('Test 14: updateReviewInterval - min clamp');
concept = { status: 'mastered', review_interval: 86400 };
concept = updateReviewInterval(concept, 1, 5);
assert.strictEqual(concept.review_interval, 86400, 'Interval should clamp to 1 day');
console.log('✓ Review interval clamped to min correctly\n');

// Test 15: calculateProgress
console.log('Test 15: calculateProgress');
const sections = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', status: 'mastered' },
      { name: 'Service', status: 'mastered' },
      { name: 'ConfigMap', status: 'practicing' }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', status: 'learning' },
      { name: 'StatefulSet', status: 'not-started' }
    ]
  }
];
const progress = calculateProgress(sections);
assert.strictEqual(progress.mastered, 2, 'Should count 2 mastered concepts');
assert.strictEqual(progress.total, 5, 'Should count 5 total concepts');
console.log('✓ Progress calculated correctly\n');

console.log('All tests passed! ✓');
