const path = require('path');
const store = require('./store');

// ── Utilities ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function basePath(_override) {
  return _override || path.join(__dirname, '..', 'learning');
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function deriveStatus(concept) {
  const a = concept.activity;
  if (!a?.learn) return 'not-started';
  if (!a.practice) return 'learning';
  if (!a.calibrate || a.calibrate.score < 2) return 'practicing';
  return 'mastered';
}

function nextActivityFor(concept) {
  const a = concept.activity || {};
  if (!a.learn) return 'learn';
  if (!a.synthesize) return 'synthesize';
  if (!a.practice) return 'practice';
  if (!a.calibrate || a.calibrate.score < 2) {
    return (a.calibrate?.attempts || 0) >= 3 ? 'practice' : 'calibrate';
  }
  return 'done';
}

function computeProgress(sections) {
  let mastered = 0, total = 0;
  for (const section of sections) {
    for (const concept of section.concepts) {
      total++;
      if (deriveStatus(concept) === 'mastered') mastered++;
    }
  }
  return { mastered, total };
}

function conceptTime(concept) {
  const a = concept.activity;
  if (!a?.learn) return null;
  const timestamps = [
    a.learn?.date,
    a.synthesize?.date,
    a.practice?.date,
    a.calibrate?.date
  ].filter(Boolean);
  if (timestamps.length < 2) return null;
  let totalMinutes = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const diffMin = (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / 60000;
    if (diffMin <= 480) totalMinutes += diffMin;
  }
  return totalMinutes > 0 ? totalMinutes : null;
}

function computeStats(sections) {
  const allConcepts = sections.flatMap(s => s.concepts);
  const completed = allConcepts.filter(c => {
    const a = c.activity;
    return a?.learn && a?.calibrate && a.calibrate.score >= 2;
  });
  const times = completed.map(conceptTime).filter(t => t !== null);
  if (times.length === 0) return null;
  const avgHours = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length / 60 * 10) / 10;
  const remaining = allConcepts.filter(c => deriveStatus(c) !== 'mastered').length;
  return {
    avg_hours_per_concept: avgHours,
    estimated_days_remaining: Math.ceil((remaining * avgHours / 3) * 1.3),
    sample_size: times.length
  };
}

// ── Exported commands ─────────────────────────────────────────────────────────

function createMap(topic, goal, domain, sections, _basePath) {
  const mapPath = path.join(basePath(_basePath), toSlug(topic), 'map.json');
  if (store.exists(mapPath)) throw new Error(`Map already exists: ${mapPath}`);

  const data = {
    topic,
    goal,
    domain,
    last_session: now(),
    total_sessions: 0,
    sections: sections.map(section => ({
      name: section.name,
      description: section.description || '',
      concepts: section.concepts.map(c => ({
        name: c.name,
        description: c.description
      }))
    }))
  };

  store.save(mapPath, data);
  return { mapPath };
}

function createCertMap(topic, goal, domains, _basePath) {
  const mapPath = path.join(basePath(_basePath), toSlug(topic), 'map.json');
  if (store.exists(mapPath)) throw new Error(`Map already exists: ${mapPath}`);

  const sorted = [...domains].sort((a, b) => b.weight_pct - a.weight_pct);

  const data = {
    topic,
    goal,
    domain: 'technical',
    cert: true,
    domains: sorted.map(d => ({ name: d.name, weight_pct: d.weight_pct })),
    last_session: now(),
    total_sessions: 0,
    sections: sorted.map(d => ({
      name: `${d.name} (${d.weight_pct}%)`,
      description: '',
      concepts: (d.concepts || []).map(c => ({
        name: c.name,
        description: c.description
      }))
    }))
  };

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
    concept.activity.learn = { date: timestamp, score: results.score };
  } else if (activityType === 'synthesize') {
    concept.activity.synthesize = { date: timestamp };
  } else if (activityType === 'practice') {
    if ((concept.activity.calibrate?.attempts || 0) >= 3) {
      delete concept.activity.calibrate;
    }
    concept.activity.practice = { date: timestamp };
  } else if (activityType === 'calibrate') {
    const attempts = (concept.activity.calibrate?.attempts || 0) + 1;
    concept.activity.calibrate = { date: timestamp, score: results.score, attempts };
  }

  store.save(mapPath, data);
}

function addConcept(mapPath, sectionName, concept) {
  const data = store.load(mapPath);
  const section = data.sections.find(s => s.name === sectionName);
  if (!section) throw new Error(`Section "${sectionName}" not found`);
  section.concepts.push({ name: concept.name, description: concept.description });
  store.save(mapPath, data);
}

function getStatus(mapPath) {
  const data = store.load(mapPath);
  let currentConcept = null;
  let nextActivity = 'done';
  outer: for (const section of data.sections) {
    for (const concept of section.concepts) {
      const activity = nextActivityFor(concept);
      if (activity !== 'done') {
        currentConcept = concept;
        nextActivity = activity;
        break outer;
      }
    }
  }
  return {
    currentConcept,
    nextActivity,
    progress: computeProgress(data.sections),
    stats: computeStats(data.sections)
  };
}

function endSession(mapPath) {
  const data = store.load(mapPath);
  data.total_sessions += 1;
  data.last_session = now();
  store.save(mapPath, data);
}

module.exports = { createMap, createCertMap, loadMap, recordActivity, nextActivityFor, addConcept, getStatus, endSession };
