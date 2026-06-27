#!/usr/bin/env node

/**
 * Activity selector - determines what activity should run next for a concept
 */

/**
 * Check if concept is due for review
 * @param {Object} concept - Concept with review_interval and last_activity
 * @returns {Object} {isDue, isOverdue, daysUntilDue}
 */
function checkReviewDue(concept) {
  if (!concept.review_interval || !concept.last_activity) {
    return { isDue: false, isOverdue: false, daysUntilDue: null };
  }

  const now = Date.now();
  const lastActivity = new Date(concept.last_activity).getTime();
  const elapsed = now - lastActivity; // milliseconds
  const reviewInterval = concept.review_interval * 1000; // convert to ms

  const isDue = elapsed >= reviewInterval;
  const isOverdue = elapsed > reviewInterval * 1.2; // 20% grace period
  const daysUntilDue = isDue ? 0 : Math.ceil((reviewInterval - elapsed) / 86400000);

  return { isDue, isOverdue, daysUntilDue };
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
      if ((concept.level || 0) >= 5) {
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

  // Sort by most overdue first
  due.sort((a, b) => {
    const aElapsed = Date.now() - new Date(a.last_activity).getTime();
    const bElapsed = Date.now() - new Date(b.last_activity).getTime();
    const aOverdue = aElapsed - (a.review_interval * 1000);
    const bOverdue = bElapsed - (b.review_interval * 1000);
    return bOverdue - aOverdue;
  });

  return due;
}

/**
 * Determine next activity for a concept
 * @param {Object} concept - Concept object with level and activity status
 * @returns {string} Next activity name: 'explore', 'discover', 'name', 'practice', 'calibrate', 'review', 'done'
 */
function getNextActivity(concept) {
  const level = concept.level || 0;
  const status = concept.activity?.status;

  // Check if mastered and due for review
  if (level >= 5) {
    const reviewStatus = checkReviewDue(concept);
    if (reviewStatus.isDue) {
      return 'review'; // Run Discover as review
    }
    return 'done'; // Mastered, not due for review
  }

  // Level 0: Not started or needs more discovery
  if (level === 0) {
    if (status === 'needs_more_discovery') {
      return 'discover';
    }
    return 'explore'; // Add to map, then discover
  }

  // Level 1: Discover done, ready for Name
  if (level === 1 || status === 'ready_for_name') {
    return 'name';
  }

  // Level 2: Name done, ready for Practice
  if (level === 2 || status === 'ready_for_practice') {
    return 'practice';
  }

  // Level 3: Practice started but needs more
  if (level === 3 || status === 'needs_more_practice') {
    return 'practice';
  }

  // Level 4: Practice done, ready for Calibrate
  if (level === 4) {
    if (status === 'needs_more_calibrate') {
      return 'calibrate';
    }
    return 'calibrate';
  }

  // Fallback
  return 'discover';
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
  if (!concept.requires || concept.requires.length === 0) {
    return true; // No prerequisites
  }

  // Flatten all concepts
  const allConcepts = [];
  sections.forEach(section => {
    section.concepts.forEach(c => {
      allConcepts.push(c);
    });
  });

  // Check each prerequisite
  for (const reqName of concept.requires) {
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
      const daysOverdue = Math.floor((Date.now() - new Date(concept.last_activity).getTime()) / 86400000) - Math.floor(concept.review_interval / 86400);
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
