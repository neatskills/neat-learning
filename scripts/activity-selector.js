#!/usr/bin/env node

/**
 * Activity selector - determines what activity should run next for a concept
 */

const { elapsed, isMastered, toDays, MS_PER_DAY, flattenConcepts } = require('./utils');

/**
 * Check if concept is due for review
 * @param {Object} concept - Concept with review_interval and last_activity
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
 * @param {Object} concept - Concept object with level and activity status
 * @returns {string} Next activity name: 'plan', 'learn', 'synthesize', 'practice', 'calibrate', 'review', 'done'
 */
function getNextActivity(concept) {
  const level = concept.level || 0;
  const status = concept.activity?.status;

  // Check if mastered and due for review
  if (isMastered(concept)) {
    const reviewStatus = checkReviewDue(concept);
    if (reviewStatus.isDue) {
      return 'review';
    }
    return 'done';
  }

  // Level 0: Not started or needs more learning
  if (level === 0) {
    return status === 'needs_more_learning' ? 'learn' : 'plan';
  }

  // Level 1: Learn done, ready for Synthesize
  if (level === 1 || status === 'ready_for_synthesize') {
    return 'synthesize';
  }

  // Level 2-3: Practice
  if (level === 2 || level === 3 || status === 'ready_for_practice' || status === 'needs_more_practice') {
    return 'practice';
  }

  // Level 4: Calibrate
  if (level === 4) {
    return 'calibrate';
  }

  // Fallback
  return 'learn';
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
 * Check if all prerequisites are met for Practice activity
 * @param {Object} concept - Current concept
 * @param {Array<Object>} sections - All sections (to look up dependencies)
 * @returns {boolean} True if all prerequisites at Level 3+
 */
function checkPracticePrerequisites(concept, sections) {
  const requires = concept.dependencies?.requires;
  if (!requires || requires.length === 0) {
    return true; // No prerequisites
  }

  const allConcepts = flattenConcepts(sections);

  // Check each prerequisite
  for (const reqName of requires) {
    const prereq = allConcepts.find(c => c.name === reqName);
    if (!prereq || (prereq.level || 0) < 3) {
      return false; // Prerequisite not found or below Level 3
    }
  }

  return true;
}

/**
 * Generate session status message
 * @param {Array<Object>} sections - All sections from state
 * @param {number} daysSinceLastSession - Days since last session
 * @returns {string} Status message for user
 */
function generateSessionStatus(sections, daysSinceLastSession) {
  const dueReviews = getConceptsDueForReview(sections);
  const next = getNextConcept(sections, { skipReviews: true });

  let message = `Welcome back! Last session: ${daysSinceLastSession} days ago\n\n`;

  if (dueReviews.length > 0) {
    message += `📌 Due for review (${dueReviews.length} concept${dueReviews.length > 1 ? 's' : ''}):\n`;
    dueReviews.slice(0, 3).forEach(concept => {
      const daysOverdue = toDays(concept.elapsedMs) - Math.floor(concept.review_interval / 86400);
      const overdueText = concept.isOverdue ? `, overdue ${daysOverdue} days` : ', due now';
      message += `- ${concept.name} (mastered${overdueText})\n`;
    });

    if (dueReviews.length > 3) {
      message += `- ... and ${dueReviews.length - 3} more\n`;
    }

    message += '\nWant to review before continuing? [y/n/menu]';
  } else if (next) {
    message += `No reviews due. Ready to continue with:\n`;
    message += `${next.section}: ${next.concept.name} (${next.activity})\n\n`;
    message += 'Continue? [y/menu]';
  } else {
    message += 'All concepts mastered, no reviews due!\n';
    message += 'You can add more concepts or end the session.';
  }

  return message;
}

module.exports = {
  checkReviewDue,
  getConceptsDueForReview,
  getNextActivity,
  getNextConcept,
  checkPracticePrerequisites,
  generateSessionStatus
};

// CLI usage
if (require.main === module) {
  console.log('Activity selector functions loaded');
  console.log('Import and use: checkReviewDue, getConceptsDueForReview, getNextActivity, getNextConcept, checkPracticePrerequisites, generateSessionStatus');
}
