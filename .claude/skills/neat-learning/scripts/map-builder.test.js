const { buildInitialMap } = require('./map-builder');

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
    const result = buildInitialMap('Kubernetes', 'Deploy applications', 'technical');

    const concepts = result.sections.flatMap(s => s.concepts);
    const deployment = concepts.find(c => c.name.toLowerCase().includes('deployment'));

    expect(deployment).toBeDefined();
    expect(deployment.dependencies.requires).toContain('pod');
  });

  test('buildInitialMap customizes for different goals', () => {
    const deploy = buildInitialMap('Kubernetes', 'Deploy applications', 'technical');
    const cert = buildInitialMap('Kubernetes', 'CKA certification', 'technical');

    const deployConcepts = deploy.sections.flatMap(s => s.concepts);
    const certConcepts = cert.sections.flatMap(s => s.concepts);

    // CKA should have more concepts than deploy-focused map
    expect(certConcepts.length).toBeGreaterThan(deployConcepts.length);
  });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
