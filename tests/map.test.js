#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMap, loadMap } = require('../scripts/map');

const TMP = path.join(__dirname, '../test-output/map');
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

const SECTIONS = [
  {
    name: 'Foundation',
    description: 'Core concepts',
    concepts: [
      { name: 'Pods', description: 'Smallest unit', dependencies: { requires: [], enables: ['Deployments'] } }
    ]
  },
  {
    name: 'Core',
    description: 'Main features',
    concepts: [
      { name: 'Deployments', description: 'Manage replicas', dependencies: { requires: ['Pods'], enables: [] } }
    ]
  }
];

console.log('map.js tests — createMap + loadMap\n');

// 1. createMap writes map.json with correct top-level fields
const { mapPath } = createMap('Kubernetes', 'Deploy apps', 'technical', SECTIONS, TMP);
assert(fs.existsSync(mapPath), 'map.json should exist');
const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
assert.strictEqual(data.topic, 'Kubernetes');
assert.strictEqual(data.goal, 'Deploy apps');
assert.strictEqual(data.domain, 'technical');
assert.strictEqual(data.total_sessions, 0);
assert.strictEqual(data.progress.mastered, 0);
assert.strictEqual(data.progress.total, 2);
assert.strictEqual(data.learning_stats, null);
assert(data.started, 'started should be set');
assert(data.last_session, 'last_session should be set');
console.log('✓ createMap writes correct top-level fields');

// 2. createMap slugifies the topic into the path
assert(mapPath.includes('kubernetes'), `path should contain slug, got: ${mapPath}`);
console.log('✓ createMap slugifies topic for path');

// 3. createMap sets concepts to not-started with no activity
const pod = data.sections[0].concepts[0];
assert.strictEqual(pod.name, 'Pods');
assert.strictEqual(pod.status, 'not-started');
assert.strictEqual(pod.activity, undefined);
console.log('✓ concepts initialised as not-started with no activity');

// 4. createMap throws if map already exists
try {
  createMap('Kubernetes', 'Deploy apps', 'technical', SECTIONS, TMP);
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('already exists'), `got: ${e.message}`);
}
console.log('✓ createMap throws if map already exists');

// 5. loadMap returns the same data
const loaded = loadMap(mapPath);
assert.strictEqual(loaded.topic, 'Kubernetes');
assert.strictEqual(loaded.sections.length, 2);
console.log('✓ loadMap reads data back correctly');

// 6. loadMap throws for missing file
try {
  loadMap(path.join(TMP, 'missing/map.json'));
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('Map not found'), `got: ${e.message}`);
}
console.log('✓ loadMap throws for missing file');

fs.rmSync(TMP, { recursive: true });
console.log('\ncreateMap + loadMap tests passed! ✓');
