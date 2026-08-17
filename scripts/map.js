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

module.exports = { createMap, loadMap };
