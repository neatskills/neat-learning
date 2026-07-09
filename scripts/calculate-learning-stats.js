#!/usr/bin/env node

/**
 * Calculate learning statistics and estimates
 * Used to show progress and estimated completion time
 */

/**
 * Calculate time difference in minutes between two ISO timestamps
 */
function getMinutesDiff(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60);
}

/**
 * Detect if there's a significant gap (>8 hours) between timestamps
 * Used to exclude overnight breaks, lunch breaks from time calculations
 */
function hasGap(start, end, maxGapHours = 8) {
  const minutes = getMinutesDiff(start, end);
  return minutes > (maxGapHours * 60);
}

/**
 * Calculate time spent on a concept
 * Excludes gaps > 8 hours between activities
 */
function getConceptTime(concept) {
  const { activity } = concept;
  if (!activity || !activity.learn) return null;

  const timestamps = [];

  // Collect timestamps in order
  if (activity.learn?.date) timestamps.push(activity.learn.date);
  if (activity.synthesize?.completed) timestamps.push(activity.synthesize.completed);
  if (activity.practice?.date) timestamps.push(activity.practice.date);
  if (activity.calibrate?.date) timestamps.push(activity.calibrate.date);

  if (timestamps.length < 2) return null;

  // Calculate total time, excluding gaps
  let totalMinutes = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const segmentTime = getMinutesDiff(timestamps[i - 1], timestamps[i]);

    // Skip if gap is too large (overnight break, etc.)
    if (segmentTime > 8 * 60) {
      continue;
    }

    totalMinutes += segmentTime;
  }

  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Determine concept category based on section
 */
function getConceptCategory(conceptName, sections) {
  for (const section of sections) {
    const concept = section.concepts.find(c => c.name === conceptName);
    if (concept) {
      const sectionName = section.name.toLowerCase();
      if (sectionName.includes('foundation')) return 'foundation';
      if (sectionName.includes('core')) return 'core';
      if (sectionName.includes('advanced')) return 'advanced';
      return 'core'; // default
    }
  }
  return 'core';
}

/**
 * Calculate learning statistics from concept map
 */
function calculateStats(mapData) {
  const { sections, progress, started } = mapData;

  // Flatten all concepts
  const allConcepts = sections.flatMap(s =>
    s.concepts.map(c => ({ ...c, section: s.name }))
  );

  // Get concepts with complete activity data
  const measuredConcepts = allConcepts
    .map(c => ({
      name: c.name,
      time: getConceptTime(c),
      category: getConceptCategory(c.name, sections),
      status: getConceptStatus(c)
    }))
    .filter(c => c.time !== null);

  if (measuredConcepts.length === 0) {
    return null; // Not enough data yet
  }

  // Calculate averages by category
  const byCategory = {
    foundation: measuredConcepts.filter(c => c.category === 'foundation'),
    core: measuredConcepts.filter(c => c.category === 'core'),
    advanced: measuredConcepts.filter(c => c.category === 'advanced')
  };

  const avgMinutes = {
    foundation: avg(byCategory.foundation.map(c => c.time)),
    core: avg(byCategory.core.map(c => c.time)),
    advanced: avg(byCategory.advanced.map(c => c.time)),
    overall: avg(measuredConcepts.map(c => c.time))
  };

  // Estimate remaining time
  const remaining = allConcepts.filter(c => getConceptStatus(c) === 'not-started');
  const remainingByCategory = {
    foundation: remaining.filter(c => getConceptCategory(c.name, sections) === 'foundation').length,
    core: remaining.filter(c => getConceptCategory(c.name, sections) === 'core').length,
    advanced: remaining.filter(c => getConceptCategory(c.name, sections) === 'advanced').length
  };

  // Estimate time for unmeasured categories
  const estimatedMinutes = {
    foundation: avgMinutes.foundation || avgMinutes.overall,
    core: avgMinutes.core || avgMinutes.overall,
    advanced: avgMinutes.advanced || (avgMinutes.core || avgMinutes.overall) * 1.5 // 1.5x if not measured
  };

  const totalRemainingMinutes =
    remainingByCategory.foundation * estimatedMinutes.foundation +
    remainingByCategory.core * estimatedMinutes.core +
    remainingByCategory.advanced * estimatedMinutes.advanced;

  // Estimate sessions and days
  const avgSessionMinutes = 180; // 3 hours
  const sessionsNeeded = Math.ceil(totalRemainingMinutes / avgSessionMinutes);
  const daysPerSession = 1.3; // buffer for breaks
  const daysRemaining = Math.ceil(sessionsNeeded * daysPerSession);

  // Add review time
  const masteredCount = progress.mastered || 0;
  const reviewDays = Math.ceil(masteredCount * 0.3); // ~0.3 days per mastered concept for reviews
  const totalDays = daysRemaining + reviewDays;

  return {
    // Measured data
    sample_size: measuredConcepts.length,
    avg_minutes_per_concept: Math.round(avgMinutes.overall),
    avg_hours_per_concept: Math.round(avgMinutes.overall / 60 * 10) / 10, // 1 decimal

    // By category
    avg_by_category: {
      foundation: Math.round(avgMinutes.foundation || 0),
      core: Math.round(avgMinutes.core || 0),
      advanced: Math.round(avgMinutes.advanced || 0)
    },

    // Remaining
    concepts_remaining: remaining.length,
    estimated_hours_remaining: Math.round(totalRemainingMinutes / 60),
    estimated_days_remaining: totalDays,
    sessions_remaining: sessionsNeeded,

    // Confidence
    confidence: getConfidence(measuredConcepts.length, byCategory),

    // Metadata
    last_calculated: new Date().toISOString()
  };
}

/**
 * Get concept status
 */
function getConceptStatus(concept) {
  const { activity } = concept;

  if (!activity || !activity.learn) return 'not-started';
  if (!activity.practice) return 'learning';
  if (!activity.calibrate) return 'practicing';
  if (activity.calibrate.judgment.correct >= 2) return 'mastered';
  return 'practicing';
}

/**
 * Calculate average
 */
function avg(numbers) {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Determine confidence level
 */
function getConfidence(sampleSize, byCategory) {
  if (sampleSize < 3) return 'low';
  if (sampleSize < 5) return 'medium';

  // Higher confidence if we have data from advanced concepts
  if (byCategory.advanced.length > 0) return 'high';
  if (sampleSize >= 8) return 'high';

  return 'medium';
}

module.exports = {
  calculateStats,
  getConceptTime,
  getConceptStatus
};
