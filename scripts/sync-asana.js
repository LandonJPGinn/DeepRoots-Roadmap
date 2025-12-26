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
          resolve(JSON.parse(data));
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
 * Fetch all tasks from the Asana project
 */
async function fetchTasks() {
  console.log('Fetching tasks from Asana project...');
  
  // Get tasks with all relevant fields
  const response = await asanaRequest(
    `/api/1.0/projects/${ASANA_PROJECT_ID}/tasks?opt_fields=name,completed,tags.name,custom_fields.name,custom_fields.display_value,notes,due_on,permalink_url`
  );
  
  return response.data;
}

/**
 * Process and organize tasks
 */
function organizeTasks(tasks) {
  console.log(`Processing ${tasks.length} tasks...`);
  
  // Filter tasks with "public" tag
  const publicTasks = tasks.filter(task => {
    return task.tags && task.tags.some(tag => 
      tag.name && tag.name.toLowerCase() === 'public'
    );
  });
  
  console.log(`Found ${publicTasks.length} public tasks`);
  
  // Organize by release custom field
  const roadmap = {};
  
  publicTasks.forEach(task => {
    // Find the release custom field
    let release = 'Unscheduled';
    
    if (task.custom_fields && task.custom_fields.length > 0) {
      const releaseField = task.custom_fields.find(field => 
        field.name && field.name.toLowerCase().includes('release')
      );
      
      if (releaseField && releaseField.display_value) {
        release = releaseField.display_value;
      }
    }
    
    // Initialize release array if it doesn't exist
    if (!roadmap[release]) {
      roadmap[release] = [];
    }
    
    // Add task to the release
    roadmap[release].push({
      name: task.name,
      completed: task.completed || false,
      notes: task.notes || '',
      due_on: task.due_on || null,
      url: task.permalink_url || null
    });
  });
  
  return roadmap;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting Asana sync...');
    
    // Fetch tasks from Asana
    const tasks = await fetchTasks();
    
    // Organize tasks by release
    const roadmap = organizeTasks(tasks);
    
    // Write to JSON file
    const output = {
      lastUpdated: new Date().toISOString(),
      releases: roadmap
    };
    
    fs.writeFileSync('roadmap.json', JSON.stringify(output, null, 2));
    console.log('Successfully wrote roadmap.json');
    
    // Log summary
    console.log('\nSummary:');
    Object.keys(roadmap).forEach(release => {
      console.log(`  ${release}: ${roadmap[release].length} tasks`);
    });
    
  } catch (error) {
    console.error('Error syncing Asana tasks:', error.message);
    process.exit(1);
  }
}

main();
