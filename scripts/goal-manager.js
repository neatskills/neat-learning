#!/usr/bin/env node

/**
 * Goal management for Strategy C: Multiple goals per topic
 *
 * Functions:
 * - createGoalFilter(mapPath, goal, priorityConcepts, skipConcepts)
 * - loadGoalFilter(mapPath, goal)
 * - addGoalToMap(mapPath, goal)
 * - setActiveGoal(mapPath, goal)
 * - filterMapByGoal(mapData, goalFilter)
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadState, saveState } = require('./state-manager');
const { now, isMastered } = require('./utils');

/**
 * Convert goal name to slug
 */
function goalToSlug(goal) {
  return goal.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Create goal filter file
 */
function createGoalFilter(mapPath, goal, priorityConcepts = [], skipConcepts = [], customConcepts = []) {
  const mapDir = path.dirname(mapPath);
  const goalsDir = path.join(mapDir, 'goals');

  // Ensure goals directory exists
  if (!fs.existsSync(goalsDir)) {
    fs.mkdirSync(goalsDir, { recursive: true });
  }

  const goalSlug = goalToSlug(goal);
  const filterPath = path.join(goalsDir, `${goalSlug}.json`);

  const filter = {
    goal,
    created: now(),
    last_active: now(),
    priority_concepts: priorityConcepts,
    skip_concepts: skipConcepts,
    custom_concepts: customConcepts
  };

  fs.writeFileSync(filterPath, JSON.stringify(filter, null, 2));
  return { filterPath, filter };
}

/**
 * Load goal filter
 */
function loadGoalFilter(mapPath, goal) {
  const mapDir = path.dirname(mapPath);
  const goalSlug = goalToSlug(goal);
  const filterPath = path.join(mapDir, 'goals', `${goalSlug}.json`);

  if (!fs.existsSync(filterPath)) {
    return null;
  }

  const filter = JSON.parse(fs.readFileSync(filterPath, 'utf-8'));
  return filter;
}

/**
 * Add goal to map
 */
function addGoalToMap(mapPath, goal) {
  const { data, content } = loadState(mapPath);

  // Initialize goals array if doesn't exist (backward compatibility)
  if (!data.goals) {
    data.goals = [{
      name: data.goal, // Original goal from frontmatter
      created: data.started,
      last_active: data.last_session
    }];
    data.active_goal = data.goal;
  }

  // Check if goal already exists
  const existingGoal = data.goals.find(g => g.name === goal);
  if (existingGoal) {
    return { mapPath, data, alreadyExists: true };
  }

  // Add new goal
  data.goals.push({
    name: goal,
    created: now(),
    last_active: null
  });

  saveState(mapPath, data, content);
  return { mapPath, data, alreadyExists: false };
}

/**
 * Set active goal
 */
function setActiveGoal(mapPath, goal) {
  const { data, content } = loadState(mapPath);

  // Update active_goal
  data.active_goal = goal;

  // Update last_active for this goal
  const goalObj = data.goals.find(g => g.name === goal);
  if (goalObj) {
    goalObj.last_active = now();
  }

  saveState(mapPath, data, content);
  return { mapPath, data };
}

/**
 * Filter map by goal
 */
function filterMapByGoal(mapData, goalFilter) {
  if (!goalFilter) {
    return mapData; // No filter, return full map
  }

  const { priority_concepts, skip_concepts } = goalFilter;
  const skipSet = new Set(skip_concepts);
  const prioritySet = new Set(priority_concepts);

  // Filter sections
  const filteredSections = mapData.sections.map(section => {
    const filteredConcepts = section.concepts.filter(concept => {
      // Skip if in skip list
      if (skipSet.has(concept.name)) {
        return false;
      }

      // Include if in priority list OR no priority list defined
      if (prioritySet.size === 0 || prioritySet.has(concept.name)) {
        return true;
      }

      return false;
    });

    return {
      ...section,
      concepts: filteredConcepts
    };
  }).filter(section => section.concepts.length > 0); // Remove empty sections

  return {
    ...mapData,
    sections: filteredSections
  };
}

/**
 * Count concepts by filter
 */
function countConceptsByGoal(mapData, goalFilter) {
  const filtered = filterMapByGoal(mapData, goalFilter);

  let total = 0;
  let mastered = 0;

  filtered.sections.forEach(section => {
    section.concepts.forEach(concept => {
      total++;
      if (isMastered(concept)) {
        mastered++;
      }
    });
  });

  return { mastered, total };
}

module.exports = {
  createGoalFilter,
  loadGoalFilter,
  addGoalToMap,
  setActiveGoal,
  filterMapByGoal,
  countConceptsByGoal
};
