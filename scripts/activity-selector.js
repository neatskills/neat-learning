#!/usr/bin/env node

/**
 * Activity selector - determines what activity should run next for a concept
 */

const { elapsed, isMastered, MS_PER_DAY, flattenConcepts } = require('./utils');

/**
 * Check if concept is due for review
 * @param {Object} concept - Concept with review_interval (seconds) and last_activity
 * @returns {Object} {isDue, isOverdue, daysUntilDue}
 */
function checkReviewDue(concept) {
  if (!concept.review_interval || !concept.last_activity) {
    return { isDue: false, isOverdue: false, daysUntilDue: null, elapsedMs: 0 };
  }

  const elapsedMs = elapsed(concept.last_activity);
  const reviewInterval = concept.review_interval * 1000;

  const isDue = elapsedMs >= reviewInterval;
  const isOverdue = elapsedMs > reviewInterval * 1.2; // 20% grace period
  const daysUntilDue = isDue ? 0 : Math.ceil((reviewInterval - elapsedMs) / MS_PER_DAY);

  return { isDue, isOverdue, daysUntilDue, elapsedMs };
}

/**
 * Get all concepts due for review
 * @param {Array<Object>} sections - All sections from state
 * @returns {Array<Object>} Concepts due for review, sorted by most overdue first
 */
function getConceptsDueForReview(sections) {
  const due = [];

  sections.forEach(section => {
    section.concepts.forEach(concept => {
      if (isMastered(concept)) {
        const reviewStatus = checkReviewDue(concept);
        if (reviewStatus.isDue) {
          due.push({
            ...concept,
            section: section.name,
            ...reviewStatus
          });
        }
      }
    });
  });

  // Sort by most overdue first (reuse elapsedMs from reviewStatus)
  due.sort((a, b) => {
    const aOverdue = a.elapsedMs - (a.review_interval * 1000);
    const bOverdue = b.elapsedMs - (b.review_interval * 1000);
    return bOverdue - aOverdue;
  });

  return due;
}

/**
 * Determine next activity for a concept
 *
 * Based on which activities are already recorded. The coach may override
 * this (e.g. repeat Learn when readiness gates fail - see
 * references/activities/learn.md).
 *
 * @param {Object} concept - Concept object with status and activity data
 * @returns {string} Next activity name: 'learn', 'synthesize', 'practice', 'calibrate', 'review', 'done'
 */
function getNextActivity(concept) {
  if (isMastered(concept)) {
    const reviewStatus = checkReviewDue(concept);
    return reviewStatus.isDue ? 'review' : 'done';
  }

  const activity = concept.activity || {};

  if (!activity.learn) return 'learn';
  if (!activity.synthesize) return 'synthesize';
  if (!activity.practice) return 'practice';
  return 'calibrate';
}

/**
 * Get the next concept to work on
 * @param {Array<Object>} sections - All sections from state
 * @param {Object} options - Options {skipReviews: false}
 * @returns {Object|null} {concept, section, activity} or null if all done
 */
function getNextConcept(sections, options = {}) {
  const { skipReviews = false } = options;

  // First, check for reviews (if not skipped)
  if (!skipReviews) {
    const dueReviews = getConceptsDueForReview(sections);
    if (dueReviews.length > 0) {
      const concept = dueReviews[0];
      return {
        concept,
        section: concept.section,
        activity: 'review'
      };
    }
  }

  // Find first concept that's not done (skip reviews if requested)
  for (const section of sections) {
    for (const concept of section.concepts) {
      const activity = getNextActivity(concept);
      if (activity !== 'done' && !(skipReviews && activity === 'review')) {
        return {
          concept,
          section: section.name,
          activity
        };
      }
    }
  }

  return null; // All concepts mastered and no reviews due
}

/**
 * Convert concept name to slug format
 * @param {string} name - Concept name
 * @returns {string} Slug (lowercase, alphanumeric + hyphens)
 */
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Check if all prerequisites are met for Practice activity
 * @param {Object} concept - Current concept
 * @param {Array<Object>} sections - All sections (to look up dependencies)
 * @returns {boolean} True if all prerequisites are practicing or mastered
 */
function checkPracticePrerequisites(concept, sections) {
  const requires = concept.dependencies?.requires;
  if (!requires || requires.length === 0) {
    return true; // No prerequisites
  }

  const allConcepts = flattenConcepts(sections);

  // Check each prerequisite (supports both name and slug formats)
  for (const reqName of requires) {
    // Try exact name match first
    let prereq = allConcepts.find(c => c.name === reqName);

    // If not found, try slug match
    if (!prereq) {
      const reqSlug = toSlug(reqName);
      prereq = allConcepts.find(c => toSlug(c.name) === reqSlug);
    }

    if (!prereq || !['practicing', 'mastered'].includes(prereq.status)) {
      return false; // Prerequisite not found or not yet practiced
    }
  }

  return true;
}

module.exports = {
  checkReviewDue,
  getConceptsDueForReview,
  getNextActivity,
  getNextConcept,
  checkPracticePrerequisites
};

// CLI usage
if (require.main === module) {
  console.log('Activity selector functions loaded');
  console.log('Import and use: checkReviewDue, getConceptsDueForReview, getNextActivity, getNextConcept, checkPracticePrerequisites');
}
