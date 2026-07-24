/**
 * Builds a learning map structure dynamically.
 *
 * This function generates sections and concepts on-the-fly based on:
 * - Topic: What to learn
 * - Goal: Why learning it (determines scope and depth)
 * - Domain: How to structure it (technical, business, soft skills, theoretical)
 *
 * The AI calling this should use its knowledge to generate appropriate
 * sections and concepts, rather than relying on hardcoded templates.
 */
function buildInitialMap(topic, goal, domain) {
  // This is a placeholder that returns a generic structure.
  // The AI should generate the actual map structure based on:
  // 1. Its knowledge of the topic
  // 2. The user's specific goal
  // 3. The domain's typical learning progression

  return buildGenericMap(topic, goal, domain);
}

function buildGenericMap(topic, goal, domain) {
  // Generic structure when no template exists
  return {
    sections: [
      {
        name: 'Foundation',
        concepts: [
          {
            name: `${topic} Basics`,
            description: `Fundamental concepts of ${topic}`,
            status: 'not-started',
            dependencies: { requires: [], enables: [] }
          }
        ]
      },
      {
        name: 'Core',
        concepts: [
          {
            name: `${topic} Practice`,
            description: `Practical application of ${topic}`,
            status: 'not-started',
            dependencies: { requires: [`${topic} Basics`], enables: [] }
          }
        ]
      }
    ]
  };
}

module.exports = { buildInitialMap };
