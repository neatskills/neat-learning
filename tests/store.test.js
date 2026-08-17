#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load, save, exists } = require('../scripts/store');

const TMP = path.join(__dirname, '../test-output/store');
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });

console.log('store.js tests\n');

// 1. save creates nested directories and writes valid JSON
const filePath = path.join(TMP, 'nested/dir/data.json');
save(filePath, { x: 1 });
assert(fs.existsSync(filePath), 'file should exist after save');
assert.strictEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')).x, 1);
console.log('✓ save creates dirs and writes JSON');

// 2. load reads back the same object
assert.deepStrictEqual(load(filePath), { x: 1 });
console.log('✓ load reads back saved data');

// 3. exists returns true for existing file
assert.strictEqual(exists(filePath), true);
console.log('✓ exists → true for existing file');

// 4. exists returns false for missing file
assert.strictEqual(exists(path.join(TMP, 'missing.json')), false);
console.log('✓ exists → false for missing file');

// 5. load throws descriptive error for missing file
try {
  load(path.join(TMP, 'missing.json'));
  assert.fail('should have thrown');
} catch (e) {
  assert(e.message.includes('Map not found'), `expected "Map not found" in: ${e.message}`);
}
console.log('✓ load throws "Map not found" for missing file');

// 6. save overwrites existing file
save(filePath, { x: 2 });
assert.strictEqual(load(filePath).x, 2);
console.log('✓ save overwrites existing file');

// 7. JSON is indented 2 spaces (human-readable)
const raw = fs.readFileSync(filePath, 'utf8');
assert(raw.includes('\n  '), 'JSON should be 2-space indented');
console.log('✓ JSON is 2-space indented');

fs.rmSync(TMP, { recursive: true });
console.log('\nAll store tests passed! ✓');
