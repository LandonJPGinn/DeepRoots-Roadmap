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

  // Check for root properties
  if (typeof data.lastUpdated !== 'string' || !data.lastUpdated) {
    exitWithError('"lastUpdated" field is missing or invalid.');
  }
  if (!data.releases || typeof data.releases !== 'object' || Array.isArray(data.releases)) {
    exitWithError('"releases" field must be a non-array object.');
  }

  // Check each release
  for (const releaseName in data.releases) {
    if (Object.hasOwnProperty.call(data.releases, releaseName)) {
      const tasks = data.releases[releaseName];

      if (!Array.isArray(tasks)) {
        exitWithError(`Release "${releaseName}" must contain an array of tasks.`);
      }

      // Check each task in the release
      for (const task of tasks) {
        if (typeof task !== 'object' || task === null) {
          exitWithError(`A task in "${releaseName}" is not a valid object.`);
        }
        if (typeof task.name !== 'string' || !task.name) {
          exitWithError(`A task in "${releaseName}" is missing a "name".`);
        }
        if (typeof task.completed !== 'boolean') {
          exitWithError(`Task "${task.name}" is missing a "completed" boolean flag.`);
        }
        if (typeof task.url !== 'string' || !task.url.startsWith('https://app.asana.com')) {
            exitWithError(`Task "${task.name}" has an invalid Asana URL.`);
        }
      }
    }
  }

  console.log('Validation successful! The roadmap.json structure is correct.');
}

validateRoadmap();
