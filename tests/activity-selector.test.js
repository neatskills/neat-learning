#!/usr/bin/env node

const assert = require('assert');
const {
  checkReviewDue,
  getConceptsDueForReview,
  getNextActivity,
  getNextConcept,
  checkPracticePrerequisites
} = require('../scripts/activity-selector');

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

// Test 4: getNextActivity - not started
console.log('Test 4: getNextActivity - not started');
concept = { status: 'not-started' };
assert.strictEqual(getNextActivity(concept), 'learn');
console.log('✓ not-started → learn\n');

// Test 5: getNextActivity - Learn done
console.log('Test 5: getNextActivity - Learn done');
concept = { status: 'learning', activity: { learn: { date: twoDaysAgo } } };
assert.strictEqual(getNextActivity(concept), 'synthesize');
console.log('✓ Learn done → synthesize\n');

// Test 6: getNextActivity - Synthesize done
console.log('Test 6: getNextActivity - Synthesize done');
concept = {
  status: 'learning',
  activity: { learn: { date: twoDaysAgo }, synthesize: { completed: twoDaysAgo } }
};
assert.strictEqual(getNextActivity(concept), 'practice');
console.log('✓ Synthesize done → practice\n');

// Test 7: getNextActivity - Practice done
console.log('Test 7: getNextActivity - Practice done');
concept = {
  status: 'practicing',
  activity: {
    learn: { date: twoDaysAgo },
    synthesize: { completed: twoDaysAgo },
    practice: { date: twoDaysAgo }
  }
};
assert.strictEqual(getNextActivity(concept), 'calibrate');
console.log('✓ Practice done → calibrate\n');

// Test 8: getNextActivity - failed Calibrate retries
console.log('Test 8: getNextActivity - failed Calibrate');
concept = {
  status: 'practicing',
  activity: {
    learn: { date: twoDaysAgo },
    synthesize: { completed: twoDaysAgo },
    practice: { date: twoDaysAgo },
    calibrate: { date: twoDaysAgo, judgment: { correct: 1, total: 3 } }
  }
};
assert.strictEqual(getNextActivity(concept), 'calibrate');
console.log('✓ Failed calibrate → calibrate again\n');

// Test 9: getNextActivity - mastered, not due for review
console.log('Test 9: getNextActivity - mastered, not due');
concept = {
  status: 'mastered',
  review_interval: 172800,
  last_activity: new Date().toISOString()
};
assert.strictEqual(getNextActivity(concept), 'done');
console.log('✓ Mastered not due → done\n');

// Test 10: getNextActivity - mastered, due for review
console.log('Test 10: getNextActivity - mastered, due');
concept = {
  status: 'mastered',
  review_interval: 172800,
  last_activity: new Date(Date.now() - 3 * 86400000).toISOString()
};
assert.strictEqual(getNextActivity(concept), 'review');
console.log('✓ Mastered due → review\n');

// Test 11: getConceptsDueForReview
console.log('Test 11: getConceptsDueForReview');
const sections = [
  {
    name: 'Foundation',
    concepts: [
      {
        name: 'Pod',
        status: 'mastered',
        review_interval: 345600, // 4 days
        last_activity: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        name: 'Service',
        status: 'mastered',
        review_interval: 172800, // 2 days
        last_activity: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        name: 'ConfigMap',
        status: 'practicing',
        activity: {
          learn: { date: twoDaysAgo },
          synthesize: { completed: twoDaysAgo },
          practice: { date: twoDaysAgo }
        }
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
assert.strictEqual(nextNoReview.activity, 'calibrate');
console.log('✓ Skip reviews works correctly\n');

// Test 14: checkPracticePrerequisites - all met
console.log('Test 14: checkPracticePrerequisites - all met');
const sectionsWithDeps = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', status: 'mastered' },
      { name: 'Service', status: 'practicing' }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', status: 'learning', dependencies: { requires: ['Pod', 'Service'], enables: [] } }
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
      { name: 'Pod', status: 'mastered' },
      { name: 'Service', status: 'learning' }
    ]
  },
  {
    name: 'Core',
    concepts: [
      { name: 'Deployment', status: 'learning', dependencies: { requires: ['Pod', 'Service'], enables: [] } }
    ]
  }
];
const deploymentUnmet = sectionsWithUnmetDeps[1].concepts[0];
assert.strictEqual(checkPracticePrerequisites(deploymentUnmet, sectionsWithUnmetDeps), false);
console.log('✓ Prerequisites check failed correctly\n');

console.log('All tests passed! ✓');
