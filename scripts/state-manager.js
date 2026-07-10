const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const { now: getNow } = require('./utils');

function createNewMap(topic, goal, domain) {
  const timestamp = getNow();

  const data = {
    goal,
    domain,
    started: timestamp,
    last_session: timestamp,
    total_sessions: 0,
    progress: {
      mastered: 0,
      total: 0
    },
    sections: []
  };

  const content = `# ${topic} Learning Map

**Goal:** ${goal}
**Domain:** ${domain}
**Progress:** 0/0 concepts mastered
**Started:** ${timestamp}
**Last session:** ${timestamp}
**Total sessions:** 0

---

## Map

(No concepts yet - learning will begin soon)

---

## Concepts

(Concepts will be added as you learn)

---

## Review Schedule

**Overdue:** None
**Due today:** None
**Upcoming:** None
`;

  return { data, content };
}

function saveState(mapPath, data, content) {
  const dir = path.dirname(mapPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileContent = matter.stringify(content, data);
  fs.writeFileSync(mapPath, fileContent, 'utf8');
}

function loadState(mapPath) {
  if (!fs.existsSync(mapPath)) {
    throw new Error(`State file not found: ${mapPath}`);
  }

  const fileContent = fs.readFileSync(mapPath, 'utf8');
  const { data, content } = matter(fileContent);
  return { data, content };
}

module.exports = { createNewMap, saveState, loadState };
