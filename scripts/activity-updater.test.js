#!/usr/bin/env node

const assert = require('assert');
const {
  recordLearn,
  recordSynthesize,
  recordPractice,
  recordCalibrate,
  updateReviewInterval,
  calculateProgress
} = require('./activity-updater');

console.log('Testing activity-updater.js...\n');

// Test 1: recordLearn with strong performance
console.log('Test 1: recordLearn - strong performance');
let concept = { level: 0 };
concept = recordLearn(concept, 5, 5, 0, [], ['lifecycle', 'restart-policy']);
assert.strictEqual(concept.level, 1, 'Level should be 1 after strong learn');
assert.strictEqual(concept.activity.status, 'ready_for_synthesize');
assert.strictEqual(concept.activity.learn.questions.correct, 5);
assert.strictEqual(concept.activity.learn.hints_needed, 0);
console.log('✓ Strong learn performance recorded correctly\n');

// Test 2: recordLearn with weak performance
console.log('Test 2: recordLearn - weak performance');
concept = { level: 0 };
concept = recordLearn(concept, 2, 5, 3, ['confused Pod vs Container'], []);
assert.strictEqual(concept.level, 0, 'Level should stay 0 after weak learn');
assert.strictEqual(concept.activity.status, 'needs_more_learny');
assert.strictEqual(concept.activity.learn.signals.confusion.length, 1);
console.log('✓ Weak learn performance recorded correctly\n');

// Test 3: recordSynthesize
console.log('Test 3: recordSynthesize');
concept = { level: 1, activity: { status: 'ready_for_synthesize' } };
concept = recordSynthesize(concept, ['Pod', 'Pod spec', 'Pod lifecycle'], 'Pod wraps containers');
assert.strictEqual(concept.level, 2, 'Level should be 2 after Synthesize');
assert.strictEqual(concept.activity.status, 'ready_for_practice');
assert.strictEqual(concept.activity.synthesize.terms.length, 3);
console.log('✓ Synthesize activity recorded correctly\n');

// Test 4: recordPractice - successful
console.log('Test 4: recordPractice - successful');
concept = { level: 2, activity: { status: 'ready_for_practice' } };
const exercises = [
  { name: 'Write Pod manifest', status: 'complete', errors: 0 },
  { name: 'Debug Pod', status: 'complete', errors: 1 }
];
concept = recordPractice(concept, exercises, true, []);
assert.strictEqual(concept.level, 4, 'Level should be 4 after successful practice');
assert.strictEqual(concept.activity.status, 'ready_for_calibrate');
assert.strictEqual(concept.activity.practice.independence, true);
console.log('✓ Successful practice recorded correctly\n');

// Test 5: recordPractice - needs more practice
console.log('Test 5: recordPractice - needs more practice');
concept = { level: 2, activity: { status: 'ready_for_practice' } };
const weakExercises = [
  { name: 'Write Deployment', status: 'attempted', errors: 3 }
];
concept = recordPractice(concept, weakExercises, false, ['confused replicas']);
assert.strictEqual(concept.level, 3, 'Level should be 3 after weak practice');
assert.strictEqual(concept.activity.status, 'needs_more_practice');
console.log('✓ Weak practice recorded correctly\n');

// Test 6: recordCalibrate - passed (2/3)
console.log('Test 6: recordCalibrate - passed 2/3');
concept = { level: 4, activity: { status: 'ready_for_calibrate' } };
concept = recordCalibrate(concept, 2, ['knows when NOT to use', 'understands tradeoffs']);
assert.strictEqual(concept.level, 5, 'Level should be 5 after passing calibrate');
assert.strictEqual(concept.activity.status, 'mastered');
assert.strictEqual(concept.review_interval, 172800, 'Review interval should be 2 days');
console.log('✓ Calibrate pass (2/3) recorded correctly\n');

// Test 7: recordCalibrate - passed perfectly (3/3)
console.log('Test 7: recordCalibrate - passed 3/3');
concept = { level: 4, activity: { status: 'ready_for_calibrate' } };
concept = recordCalibrate(concept, 3, ['all expert patterns']);
assert.strictEqual(concept.level, 7, 'Level should be 7 after perfect calibrate');
assert.strictEqual(concept.activity.status, 'mastered');
console.log('✓ Calibrate perfect pass (3/3) recorded correctly\n');

// Test 8: recordCalibrate - failed (1/3)
console.log('Test 8: recordCalibrate - failed 1/3');
concept = { level: 4, activity: { status: 'ready_for_calibrate' } };
concept = recordCalibrate(concept, 1, []);
assert.strictEqual(concept.level, 4, 'Level should stay 4 after failed calibrate');
assert.strictEqual(concept.activity.status, 'needs_more_calibrate');
console.log('✓ Calibrate failure recorded correctly\n');

// Test 9: updateReviewInterval - perfect performance
console.log('Test 9: updateReviewInterval - perfect (5/5)');
concept = { level: 5, review_interval: 172800 };
concept = updateReviewInterval(concept, 5, 5);
assert.strictEqual(concept.review_interval, 345600, 'Interval should double (2 days → 4 days)');
console.log('✓ Review interval doubled correctly\n');

// Test 10: updateReviewInterval - good performance (3/5 = 0.6)
console.log('Test 10: updateReviewInterval - good (3/5)');
concept = { level: 5, review_interval: 172800 };
concept = updateReviewInterval(concept, 3, 5);
assert.strictEqual(concept.review_interval, 259200, 'Interval should be 1.5x (2 days → 3 days)');
console.log('✓ Review interval increased 1.5x correctly\n');

// Test 11: updateReviewInterval - weak performance
console.log('Test 11: updateReviewInterval - weak (1/5)');
concept = { level: 5, review_interval: 345600 };
concept = updateReviewInterval(concept, 1, 5);
assert.strictEqual(concept.review_interval, 172800, 'Interval should halve (4 days → 2 days)');
console.log('✓ Review interval halved correctly\n');

// Test 12: updateReviewInterval - clamping to max
console.log('Test 12: updateReviewInterval - max clamp');
concept = { level: 7, review_interval: 3000000 };
concept = updateReviewInterval(concept, 5, 5);
assert.strictEqual(concept.review_interval, 5184000, 'Interval should clamp to 60 days');
console.log('✓ Review interval clamped to max correctly\n');

// Test 13: updateReviewInterval - clamping to min
console.log('Test 13: updateReviewInterval - min clamp');
concept = { level: 5, review_interval: 86400 };
concept = updateReviewInterval(concept, 1, 5);
assert.strictEqual(concept.review_interval, 86400, 'Interval should clamp to 1 day');
console.log('✓ Review interval clamped to min correctly\n');

// Test 14: calculateProgress
console.log('Test 14: calculateProgress');
const sections = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', level: 6 },
      { name: 'Service', level: 5 },
      { name: 'ConfigMap', level: 3 }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', level: 2 },
      { name: 'StatefulSet', level: 0 }
    ]
  }
];
const progress = calculateProgress(sections);
assert.strictEqual(progress.mastered, 2, 'Should count 2 mastered concepts (level 5+)');
assert.strictEqual(progress.total, 5, 'Should count 5 total concepts');
assert.strictEqual(progress.overall_level, 3.2, 'Average level should be 3.2');
console.log('✓ Progress calculated correctly\n');

console.log('All tests passed! ✓');
