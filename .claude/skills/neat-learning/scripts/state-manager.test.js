const { loadState, saveState, createNewMap } = require('./state-manager');
const fs = require('fs');
const path = require('path');

// Simple test runner
let passed = 0;
let failed = 0;

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toContain(substring) {
      if (typeof value !== 'string' || !value.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}", got ${JSON.stringify(value)}`);
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

function beforeEach(fn) {
  fn();
}

// Tests
describe('State Manager', () => {
  const testDir = '/tmp/neat-util-learning-test';
  const testMapPath = path.join(testDir, 'kubernetes/map.md');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(path.join(testDir, 'kubernetes'), { recursive: true });
  });

  test('createNewMap generates valid frontmatter and content', () => {
    const { data, content } = createNewMap('Kubernetes', 'Deploy applications', 'technical');

    expect(data.goal).toBe('Deploy applications');
    expect(data.domain).toBe('technical');
    expect(data.progress.mastered).toBe(0);
    expect(data.progress.total).toBe(0);
    expect(content).toContain('# Kubernetes Learning Map');
  });

  test('saveState writes YAML frontmatter + markdown', () => {
    const { data, content } = createNewMap('Kubernetes', 'Deploy applications', 'technical');
    saveState(testMapPath, data, content);

    expect(fs.existsSync(testMapPath)).toBe(true);
    const fileContent = fs.readFileSync(testMapPath, 'utf8');
    expect(fileContent).toContain('---');
    expect(fileContent).toContain('goal: Deploy applications');
  });

  test('loadState reads frontmatter and content separately', () => {
    const { data: original, content: originalContent } = createNewMap('Kubernetes', 'Test goal', 'technical');
    saveState(testMapPath, original, originalContent);

    const { data: loaded, content: loadedContent } = loadState(testMapPath);
    expect(loaded.goal).toBe('Test goal');
    expect(loadedContent).toContain('# Kubernetes Learning Map');
  });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
