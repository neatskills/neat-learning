const { initMap } = require('../scripts/init-map');
const fs = require('fs');
const path = require('path');

// Simple test runner (same pattern as tests/state-manager.test.js)
let passed = 0;
let failed = 0;

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toBeUndefined() {
      if (value !== undefined) {
        throw new Error(`Expected undefined, got ${JSON.stringify(value)}`);
      }
    }
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  ${error.message}`);
    failed++;
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

const testDir = path.join(__dirname, '..', 'docs', 'neat_learning', 'exam-mode-test-topic');

function cleanup() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
}

const mapData = {
  sections: [
    {
      name: 'Cluster Architecture (25%)',
      description: 'Exam domain: Cluster Architecture',
      concepts: [
        {
          name: 'Concept A',
          description: 'Test concept',
          dependencies: { requires: [], enables: [] }
        }
      ]
    }
  ]
};

const examBlueprint = {
  source: 'official',
  source_url: 'https://example.com/exam-guide',
  researched: '2026-07-23T00:00:00.000Z',
  format: {
    question_count: 60,
    time_limit_minutes: 120,
    passing_score: 66,
    question_style: 'hands-on'
  },
  domains: [
    { name: 'Cluster Architecture', weight_pct: 25 }
  ]
};

describe('initMap - exam blueprint support', () => {
  test('initMap stores exam_blueprint in frontmatter when provided', () => {
    cleanup();
    const { data } = initMap('Exam Mode Test Topic', 'Pass Test Cert', 'technical', mapData, examBlueprint);

    expect(data.exam_blueprint.source).toBe('official');
    expect(data.exam_blueprint.domains[0].weight_pct).toBe(25);
    cleanup();
  });

  test('initMap omits exam_blueprint when not provided', () => {
    cleanup();
    const { data } = initMap('Exam Mode Test Topic', 'Deploy applications', 'technical', mapData);

    expect(data.exam_blueprint).toBeUndefined();
    cleanup();
  });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
