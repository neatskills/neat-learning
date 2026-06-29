#!/usr/bin/env node

/**
 * Initialize a new learning map
 *
 * Usage as library (recommended - AI generates map structure):
 *   const { initMap } = require('./scripts/init-map');
 *   const mapData = { sections: [...] };  // AI generates this
 *   const { mapPath } = initMap(topic, goal, domain, mapData);
 *
 * Usage as CLI (fallback - uses generic structure):
 *   node scripts/init-map.js "Topic Name" "goal description" "domain"
 */

const { createNewMap, saveState } = require('./state-manager');
const { buildInitialMap } = require('./map-builder');
const path = require('node:path');

function initMap(topic, goal, domain, mapData = null) {
  // Create slug from topic
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const mapPath = path.join(__dirname, '..', 'docs', 'neat_learning', slug, 'map.md');

  // Step 1: Create initial state
  const { data } = createNewMap(topic, goal, domain);

  // Step 1b: Initialize goals array and active_goal (Strategy C)
  data.goals = [
    {
      name: goal,
      created: new Date().toISOString(),
      last_active: new Date().toISOString()
    }
  ];
  data.active_goal = goal;

  // Step 2: Build concept map (use provided mapData or generate generic)
  if (!mapData) {
    mapData = buildInitialMap(topic, goal, domain);
  }

  // Step 3: Merge map data into state
  data.sections = mapData.sections;
  data.progress.total = mapData.sections.reduce((sum, section) => sum + section.concepts.length, 0);

  // Step 4: Generate content with map
  const sectionsMarkdown = mapData.sections.map(section => {
    const conceptsList = section.concepts.map(c =>
      `- **${c.name}** (Level ${c.level || 0}) - ${c.description}`
    ).join('\n');

    return `### ${section.name}\n${section.description || ''}\n\n${conceptsList}`;
  }).join('\n\n');

  const conceptsMarkdown = mapData.sections.flatMap(section =>
    section.concepts.map(c => `
### ${c.name}
**Level:** ${c.level || 0} | **Status:** Not started

**Description:** ${c.description}

**Dependencies:**
- Requires: ${c.dependencies.requires.length ? c.dependencies.requires.join(', ') : 'None'}
- Enables: ${c.dependencies.enables.length ? c.dependencies.enables.join(', ') : 'None'}

**Activities:** None yet
`)
  ).join('\n---\n');

  const fullContent = `# ${topic} Learning Map

**Goal:** ${goal}
**Domain:** ${domain}
**Progress:** ${data.progress.mastered}/${data.progress.total} concepts mastered | Level ${data.progress.overall_level} overall
**Started:** ${data.started}
**Last session:** ${data.last_session}
**Total sessions:** ${data.total_sessions}

---

## Map

${sectionsMarkdown}

---

## Concepts

${conceptsMarkdown}

---

## Review Schedule

**Overdue:** None
**Due today:** None
**Upcoming:** None
`;

  // Step 5: Save
  saveState(mapPath, data, fullContent);

  return { mapPath, data };
}

// CLI usage
if (require.main === module) {
  const [topic, goal, domain] = process.argv.slice(2);

  if (!topic || !goal || !domain) {
    console.error('Usage: node scripts/init-map.js "Topic Name" "goal description" "domain"');
    console.error('Example: node scripts/init-map.js "Kubernetes" "deploy applications" "technical"');
    process.exit(1);
  }

  const { mapPath } = initMap(topic, goal, domain);
  console.log(`✓ Map initialized: ${mapPath}`);
}

module.exports = { initMap };
