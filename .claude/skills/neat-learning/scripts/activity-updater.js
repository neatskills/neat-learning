#!/usr/bin/env node

/**
 * Activity result updater - records activity performance and updates concept state
 */

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

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
  const now = new Date().toISOString();

  // Update concept activity section
  if (!concept.activity) {
    concept.activity = {};
  }

  concept.activity.discover = {
    date: now,
    questions: { correct, total },
    hints_needed: hintsNeeded,
    signals: {
      confusion: confusionPatterns,
      strengths: strengths
    }
  };

  // Update level based on performance
  if (performance >= 0.8 && hintsNeeded <= 1) {
    // Strong performance: ready for Name
    concept.level = Math.max(concept.level || 0, 1);
    concept.activity.status = 'ready_for_name';
  } else {
    // Weak performance: needs more discovery
    concept.level = 0;
    concept.activity.status = 'needs_more_discovery';
  }

  concept.activity.date = now;

  return concept;
}

/**
 * Record Name activity results
 * @param {Object} concept - Current concept object
 * @param {Array<string>} termsIntroduced - List of terms introduced
 * @returns {Object} Updated concept with Name results
 */
function recordName(concept, termsIntroduced) {
  const now = new Date().toISOString();

  if (!concept.activity) {
    concept.activity = {};
  }

  concept.activity.name = {
    date: now,
    terms: termsIntroduced
  };

  // Level 2: can explain concepts
  concept.level = 2;
  concept.activity.status = 'ready_for_practice';
  concept.activity.date = now;

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
  const now = new Date().toISOString();

  if (!concept.activity) {
    concept.activity = {};
  }

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter(e => e.status === 'complete').length;
  const totalErrors = exercises.reduce((sum, e) => sum + (e.errors || 0), 0);
  const errorRate = totalErrors / (totalExercises * 3); // Assume ~3 opportunities per exercise

  concept.activity.practice = {
    date: now,
    independence,
    exercises,
    error_patterns: errorPatterns
  };

  // Update level based on performance
  if (completedExercises >= 2 && errorRate < 0.3 && independence) {
    // Level 4: can solve unfamiliar problems
    concept.level = 4;
    concept.activity.status = 'ready_for_calibrate';
  } else {
    // Needs more practice
    concept.level = 3;
    concept.activity.status = 'needs_more_practice';
  }

  concept.activity.date = now;

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
  const now = new Date().toISOString();

  if (!concept.activity) {
    concept.activity = {};
  }

  concept.activity.calibrate = {
    date: now,
    tradeoffs: { correct, total: 3 },
    expert_thinking: expertThinking
  };

  // Update level based on performance
  if (correct >= 2) {
    // Passed calibration: expert level (5-7 based on depth)
    concept.level = correct === 3 ? 7 : (correct === 2 ? 5 : 4);
    concept.activity.status = 'mastered';

    // Initialize spaced repetition
    concept.review_interval = 172800; // 2 days in seconds
    concept.last_activity = now;
  } else {
    // Failed calibration: stay at level 4
    concept.level = 4;
    concept.activity.status = 'needs_more_calibrate';
  }

  concept.activity.date = now;

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
  const now = new Date().toISOString();

  let currentInterval = concept.review_interval || 172800;

  if (performance >= 0.8) {
    // Perfect/good: 2x interval
    currentInterval *= 2;
  } else if (performance >= 0.6) {
    // OK: 1.5x interval
    currentInterval *= 1.5;
  } else if (performance >= 0.4) {
    // Weak: keep same
    // currentInterval stays same
  } else {
    // Very weak: halve interval
    currentInterval /= 2;
  }

  // Clamp to min 1 day, max 60 days
  currentInterval = Math.max(86400, Math.min(5184000, currentInterval));

  concept.review_interval = Math.round(currentInterval);
  concept.last_activity = now;

  if (!concept.activity) {
    concept.activity = {};
  }
  concept.activity.date = now;

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

      if ((concept.level || 0) >= 5) {
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
