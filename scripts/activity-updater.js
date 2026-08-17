#!/usr/bin/env node

/**
 * Activity result updater - records activity performance, updates concept state,
 * and calculates learning statistics.
 */

const { ensureActivity, now: getNow, INITIAL_REVIEW_INTERVAL, clamp, isMastered, flattenConcepts } = require('./utils');

// ─── Learning stats helpers ───────────────────────────────────────────────────

function getMinutesDiff(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60);
}

function hasGap(start, end, maxGapHours = 8) {
  return getMinutesDiff(start, end) > maxGapHours * 60;
}

function getConceptTime(concept) {
  const { activity } = concept;
  if (!activity?.learn) return null;

  const timestamps = [];
  if (activity.learn?.date) timestamps.push(activity.learn.date);
  if (activity.synthesize?.completed) timestamps.push(activity.synthesize.completed);
  if (activity.practice?.date) timestamps.push(activity.practice.date);
  if (activity.calibrate?.date) timestamps.push(activity.calibrate.date);

  if (timestamps.length < 2) return null;

  let totalMinutes = 0;
  for (let i = 1; i < timestamps.length; i++) {
    if (!hasGap(timestamps[i - 1], timestamps[i])) {
      totalMinutes += getMinutesDiff(timestamps[i - 1], timestamps[i]);
    }
  }

  return totalMinutes > 0 ? totalMinutes : null;
}

function getConceptStatus(concept) {
  const { activity } = concept;
  if (!activity?.learn) return 'not-started';
  if (!activity.practice) return 'learning';
  if (!activity.calibrate) return 'practicing';
  if (activity.calibrate.judgment.correct >= 2) return 'mastered';
  return 'practicing';
}

function getConceptCategory(conceptName, sections) {
  for (const section of sections) {
    if (section.concepts.some(c => c.name === conceptName)) {
      const name = section.name.toLowerCase();
      if (name.includes('foundation')) return 'foundation';
      if (name.includes('advanced')) return 'advanced';
      return 'core';
    }
  }
  return 'core';
}

function statsAvg(numbers) {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function getConfidence(sampleSize, byCategory) {
  if (sampleSize < 3) return 'low';
  if (sampleSize < 5) return 'medium';
  if (byCategory.advanced.length > 0 || sampleSize >= 8) return 'high';
  return 'medium';
}

/**
 * Calculate learning statistics and time estimates from concept map data.
 * @param {Object} mapData - State object with sections and progress
 * @returns {Object|null} Stats object, or null if insufficient data
 */
function calculateStats(mapData) {
  const { sections, progress } = mapData;

  const allConcepts = sections.flatMap(s => s.concepts.map(c => ({ ...c, section: s.name })));

  const measured = allConcepts
    .map(c => ({
      name: c.name,
      time: getConceptTime(c),
      category: getConceptCategory(c.name, sections),
      status: getConceptStatus(c)
    }))
    .filter(c => c.time !== null);

  if (measured.length === 0) return null;

  const byCategory = {
    foundation: measured.filter(c => c.category === 'foundation'),
    core: measured.filter(c => c.category === 'core'),
    advanced: measured.filter(c => c.category === 'advanced')
  };

  const avgMin = {
    foundation: statsAvg(byCategory.foundation.map(c => c.time)),
    core: statsAvg(byCategory.core.map(c => c.time)),
    advanced: statsAvg(byCategory.advanced.map(c => c.time)),
    overall: statsAvg(measured.map(c => c.time))
  };

  const remaining = allConcepts.filter(c => getConceptStatus(c) === 'not-started');
  const estMin = {
    foundation: avgMin.foundation || avgMin.overall,
    core: avgMin.core || avgMin.overall,
    advanced: avgMin.advanced || (avgMin.core || avgMin.overall) * 1.5
  };

  const totalRemainingMin =
    remaining.filter(c => getConceptCategory(c.name, sections) === 'foundation').length * estMin.foundation +
    remaining.filter(c => getConceptCategory(c.name, sections) === 'core').length * estMin.core +
    remaining.filter(c => getConceptCategory(c.name, sections) === 'advanced').length * estMin.advanced;

  const sessionsNeeded = Math.ceil(totalRemainingMin / 180);
  const reviewDays = Math.ceil((progress.mastered || 0) * 0.3);
  const totalDays = Math.ceil(sessionsNeeded * 1.3) + reviewDays;

  return {
    sample_size: measured.length,
    avg_minutes_per_concept: Math.round(avgMin.overall),
    avg_hours_per_concept: Math.round(avgMin.overall / 60 * 10) / 10,
    avg_by_category: {
      foundation: Math.round(avgMin.foundation || 0),
      core: Math.round(avgMin.core || 0),
      advanced: Math.round(avgMin.advanced || 0)
    },
    concepts_remaining: remaining.length,
    estimated_hours_remaining: Math.round(totalRemainingMin / 60),
    estimated_days_remaining: totalDays,
    sessions_remaining: sessionsNeeded,
    confidence: getConfidence(measured.length, byCategory),
    last_calculated: getNow()
  };
}

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
  calculateProgress,
  calculateStats,
  getConceptTime,
  getConceptStatus
};

// CLI usage
if (require.main === module) {
  console.log('Activity updater functions loaded');
  console.log('Import and use: recordLearn, recordSynthesize, recordPractice, recordCalibrate, updateReviewInterval, calculateProgress');
}
