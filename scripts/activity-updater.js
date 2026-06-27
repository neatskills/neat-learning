#!/usr/bin/env node

/**
 * Activity result updater - records activity performance and updates concept state
 */

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const { ensureActivity, now: getNow, INITIAL_REVIEW_INTERVAL, OPPORTUNITIES_PER_EXERCISE, clamp, MASTERY_LEVEL } = require('./utils');

/**
 * Record Discover activity results
 * @param {Object} concept - Current concept object from state
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total questions asked
 * @param {number} hintsNeeded - Hints given
 * @param {Array<string>} confusionPatterns - Detected confusion patterns
 * @param {Array<string>} strengths - Identified strengths
 * @returns {Object} Updated concept with Discover results
 */
function recordDiscover(concept, correct, total, hintsNeeded, confusionPatterns = [], strengths = []) {
  const performance = correct / total;
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.discover = {
    date: timestamp,
    questions: { correct, total },
    hints_needed: hintsNeeded,
    signals: {
      confusion: confusionPatterns,
      strengths: strengths
    }
  };

  // Update level based on performance
  if (performance >= 0.8 && hintsNeeded <= 1) {
    concept.level = Math.max(concept.level || 0, 1);
    activity.status = 'ready_for_name';
  } else {
    concept.level = 0;
    activity.status = 'needs_more_discovery';
  }

  activity.date = timestamp;

  return concept;
}

/**
 * Record Name activity results
 * @param {Object} concept - Current concept object
 * @param {Array<string>} termsIntroduced - List of terms introduced
 * @returns {Object} Updated concept with Name results
 */
function recordName(concept, termsIntroduced) {
  const timestamp = getNow();
  const activity = ensureActivity(concept);

  activity.name = {
    date: timestamp,
    terms: termsIntroduced
  };

  concept.level = 2;
  activity.status = 'ready_for_practice';
  activity.date = timestamp;

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

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter(e => e.status === 'complete').length;
  const totalErrors = exercises.reduce((sum, e) => sum + (e.errors || 0), 0);
  const errorRate = totalErrors / (totalExercises * OPPORTUNITIES_PER_EXERCISE);

  activity.practice = {
    date: timestamp,
    independence,
    exercises,
    error_patterns: errorPatterns
  };

  // Update level based on performance
  if (completedExercises >= 2 && errorRate < 0.3 && independence) {
    concept.level = 4;
    activity.status = 'ready_for_calibrate';
  } else {
    concept.level = 3;
    activity.status = 'needs_more_practice';
  }

  activity.date = timestamp;

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
    tradeoffs: { correct, total: 3 },
    expert_thinking: expertThinking
  };

  // Update level based on performance
  if (correct >= 2) {
    const levelMap = { 3: 7, 2: 5 };
    concept.level = levelMap[correct] || 5;
    activity.status = 'mastered';

    concept.review_interval = INITIAL_REVIEW_INTERVAL;
    concept.last_activity = timestamp;
  } else {
    concept.level = 4;
    activity.status = 'needs_more_calibrate';
  }

  activity.date = timestamp;

  return concept;
}

/**
 * Update review interval after a review session
 * @param {Object} concept - Current concept object
 * @param {number} correct - Number of correct answers in review
 * @param {number} total - Total questions in review
 * @returns {Object} Updated concept with new review interval
 */
function updateReviewInterval(concept, correct, total) {
  const performance = correct / total;
  const timestamp = getNow();

  let currentInterval = concept.review_interval || INITIAL_REVIEW_INTERVAL;

  if (performance >= 0.8) {
    currentInterval *= 2;
  } else if (performance >= 0.6) {
    currentInterval *= 1.5;
  } else if (performance >= 0.4) {
    // Keep same
  } else {
    currentInterval /= 2;
  }

  // Clamp to min 1 day, max 60 days
  const MIN_INTERVAL = 86400;
  const MAX_INTERVAL = 5184000;
  concept.review_interval = Math.round(clamp(currentInterval, MIN_INTERVAL, MAX_INTERVAL));
  concept.last_activity = timestamp;

  ensureActivity(concept).date = timestamp;

  return concept;
}

/**
 * Calculate overall progress across all concepts
 * @param {Array<Object>} sections - All sections from state
 * @returns {Object} Progress object {mastered, total, overall_level}
 */
function calculateProgress(sections) {
  let totalConcepts = 0;
  let masteredConcepts = 0;
  let totalLevel = 0;

  sections.forEach(section => {
    section.concepts.forEach(concept => {
      totalConcepts++;
      totalLevel += concept.level || 0;

      if ((concept.level || 0) >= MASTERY_LEVEL) {
        masteredConcepts++;
      }
    });
  });

  return {
    mastered: masteredConcepts,
    total: totalConcepts,
    overall_level: totalConcepts > 0 ? Math.round((totalLevel / totalConcepts) * 10) / 10 : 0
  };
}

module.exports = {
  recordDiscover,
  recordName,
  recordPractice,
  recordCalibrate,
  updateReviewInterval,
  calculateProgress
};

// CLI usage
if (require.main === module) {
  console.log('Activity updater functions loaded');
  console.log('Import and use: recordDiscover, recordName, recordPractice, recordCalibrate, updateReviewInterval, calculateProgress');
}
