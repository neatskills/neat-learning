const fs = require('fs');
const path = require('path');

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Map not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function save(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { load, save, exists };
