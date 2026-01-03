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
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            reject(new Error(`Failed to parse API response: ${parseError.message}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fetch all tasks from the Asana project
 */
async function fetchTasks() {
  console.log('Fetching tasks from Asana project...');

  // Define the fields we want to fetch
  const fields = [
    'gid',
    'name',
    'completed',
    'tags.name',
    'custom_fields.name',
    'custom_fields.display_value',
    'custom_fields.enum_value',
    'notes',
    'due_on',
    'permalink_url'
  ].join(',');

  // Get tasks with all relevant fields
  const response = await asanaRequest(
    `/api/1.0/projects/${ASANA_PROJECT_ID}/tasks?opt_fields=${fields}`
  );

  return response.data;
}

/**
 * Fetch subtasks for a given task
 */
async function fetchSubtasks(taskGid) {
  const fields = ['name', 'completed'].join(',');
  const response = await asanaRequest(
    `/api/1.0/tasks/${taskGid}/subtasks?opt_fields=${fields}`
  );
  return response.data;
}

/**
 * Fetch dependencies for a given task
 */
async function fetchDependencies(taskGid) {
  const fields = ['name', 'completed'].join(',');
  const response = await asanaRequest(
    `/api/1.0/tasks/${taskGid}/dependencies?opt_fields=${fields}`
  );
  return response.data;
}

/**
 * Process and organize tasks
 */
async function organizeTasks(tasks, config) {
  console.log(`Processing ${tasks.length} tasks...`);

  // Filter tasks with "public" tag
  const publicTasks = tasks.filter(task => {
    return task.tags && task.tags.some(tag =>
      tag.name && tag.name.toLowerCase() === 'public'
    );
  });

  console.log(`Found ${publicTasks.length} public tasks`);

  // Organize by the custom field specified in config.json
  const roadmap = {};
  const { taskGroupingField, displayFields } = config;

  for (const task of publicTasks) {
    let groupingValue = 'Unscheduled';

    if (task.custom_fields && task.custom_fields.length > 0) {
      const groupingField = task.custom_fields.find(field =>
        field.name && field.name.toLowerCase() === taskGroupingField.toLowerCase()
      );
      if (groupingField && groupingField.display_value) {
        groupingValue = groupingField.display_value;
      }
    }

    if (!roadmap[groupingValue]) {
      roadmap[groupingValue] = [];
    }

    // Fetch subtasks and dependencies
    const subtasks = await fetchSubtasks(task.gid);
    const dependencies = await fetchDependencies(task.gid);

    // Build the task object
    const taskOutput = {
      name: task.name,
      completed: task.completed || false,
      due_on: task.due_on || null,
      url: task.permalink_url || null,
      subtasks: subtasks.map(t => ({ name: t.name, completed: t.completed })),
      dependencies: dependencies.map(t => ({ name: t.name, completed: t.completed })),
    };

    // Add fields specified in displayFields
    for (const fieldName of displayFields) {
      const fieldNameLower = fieldName.toLowerCase();

      // Check for built-in/direct properties on the task object
      if (task[fieldNameLower] !== undefined) {
        taskOutput[fieldNameLower] = task[fieldNameLower] || (fieldNameLower === 'notes' ? '' : null);
      }
      // Check for custom fields
      else if (task.custom_fields) {
        const customField = task.custom_fields.find(cf =>
          cf.name && cf.name.toLowerCase() === fieldNameLower
        );
        taskOutput[fieldNameLower] = customField ? customField.display_value : null;
      } else {
        taskOutput[fieldNameLower] = null;
      }
    }

    roadmap[groupingValue].push(taskOutput);
  }

  return roadmap;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Asana sync...');

    // Read config file
    let config;
    try {
      config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
      console.log('Loaded config.json');
    } catch (error) {
      console.error('Error reading or parsing config.json:', error.message);
      process.exit(1);
    }

    // Fetch tasks from Asana
    const tasks = await fetchTasks();

    // Organize tasks based on config
    const roadmap = await organizeTasks(tasks, config);

    // Write to JSON file
    const output = {
      lastUpdated: new Date().toISOString(),
      releases: roadmap
    };

    fs.writeFileSync('roadmap.json', JSON.stringify(output, null, 2));
    console.log('Successfully wrote roadmap.json');

    // Log summary
    console.log('\nSummary:');
    Object.keys(roadmap).forEach(groupingValue => {
      console.log(`  ${groupingValue}: ${roadmap[groupingValue].length} tasks`);
    });

  } catch (error) {
    console.error('Error syncing Asana tasks:', error.message);
    process.exit(1);
  }
}

main();
