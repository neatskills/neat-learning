/**
 * Shared utility functions
 */

// Constants
const MASTERY_LEVEL = 5;
const INITIAL_REVIEW_INTERVAL = 172800; // 2 days in seconds
const OPPORTUNITIES_PER_EXERCISE = 3;
const MS_PER_DAY = 86400000;

/**
 * Get current ISO timestamp
 * @returns {string} ISO8601 timestamp
 */
function now() {
  return new Date().toISOString();
}

/**
 * Calculate elapsed time in milliseconds
 * @param {string} isoDate - ISO8601 date string
 * @returns {number} Milliseconds elapsed since date
 */
function elapsed(isoDate) {
  return Date.now() - new Date(isoDate).getTime();
}

/**
 * Convert milliseconds to days
 * @param {number} ms - Milliseconds
 * @returns {number} Days (rounded down)
 */
function toDays(ms) {
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * Calculate days since ISO date
 * @param {string} isoDate - ISO8601 date string
 * @returns {number} Days since date
 */
function daysSince(isoDate) {
  return toDays(elapsed(isoDate));
}

/**
 * Check if concept is mastered
 * @param {Object} concept - Concept with level property
 * @returns {boolean} True if concept at mastery level or higher
 */
function isMastered(concept) {
  return (concept.level || 0) >= MASTERY_LEVEL;
}

/**
 * Ensure concept has activity object initialized
 * @param {Object} concept - Concept to initialize
 * @returns {Object} concept.activity (initialized)
 */
function ensureActivity(concept) {
  if (!concept.activity) {
    concept.activity = {};
  }
  return concept.activity;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Flatten sections array into concepts array
 * @param {Array<Object>} sections - Sections with concepts
 * @returns {Array<Object>} Flattened array of all concepts
 */
function flattenConcepts(sections) {
  return sections.flatMap(section => section.concepts);
}

module.exports = {
  MASTERY_LEVEL,
  INITIAL_REVIEW_INTERVAL,
  OPPORTUNITIES_PER_EXERCISE,
  MS_PER_DAY,
  now,
  elapsed,
  toDays,
  daysSince,
  isMastered,
  ensureActivity,
  clamp,
  flattenConcepts
};
