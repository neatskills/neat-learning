const path = require('path');
const store = require('./store');

// ── Utilities ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ── Internal domain helpers (stubs — filled in Tasks 3–5) ────────────────────

function deriveStatus(concept) {
  const a = concept.activity;
  if (!a?.learn) return 'not-started';
  if (!a.practice) return 'learning';
  if (!a.calibrate || a.calibrate.correct < 2) return 'practicing';
  return 'mastered';
}

function nextActivityFor(concept) {
  const a = concept.activity || {};
  if (!a.learn) return 'learn';
  if (!a.synthesize) return 'synthesize';
  if (!a.practice) return 'practice';
  if (!a.calibrate || a.calibrate.correct < 2) {
    return (a.calibrate?.attempts || 0) >= 3 ? 'practice' : 'calibrate';
  }
  return 'done';
}

function recalculateProgress(sections) {
  let mastered = 0, total = 0;
  for (const section of sections) {
    for (const concept of section.concepts) {
      total++;
      if (deriveStatus(concept) === 'mastered') mastered++;
    }
  }
  return { mastered, total };
}

// ── Exported commands ─────────────────────────────────────────────────────────

function createMap(topic, goal, domain, sections, _basePath) {
  const basePath = _basePath || path.join(__dirname, '..', 'docs', 'neat_learning');
  const mapPath = path.join(basePath, toSlug(topic), 'map.json');

  if (store.exists(mapPath)) {
    throw new Error(`Map already exists: ${mapPath}`);
  }

  const normalizedSections = sections.map(section => ({
    name: section.name,
    description: section.description || '',
    concepts: section.concepts.map(c => ({
      name: c.name,
      description: c.description,
      status: 'not-started',
      dependencies: c.dependencies || { requires: [], enables: [] }
    }))
  }));

  const data = {
    topic,
    goal,
    domain,
    started: now(),
    last_session: now(),
    total_sessions: 0,
    progress: { mastered: 0, total: normalizedSections.flatMap(s => s.concepts).length },
    learning_stats: null,
    sections: normalizedSections
  };

  store.save(mapPath, data);
  return { mapPath };
}

function loadMap(mapPath) {
  return store.load(mapPath);
}

function conceptTime(concept) {
  const a = concept.activity;
  if (!a?.learn) return null;
  const timestamps = [
    a.learn?.date,
    a.synthesize?.completed,
    a.practice?.date,
    a.calibrate?.date
  ].filter(Boolean);
  if (timestamps.length < 2) return null;
  let totalMinutes = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const diffMin = (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / 60000;
    if (diffMin <= 480) totalMinutes += diffMin; // skip gaps > 8 hours
  }
  return totalMinutes > 0 ? totalMinutes : null;
}

function recalculateStats(data) {
  const allConcepts = data.sections.flatMap(s => s.concepts);
  // Only include concepts that have a complete chain: learn + calibrate with correct >= 2
  const completedConcepts = allConcepts.filter(c => {
    const a = c.activity;
    return a?.learn && a?.calibrate && a.calibrate.correct >= 2;
  });
  const times = completedConcepts.map(conceptTime).filter(t => t !== null);
  if (times.length === 0) return null;
  const avgMinutes = times.reduce((sum, t) => sum + t, 0) / times.length;
  const avgHours = Math.round(avgMinutes / 60 * 10) / 10;
  const remaining = allConcepts.filter(c => deriveStatus(c) !== 'mastered').length;
  return {
    avg_hours_per_concept: avgHours,
    estimated_days_remaining: Math.ceil((remaining * avgHours / 3) * 1.3),
    sample_size: times.length,
    last_calculated: now()
  };
}

function recordActivity(mapPath, conceptName, activityType, results = {}) {
  const validTypes = ['learn', 'synthesize', 'practice', 'calibrate'];
  if (!validTypes.includes(activityType)) {
    throw new Error(`Invalid activity type: ${activityType}`);
  }

  const data = store.load(mapPath);

  let concept = null;
  for (const section of data.sections) {
    concept = section.concepts.find(c => c.name === conceptName);
    if (concept) break;
  }
  if (!concept) throw new Error(`Concept "${conceptName}" not found`);

  if (!concept.activity) concept.activity = {};
  const timestamp = now();

  if (activityType === 'learn') {
    concept.activity.learn = { date: timestamp, correct: results.correct, total: results.total };
  } else if (activityType === 'synthesize') {
    concept.activity.synthesize = { completed: timestamp };
  } else if (activityType === 'practice') {
    // Reset calibrate if we were forced back after 3 failed attempts
    if ((concept.activity.calibrate?.attempts || 0) >= 3) {
      delete concept.activity.calibrate;
    }
    concept.activity.practice = { date: timestamp, independence: results.independence };
  } else if (activityType === 'calibrate') {
    const attempts = (concept.activity.calibrate?.attempts || 0) + 1;
    concept.activity.calibrate = { date: timestamp, correct: results.correct, total: 3, attempts };
  }

  concept.status = deriveStatus(concept);
  data.progress = recalculateProgress(data.sections);
  data.learning_stats = recalculateStats(data);

  store.save(mapPath, data);
}

module.exports = { createMap, loadMap, recordActivity, nextActivityFor };
