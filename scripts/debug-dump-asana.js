const https = require('https');
const fs = require('fs');

// Configuration
const ASANA_ACCESS_TOKEN = process.env.ASANA_ACCESS_TOKEN;
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID;

if (!ASANA_ACCESS_TOKEN || !ASANA_PROJECT_ID) {
  console.error('Error: ASANA_ACCESS_TOKEN and ASANA_PROJECT_ID must be set');
  process.exit(1);
}

/**
 * Make a request to the Asana API
 */
function asanaRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'app.asana.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            reject(new Error(`Failed to parse API response: ${parseError.message}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fetch all tasks from the Asana project with all available fields,
 * and then fetch all sub-resources for each task.
 */
async function fetchAllTaskData() {
  console.log('Fetching all task data from Asana project...');

  // Use opt_expand to get all available fields for the tasks.
  const response = await asanaRequest(
    `/api/1.0/projects/${ASANA_PROJECT_ID}/tasks?opt_expand=.`
  );

  const tasks = response.data;
  const detailedTasks = [];

  for (const task of tasks) {
    console.log(`Fetching details for task: "${task.name}"`);

    // For each task, fetch its subtasks, dependencies, and dependents
    const [subtasks, dependencies, dependents] = await Promise.all([
      asanaRequest(`/api/1.0/tasks/${task.gid}/subtasks?opt_expand=.`),
      asanaRequest(`/api/1.0/tasks/${task.gid}/dependencies?opt_expand=.`),
      asanaRequest(`/api/1.0/tasks/${task.gid}/dependents?opt_expand=.`),
    ]);

    detailedTasks.push({
      ...task,
      subtasks: subtasks.data,
      dependencies: dependencies.data,
      dependents: dependents.data,
    });
  }

  return detailedTasks;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Asana debug dump...');

    // Fetch all task data
    const allTaskData = await fetchAllTaskData();

    // Write to JSON file
    const output = {
      lastUpdated: new Date().toISOString(),
      project_id: ASANA_PROJECT_ID,
      tasks: allTaskData
    };

    fs.writeFileSync('asana_dump.json', JSON.stringify(output, null, 2));
    console.log('Successfully wrote asana_dump.json');
    console.log(`Dumped data for ${allTaskData.length} tasks.`);

  } catch (error)
    {
    console.error('Error during Asana debug dump:', error.message);
    process.exit(1);
  }
}

main();
