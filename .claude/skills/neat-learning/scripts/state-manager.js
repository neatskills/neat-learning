const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

function createNewMap(topic, goal, domain) {
  const now = new Date().toISOString();

  const data = {
    goal,
    domain,
    started: now,
    last_session: now,
    total_sessions: 0,
    progress: {
      mastered: 0,
      total: 0,
      overall_level: 0
    },
    sections: []
  };

  const content = `# ${topic} Learning Map

**Goal:** ${goal}
**Domain:** ${domain}
**Progress:** 0/0 concepts mastered | Level 0 overall
**Started:** ${now}
**Last session:** ${now}
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
