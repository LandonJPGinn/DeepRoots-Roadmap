const fs = require('fs');

const ROADMAP_PATH = 'roadmap.json';

function exitWithError(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

function validateRoadmap() {
  console.log(`Validating ${ROADMAP_PATH}...`);

  let data;
  try {
    const fileContent = fs.readFileSync(ROADMAP_PATH, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    exitWithError(`Error reading or parsing ${ROADMAP_PATH}: ${error.message}`);
  }

  if (data.lastUpdated && typeof data.lastUpdated !== 'string') {
    exitWithError('"lastUpdated" field must be a string.');
  }

  if (!data.columns || !Array.isArray(data.columns)) {
    exitWithError('"columns" field is missing or not an array.');
  }

  for (const [columnIndex, column] of data.columns.entries()) {
    if (typeof column !== 'object' || column === null) {
      exitWithError(`Column at index ${columnIndex} is not a valid object.`);
    }
    if (typeof column.id !== 'string' || !column.id) {
      exitWithError(`Column at index ${columnIndex} has a missing or invalid "id".`);
    }
    if (typeof column.title !== 'string' || !column.title) {
      exitWithError(`Column "${column.id}" is missing a "title".`);
    }
    if (column.description && typeof column.description !== 'string') {
      exitWithError(`Column "${column.id}" has an invalid "description". It must be a string.`);
    }
    if (!column.tasks || !Array.isArray(column.tasks)) {
      exitWithError(`Column "${column.id}" is missing a "tasks" array.`);
    }

    for (const [taskIndex, task] of column.tasks.entries()) {
        if (typeof task !== 'object' || task === null) {
            exitWithError(`Task at index ${taskIndex} in column "${column.id}" is not a valid object.`);
        }
      if (typeof task.title !== 'string' || !task.title) {
        exitWithError(`Task in column "${column.id}" is missing a "title".`);
      }
      if (task.id && typeof task.id !== 'string') {
        exitWithError(`Task "${task.title}" has an invalid "id". It must be a string.`);
      }
      if (task.description && typeof task.description !== 'string') {
        exitWithError(`Task "${task.title}" has an invalid "description". It must be a string.`);
      }
      if (task.priority && !['High', 'Medium', 'Low'].includes(task.priority)) {
        exitWithError(`Task "${task.title}" has an invalid "priority". It must be "High", "Medium", or "Low".`);
      }
      if (task.tags && (!Array.isArray(task.tags) || !task.tags.every(tag => typeof tag === 'string'))) {
        exitWithError(`Task "${task.title}" has an invalid "tags" field. It must be an array of strings.`);
      }
      if (task.assignee && typeof task.assignee !== 'string') {
        exitWithError(`Task "${task.title}" has an invalid "assignee". It must be a string.`);
      }
    }
  }

  console.log('Validation successful!');
}

validateRoadmap();
