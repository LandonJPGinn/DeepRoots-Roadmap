// Configuration
const ROADMAP_JSON_PATH = 'roadmap.json';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadRoadmapData();
});

// Load roadmap data from JSON file
async function loadRoadmapData() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    
    try {
        const response = await fetch(ROADMAP_JSON_PATH);
        
        if (!response.ok) {
            throw new Error(`Failed to load roadmap data: ${response.status} ${response.statusText}`);
        }
        
        const roadmapData = await response.json();
        
        // Validate data structure
        if (!roadmapData || !roadmapData.releases || typeof roadmapData.releases !== 'object') {
            throw new Error('Invalid roadmap data structure: missing releases object');
        }
        
        // Hide loading, show content
        loadingElement.style.display = 'none';
        renderReleases(roadmapData);
        
    } catch (error) {
        console.error('Error loading roadmap:', error);
        loadingElement.style.display = 'none';
        errorElement.textContent = `Error: ${error.message}`;
        errorElement.style.display = 'block';
    }
}

// Render the releases and their tasks
function renderReleases(data) {
    const roadmapContainer = document.getElementById('roadmap-container');
    const lastUpdatedElement = document.getElementById('last-updated');

    // Clear existing content
    roadmapContainer.innerHTML = '';

    // Update last updated timestamp
    if (data.lastUpdated) {
        const date = new Date(data.lastUpdated);
        if (!isNaN(date.getTime())) {
            lastUpdatedElement.textContent = `Last updated: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
    }

    // Render each release as a column
    for (const releaseName in data.releases) {
        if (Object.hasOwnProperty.call(data.releases, releaseName)) {
            const tasks = data.releases[releaseName];
            const columnElement = createReleaseColumn(releaseName, tasks);
            roadmapContainer.appendChild(columnElement);
        }
    }
}

// Create a column for a release
function createReleaseColumn(releaseName, tasks) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'release-column';
    
    const header = document.createElement('h2');
    header.className = 'release-title';
    header.textContent = releaseName;
    columnDiv.appendChild(header);
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    
    if (tasks.length === 0) {
        const noTasks = document.createElement('p');
        noTasks.textContent = 'No tasks in this release yet.';
        tasksContainer.appendChild(noTasks);
    } else {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }
    
    columnDiv.appendChild(tasksContainer);
    return columnDiv;
}

// Create a task card element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-card ${task.completed ? 'completed' : ''}`;

    const taskLink = document.createElement('a');
    taskLink.href = task.url;
    taskLink.target = '_blank';
    taskLink.rel = 'noopener noreferrer';
    taskLink.textContent = task.name;
    taskDiv.appendChild(taskLink);

    if (task.notes) {
        const notes = document.createElement('p');
        notes.className = 'task-notes';
        notes.textContent = task.notes;
        taskDiv.appendChild(notes);
    }
    
    if (task.due_on) {
        const dueDate = document.createElement('span');
        dueDate.className = 'task-due-date';
        dueDate.textContent = `Due: ${new Date(task.due_on).toLocaleDateString('en-US')}`;
        taskDiv.appendChild(dueDate);
    }
    
    return taskDiv;
}
