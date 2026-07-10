const { buildInitialMap } = require('../scripts/map-builder');

// Simple test runner (same as state-manager.test.js)
let passed = 0;
let failed = 0;

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toContain(item) {
      if (Array.isArray(value)) {
        if (!value.includes(item)) {
          throw new Error(`Expected array to contain "${item}", got ${JSON.stringify(value)}`);
        }
      } else if (typeof value === 'string') {
        if (!value.includes(item)) {
          throw new Error(`Expected string to contain "${item}", got ${JSON.stringify(value)}`);
        }
      } else {
        throw new Error(`toContain only works with arrays and strings, got ${typeof value}`);
      }
    },
    toBeDefined() {
      if (value === undefined || value === null) {
        throw new Error(`Expected value to be defined, got ${JSON.stringify(value)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toHaveProperty(prop) {
      if (typeof value !== 'object' || !(prop in value)) {
        throw new Error(`Expected object to have property "${prop}"`);
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

// Tests
describe('Map Builder', () => {
  test('buildInitialMap for technical domain creates sections', () => {
    const result = buildInitialMap('Kubernetes', 'Deploy applications', 'technical');

    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections[0]).toHaveProperty('name');
    expect(result.sections[0]).toHaveProperty('concepts');
  });

  test('buildInitialMap includes concept dependencies', () => {
    // buildInitialMap is a generic placeholder (see map-builder.js) - the AI
    // generates the real, topic-specific map via SKILL.md's "Generate map" step.
    // This only checks the placeholder's own dependency linkage.
    const result = buildInitialMap('Kubernetes', 'Deploy applications', 'technical');

    const concepts = result.sections.flatMap(s => s.concepts);
    const practice = concepts.find(c => c.name.toLowerCase().includes('practice'));

    expect(practice).toBeDefined();
    expect(practice.dependencies.requires.length).toBeGreaterThan(0);
  });

  test('buildInitialMap accepts different goals without erroring', () => {
    // The generic placeholder intentionally ignores goal - goal-based
    // customization is the AI's job when it generates the real map (SKILL.md).
    const deploy = buildInitialMap('Kubernetes', 'Deploy applications', 'technical');
    const cert = buildInitialMap('Kubernetes', 'CKA certification', 'technical');

    expect(deploy.sections.length).toBeGreaterThan(0);
    expect(cert.sections.length).toBeGreaterThan(0);
  });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
