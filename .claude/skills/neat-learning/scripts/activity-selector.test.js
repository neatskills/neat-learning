#!/usr/bin/env node

const assert = require('assert');
const {
  checkReviewDue,
  getConceptsDueForReview,
  getNextActivity,
  getNextConcept,
  checkPracticePrerequisites,
  generateSessionStatus
} = require('./activity-selector');

console.log('Testing activity-selector.js...\n');

// Test 1: checkReviewDue - not due
console.log('Test 1: checkReviewDue - not due');
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
let concept = {
  review_interval: 345600, // 4 days
  last_activity: twoDaysAgo
};
let reviewStatus = checkReviewDue(concept);
assert.strictEqual(reviewStatus.isDue, false);
assert.strictEqual(reviewStatus.isOverdue, false);
assert.strictEqual(reviewStatus.daysUntilDue, 2);
console.log('✓ Not due for review detected correctly\n');

// Test 2: checkReviewDue - due
console.log('Test 2: checkReviewDue - due');
const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString();
concept = {
  review_interval: 345600, // 4 days
  last_activity: fourDaysAgo
};
reviewStatus = checkReviewDue(concept);
assert.strictEqual(reviewStatus.isDue, true);
assert.strictEqual(reviewStatus.isOverdue, false);
console.log('✓ Due for review detected correctly\n');

// Test 3: checkReviewDue - overdue
console.log('Test 3: checkReviewDue - overdue');
const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString();
concept = {
  review_interval: 345600, // 4 days
  last_activity: sixDaysAgo
};
reviewStatus = checkReviewDue(concept);
assert.strictEqual(reviewStatus.isDue, true);
assert.strictEqual(reviewStatus.isOverdue, true);
console.log('✓ Overdue for review detected correctly\n');

// Test 4: getNextActivity - Level 0, not started
console.log('Test 4: getNextActivity - Level 0 (not started)');
concept = { level: 0 };
assert.strictEqual(getNextActivity(concept), 'explore');
console.log('✓ Level 0 → explore\n');

// Test 5: getNextActivity - Level 1, ready for name
console.log('Test 5: getNextActivity - Level 1 (ready for name)');
concept = { level: 1, activity: { status: 'ready_for_name' } };
assert.strictEqual(getNextActivity(concept), 'name');
console.log('✓ Level 1 → name\n');

// Test 6: getNextActivity - Level 2, ready for practice
console.log('Test 6: getNextActivity - Level 2 (ready for practice)');
concept = { level: 2, activity: { status: 'ready_for_practice' } };
assert.strictEqual(getNextActivity(concept), 'practice');
console.log('✓ Level 2 → practice\n');

// Test 7: getNextActivity - Level 3, needs more practice
console.log('Test 7: getNextActivity - Level 3 (needs more practice)');
concept = { level: 3, activity: { status: 'needs_more_practice' } };
assert.strictEqual(getNextActivity(concept), 'practice');
console.log('✓ Level 3 → practice\n');

// Test 8: getNextActivity - Level 4, ready for calibrate
console.log('Test 8: getNextActivity - Level 4 (ready for calibrate)');
concept = { level: 4, activity: { status: 'ready_for_calibrate' } };
assert.strictEqual(getNextActivity(concept), 'calibrate');
console.log('✓ Level 4 → calibrate\n');

// Test 9: getNextActivity - Level 5+, not due for review
console.log('Test 9: getNextActivity - Level 5+ (mastered, not due)');
concept = {
  level: 6,
  review_interval: 172800,
  last_activity: new Date().toISOString()
};
assert.strictEqual(getNextActivity(concept), 'done');
console.log('✓ Level 5+ not due → done\n');

// Test 10: getNextActivity - Level 5+, due for review
console.log('Test 10: getNextActivity - Level 5+ (mastered, due)');
concept = {
  level: 6,
  review_interval: 172800,
  last_activity: new Date(Date.now() - 3 * 86400000).toISOString()
};
assert.strictEqual(getNextActivity(concept), 'review');
console.log('✓ Level 5+ due → review\n');

// Test 11: getConceptsDueForReview
console.log('Test 11: getConceptsDueForReview');
const sections = [
  {
    name: 'Foundation',
    concepts: [
      {
        name: 'Pod',
        level: 6,
        review_interval: 345600, // 4 days
        last_activity: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        name: 'Service',
        level: 5,
        review_interval: 172800, // 2 days
        last_activity: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        name: 'ConfigMap',
        level: 3
      }
    ]
  }
];
const dueReviews = getConceptsDueForReview(sections);
assert.strictEqual(dueReviews.length, 1, 'Should find 1 concept due for review');
assert.strictEqual(dueReviews[0].name, 'Service');
assert.strictEqual(dueReviews[0].isOverdue, true);
console.log('✓ Due reviews identified correctly\n');

// Test 12: getNextConcept - returns review first
console.log('Test 12: getNextConcept - prioritizes reviews');
const next = getNextConcept(sections);
assert.strictEqual(next.concept.name, 'Service');
assert.strictEqual(next.activity, 'review');
console.log('✓ Reviews prioritized correctly\n');

// Test 13: getNextConcept - skip reviews
console.log('Test 13: getNextConcept - skip reviews');
const nextNoReview = getNextConcept(sections, { skipReviews: true });
assert.strictEqual(nextNoReview.concept.name, 'ConfigMap');
assert.strictEqual(nextNoReview.activity, 'practice');
console.log('✓ Skip reviews works correctly\n');

// Test 14: checkPracticePrerequisites - all met
console.log('Test 14: checkPracticePrerequisites - all met');
const sectionsWithDeps = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', level: 5 },
      { name: 'Service', level: 4 }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', level: 2, requires: ['Pod', 'Service'] }
    ]
  }
];
const deployment = sectionsWithDeps[1].concepts[0];
assert.strictEqual(checkPracticePrerequisites(deployment, sectionsWithDeps), true);
console.log('✓ Prerequisites check passed\n');

// Test 15: checkPracticePrerequisites - not met
console.log('Test 15: checkPracticePrerequisites - not met');
const sectionsWithUnmetDeps = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', level: 5 },
      { name: 'Service', level: 2 }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', level: 2, requires: ['Pod', 'Service'] }
    ]
  }
];
const deploymentUnmet = sectionsWithUnmetDeps[1].concepts[0];
assert.strictEqual(checkPracticePrerequisites(deploymentUnmet, sectionsWithUnmetDeps), false);
console.log('✓ Prerequisites check failed correctly\n');

// Test 16: generateSessionStatus
console.log('Test 16: generateSessionStatus');
const message = generateSessionStatus(sections, 3);
assert(message.includes('Welcome back'));
assert(message.includes('Due for review'));
assert(message.includes('Service'));
console.log('✓ Session status generated correctly\n');

console.log('All tests passed! ✓');
