const path = require('path');
const store = require('./store');

const PASSING_SCORE = 2;
const MAX_CALIBRATE_ATTEMPTS = 3;

// ── Utilities ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function basePath(override) {
  return override || path.join(__dirname, '..', 'learning');
}

function toConcept(c) {
  return { name: c.name, description: c.description };
}

function mapPathFor(topic, override) {
  const p = path.join(basePath(override), toSlug(topic), 'map.json');
  if (store.exists(p)) throw new Error(`Map already exists: ${p}`);
  return p;
}

function allConcepts(sections) {
  return sections.flatMap(s => s.concepts);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function deriveStatus(concept) {
  const a = concept.activity;
  if (!a?.learn) return 'not-started';
  if (!a.practice) return 'learning';
  if (!a.calibrate || a.calibrate.correct < PASSING_SCORE) return 'practicing';
  return 'mastered';
}

function nextActivityFor(concept) {
  const a = concept.activity || {};
  if (!a.learn) return 'learn';
  if (!a.synthesize) return 'synthesize';
  if (!a.practice) return 'practice';
  if (!a.calibrate || a.calibrate.correct < PASSING_SCORE) {
    return (a.calibrate?.attempts || 0) >= MAX_CALIBRATE_ATTEMPTS ? 'practice' : 'calibrate';
  }
  return 'done';
}

function computeProgress(sections) {
  const concepts = allConcepts(sections);
  return { mastered: concepts.filter(c => deriveStatus(c) === 'mastered').length, total: concepts.length };
}

function conceptTime(concept) {
  const a = concept.activity;
  if (!a?.learn) return null;
  const times = [a.learn?.date, a.synthesize?.completed, a.practice?.date, a.calibrate?.date]
    .filter(Boolean)
    .map(d => Date.parse(d));
  if (times.length < 2) return null;
  let totalMinutes = 0;
  for (let i = 1; i < times.length; i++) {
    const diffMin = (times[i] - times[i - 1]) / 60000;
    if (diffMin <= 480) totalMinutes += diffMin;
  }
  return totalMinutes > 0 ? totalMinutes : null;
}

function computeStats(sections) {
  const concepts = allConcepts(sections);
  const completed = concepts.filter(c => {
    const a = c.activity;
    return a?.learn && a?.calibrate && a.calibrate.correct >= PASSING_SCORE;
  });
  if (completed.length === 0) return null;
  const times = completed.map(conceptTime).filter(t => t !== null);
  const avgHours = times.length > 0
    ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length / 60 * 10) / 10
    : 0;
  const remaining = concepts.filter(c => deriveStatus(c) !== 'mastered').length;
  return {
    avg_hours_per_concept: avgHours,
    estimated_days_remaining: Math.ceil((remaining * avgHours / 3) * 1.3),
    sample_size: completed.length
  };
}

function refreshDerived(data) {
  for (const concept of allConcepts(data.sections)) {
    concept.status = deriveStatus(concept);
  }
  data.progress = computeProgress(data.sections);
  data.learning_stats = computeStats(data.sections);
}

// ── Exported commands ─────────────────────────────────────────────────────────

function createMap(topic, goal, domain, sections, _basePath) {
  const mapPath = mapPathFor(topic, _basePath);
  const timestamp = now();

  const data = {
    topic,
    goal,
    domain,
    started: timestamp,
    last_session: timestamp,
    total_sessions: 0,
    sections: sections.map(section => ({
      name: section.name,
      description: section.description || '',
      concepts: section.concepts.map(toConcept)
    }))
  };

  refreshDerived(data);
  store.save(mapPath, data);
  return { mapPath };
}

function createCertMap(topic, goal, domains, _basePath) {
  const mapPath = mapPathFor(topic, _basePath);
  const timestamp = now();

  const sorted = [...domains].sort((a, b) => b.weight_pct - a.weight_pct);

  const data = {
    topic,
    goal,
    domain: 'technical',
    cert: true,
    domains: sorted.map(d => ({ name: d.name, weight_pct: d.weight_pct })),
    started: timestamp,
    last_session: timestamp,
    total_sessions: 0,
    sections: sorted.map(d => ({
      name: `${d.name} (${d.weight_pct}%)`,
      description: '',
      concepts: (d.concepts || []).map(toConcept)
    }))
  };

  refreshDerived(data);
  store.save(mapPath, data);
  return { mapPath };
}

function loadMap(mapPath) {
  return store.load(mapPath);
}

function recordActivity(mapPath, conceptName, activityType, results = {}) {
  const validTypes = ['learn', 'synthesize', 'practice', 'calibrate'];
  if (!validTypes.includes(activityType)) throw new Error(`Invalid activity type: ${activityType}`);

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
    if ((concept.activity.calibrate?.attempts || 0) >= MAX_CALIBRATE_ATTEMPTS) {
      delete concept.activity.calibrate;
    }
    concept.activity.practice = { date: timestamp, independence: results.independence };
  } else if (activityType === 'calibrate') {
    const attempts = (concept.activity.calibrate?.attempts || 0) + 1;
    concept.activity.calibrate = { date: timestamp, correct: results.correct, attempts };
  }

  refreshDerived(data);
  store.save(mapPath, data);
}

function addConcept(mapPath, sectionName, concept) {
  const data = store.load(mapPath);
  const section = data.sections.find(s => s.name === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);
  section.concepts.push(toConcept(concept));
  refreshDerived(data);
  store.save(mapPath, data);
}

function getStatus(mapPath) {
  const data = store.load(mapPath);
  const currentConcept = allConcepts(data.sections).find(c => nextActivityFor(c) !== 'done') ?? null;
  return {
    currentConcept,
    nextActivity: currentConcept ? nextActivityFor(currentConcept) : 'done',
    progress: data.progress,
    stats: data.learning_stats
  };
}

function endSession(mapPath) {
  const data = store.load(mapPath);
  data.total_sessions += 1;
  data.last_session = now();
  store.save(mapPath, data);
}

module.exports = { createMap, createCertMap, loadMap, recordActivity, nextActivityFor, addConcept, getStatus, endSession };
