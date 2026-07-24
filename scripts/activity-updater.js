#!/usr/bin/env node

/**
 * Activity result updater - records activity performance and updates concept state
 */

const { ensureActivity, now: getNow, INITIAL_REVIEW_INTERVAL, clamp, isMastered, flattenConcepts } = require('./utils');

/**
 * Record Learn activity results
 * @param {Object} concept - Current concept object from state
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total questions asked
 * @param {number} hintsNeeded - Hints given
 * @param {Array<string>} confusionPatterns - Detected confusion patterns
 * @param {Array<string>} strengths - Identified strengths
 * @param {Object|null} coverage - Question coverage {core, depth, breadth} (arrays of topic slugs)
 * @returns {Object} Updated concept with Learn results
 */
function recordLearn(concept, correct, total, hintsNeeded, confusionPatterns = [], strengths = [], coverage = null) {
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.learn = {
    date: timestamp,
    questions: { correct, total },
    hints_needed: hintsNeeded,
    signals: {
      confusion: confusionPatterns,
      strengths: strengths
    }
  };

  if (coverage) {
    activity.learn.coverage = coverage;
  }

  concept.status = 'learning';

  return concept;
}

/**
 * Record Synthesize activity results
 * @param {Object} concept - Current concept object
 * @param {Array<string>} termsIntroduced - List of terms introduced
 * @param {string} mentalModel - Brief mental model description
 * @returns {Object} Updated concept with Synthesize results
 */
function recordSynthesize(concept, termsIntroduced, mentalModel = '') {
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.synthesize = {
    completed: timestamp,
    terms: termsIntroduced,
    mental_model: mentalModel
  };

  concept.status = 'learning';

  return concept;
}

/**
 * Record Practice activity results
 * @param {Object} concept - Current concept object
 * @param {Array<Object>} exercises - Exercise results [{name, status, errors}]
 * @param {boolean} independence - Can work independently
 * @param {Array<string>} errorPatterns - Identified error patterns
 * @returns {Object} Updated concept with Practice results
 */
function recordPractice(concept, exercises, independence, errorPatterns = []) {
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.practice = {
    date: timestamp,
    independence,
    exercises,
    error_patterns: errorPatterns
  };

  concept.status = 'practicing';

  return concept;
}

/**
 * Record Calibrate activity results
 * @param {Object} concept - Current concept object
 * @param {number} correct - Number of correct answers (out of 3)
 * @param {Array<string>} expertThinking - Expert patterns demonstrated
 * @returns {Object} Updated concept with Calibrate results
 */
function recordCalibrate(concept, correct, expertThinking = []) {
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.calibrate = {
    date: timestamp,
    judgment: { correct, total: 3 },
    expert_thinking: expertThinking
  };

  if (correct >= 2) {
    concept.status = 'mastered';
    concept.review_interval = INITIAL_REVIEW_INTERVAL;
    concept.last_activity = timestamp;
  } else {
    concept.status = 'practicing';
  }

  return concept;
}

/**
 * Update review interval after a review session
 *
 * Semantics (see references/spaced-repetition.md):
 *   Perfect (all correct)  -> 2x interval
 *   Good (>= 80%)          -> 1.5x interval
 *   OK (>= 60%)            -> same interval
 *   Weak (< 60%)           -> half interval
 *
 * @param {Object} concept - Current concept object
 * @param {number} correct - Number of correct answers in review
 * @param {number} total - Total questions in review
 * @returns {Object} Updated concept with new review interval
 */
function updateReviewInterval(concept, correct, total) {
  const performance = correct / total;
  const timestamp = getNow();

  let currentInterval = concept.review_interval || INITIAL_REVIEW_INTERVAL;

  if (performance >= 1) {
    currentInterval *= 2;
  } else if (performance >= 0.8) {
    currentInterval *= 1.5;
  } else if (performance >= 0.6) {
    // Keep same
  } else {
    currentInterval /= 2;
  }

  // Clamp to min 1 day, max 60 days
  concept.review_interval = Math.round(clamp(currentInterval, 86400, 5184000));
  concept.last_activity = timestamp;

  return concept;
}

/**
 * Calculate overall progress across all concepts
 * @param {Array<Object>} sections - All sections from state
 * @returns {Object} Progress object {mastered, total}
 */
function calculateProgress(sections) {
  const concepts = flattenConcepts(sections);
  return { mastered: concepts.filter(isMastered).length, total: concepts.length };
}

module.exports = {
  recordLearn,
  recordSynthesize,
  recordPractice,
  recordCalibrate,
  updateReviewInterval,
  calculateProgress
};

// CLI usage
if (require.main === module) {
  console.log('Activity updater functions loaded');
  console.log('Import and use: recordLearn, recordSynthesize, recordPractice, recordCalibrate, updateReviewInterval, calculateProgress');
}
