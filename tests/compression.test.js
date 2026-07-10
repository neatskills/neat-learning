#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  shouldOfferCompression,
  generateArchive,
  compressSection,
  decompressConcept
} = require('../scripts/compression');

console.log('Testing compression.js...\n');

const testDir = path.join(__dirname, '../test-compression');

// Cleanup
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}
fs.mkdirSync(testDir, { recursive: true });

// Test 1: shouldOfferCompression - not enough mastered
console.log('Test 1: shouldOfferCompression - not enough mastered');
let sections = [
  {
    name: 'Foundation',
    concepts: [
      { name: 'Pod', level: 6, last_activity: '2026-06-01T00:00:00Z' },
      { name: 'Service', level: 5, last_activity: '2026-06-05T00:00:00Z' }
    ]
  }
];
let result = shouldOfferCompression(sections, '2026-05-01T00:00:00Z');
assert.strictEqual(result.shouldOffer, false);
assert.strictEqual(result.masteredCount, 2);
console.log('✓ Correctly rejects compression (only 2 mastered)\n');

// Test 2: shouldOfferCompression - enough mastered, enough time
console.log('Test 2: shouldOfferCompression - should offer');
const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString();
sections = [
  {
    name: 'Foundation',
    concepts: Array.from({ length: 10 }, (_, i) => ({
      name: `Concept${i}`,
      level: 6,
      activity: { calibrate: { date: thirtyOneDaysAgo } }
    }))
  }
];
result = shouldOfferCompression(sections, '2026-05-01T00:00:00Z');
assert.strictEqual(result.shouldOffer, true);
assert.strictEqual(result.masteredCount, 10);
assert(result.daysSinceFirst >= 30);
console.log('✓ Correctly offers compression (10 mastered, 30+ days)\n');

// Test 3: generateArchive
console.log('Test 3: generateArchive');
const concepts = [
  {
    name: 'Pod',
    level: 6,
    review_interval: 345600,
    last_activity: '2026-06-27T00:00:00Z',
    activity: {
      status: 'mastered',
      learn: {
        date: '2026-06-20T10:00:00Z',
        questions: { correct: 5, total: 5 },
        hints_needed: 0,
        signals: { strengths: ['lifecycle', 'restart-policy'] }
      },
      synthesize: {
        date: '2026-06-20T10:30:00Z',
        terms: ['Pod', 'Pod spec']
      },
      practice: {
        date: '2026-06-20T11:00:00Z',
        independence: true,
        exercises: [
          { name: 'Write Pod manifest', status: 'complete', errors: 0 }
        ]
      },
      calibrate: {
        date: '2026-06-20T11:30:00Z',
        tradeoffs: { correct: 3, total: 3 },
        expert_thinking: ['knows tradeoffs']
      }
    }
  }
];
const archive = generateArchive('Foundation', concepts);
assert(archive.includes('Foundation - Mastered Concepts Archive'));
assert(archive.includes('### Pod'));
assert(archive.includes('Learn ✓'));
assert(archive.includes('Synthesize ✓'));
assert(archive.includes('Practice ✓'));
assert(archive.includes('Calibrate ✓'));
console.log('✓ Archive generated with full history\n');

// Test 4: compressSection
console.log('Test 4: compressSection');
const section = {
  name: 'Foundation',
  concepts: [
    {
      name: 'Pod',
      level: 6,
      review_interval: 345600,
      last_activity: '2026-06-27T00:00:00Z',
      activity: {
        status: 'mastered',
        learn: { date: '2026-06-20T00:00:00Z', questions: { correct: 5, total: 5 }, hints_needed: 0 },
        synthesize: { date: '2026-06-20T00:00:00Z', terms: ['Pod'] },
        practice: { date: '2026-06-20T00:00:00Z', independence: true, exercises: [] },
        calibrate: { date: '2026-06-20T00:00:00Z', tradeoffs: { correct: 3, total: 3 } }
      }
    },
    {
      name: 'Service',
      level: 2 // Not mastered
    }
  ]
};

const compressed = compressSection(section, testDir);
assert.strictEqual(compressed.section.compressed, true);
assert.strictEqual(compressed.section.mastered_count, 1);
assert(compressed.archiveFile !== null);
assert(fs.existsSync(path.join(testDir, compressed.archiveFile)));

// Check that Pod was stripped
const podConcept = compressed.section.concepts.find(c => c.name === 'Pod');
assert.strictEqual(podConcept.compressed, true);
assert.strictEqual(podConcept.activity, undefined); // Activity history removed
assert.strictEqual(podConcept.level, 6); // Level preserved
assert.strictEqual(podConcept.review_interval, 345600); // Review interval preserved

console.log('✓ Section compressed, archive created, activity history stripped\n');

// Test 5: decompressConcept
console.log('Test 5: decompressConcept');
const archivePath = path.join(testDir, compressed.archiveFile);
const restored = decompressConcept('Pod', archivePath);
assert(restored !== null);
assert.strictEqual(restored.name, 'Pod');
assert.strictEqual(restored.decompressed, true);
console.log('✓ Concept decompressed from archive\n');

// Cleanup
fs.rmSync(testDir, { recursive: true });

console.log('All tests passed! ✓');
