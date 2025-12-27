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
 * Fetches the first task from the Asana project and all its details.
 */
async function fetchFirstTaskData() {
  console.log('Fetching the first task from the Asana project...');

  // Get the compact representation of the first task to get its GID
  const taskListResponse = await asanaRequest(
    `/api/1.0/projects/${ASANA_PROJECT_ID}/tasks?limit=1`
  );

  if (!taskListResponse.data || taskListResponse.data.length === 0) {
    console.log('No tasks found in the project.');
    return [];
  }

  const taskGid = taskListResponse.data[0].gid;
  console.log(`Found task with GID: ${taskGid}. Fetching full details...`);

  // Fetch the full task details and its sub-resources concurrently
  const [
    taskDetailsResponse,
    subtasksResponse,
    dependenciesResponse,
    dependentsResponse
  ] = await Promise.all([
    asanaRequest(`/api/1.0/tasks/${taskGid}?opt_expand=.`),
    asanaRequest(`/api/1.0/tasks/${taskGid}/subtasks?opt_expand=.`),
    asanaRequest(`/api/1.0/tasks/${taskGid}/dependencies?opt_expand=.`),
    asanaRequest(`/api/1.0/tasks/${taskGid}/dependents?opt_expand=.`),
  ]);

  // Combine all the data into a single object
  const detailedTask = {
    ...taskDetailsResponse.data,
    subtasks: subtasksResponse.data,
    dependencies: dependenciesResponse.data,
    dependents: dependentsResponse.data,
  };

  // Return as an array to keep the data structure consistent
  return [detailedTask];
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Asana debug dump...');

    // Fetch all task data
    const allTaskData = await fetchFirstTaskData();

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
