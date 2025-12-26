// Configuration
const ROADMAP_JSON_PATH = 'roadmap.json';

// State
let roadmapData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadRoadmapData();
});

// Load roadmap data from JSON file
async function loadRoadmapData() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const kanbanBoard = document.getElementById('kanban-board');
    
    try {
        const response = await fetch(ROADMAP_JSON_PATH);
        
        if (!response.ok) {
            throw new Error(`Failed to load roadmap data: ${response.status} ${response.statusText}`);
        }
        
        roadmapData = await response.json();
        
        // Validate data structure
        if (!roadmapData || !roadmapData.columns || !Array.isArray(roadmapData.columns)) {
            throw new Error('Invalid roadmap data structure: missing columns array');
        }
        
        // Hide loading, show content
        loadingElement.style.display = 'none';
        renderKanbanBoard();
        updateLastUpdated();
        
    } catch (error) {
        console.error('Error loading roadmap:', error);
        loadingElement.style.display = 'none';
        errorElement.textContent = `Error: ${error.message}`;
        errorElement.style.display = 'block';
    }
}

// Render the entire Kanban board
function renderKanbanBoard() {
    const kanbanBoard = document.getElementById('kanban-board');
    
    // Clear existing content
    kanbanBoard.innerHTML = '';
    
    // Render each column
    roadmapData.columns.forEach(column => {
        const columnElement = createColumnElement(column);
        kanbanBoard.appendChild(columnElement);
    });
}

// Create a column element
function createColumnElement(column) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'kanban-column';
    columnDiv.dataset.columnId = column.id || '';
    
    // Column header
    const header = document.createElement('div');
    header.className = 'column-header';
    
    const title = document.createElement('div');
    title.className = 'column-title';
    title.textContent = column.title || 'Untitled';
    header.appendChild(title);
    
    if (column.description) {
        const description = document.createElement('div');
        description.className = 'column-description';
        description.textContent = column.description;
        header.appendChild(description);
    }
    
    const taskCount = document.createElement('div');
    taskCount.className = 'task-count';
    const tasks = column.tasks || [];
    taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    header.appendChild(taskCount);
    
    columnDiv.appendChild(header);
    
    // Tasks container
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
    });
    
    columnDiv.appendChild(tasksContainer);
    
    return columnDiv;
}

// Create a task card element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-card';
    taskDiv.dataset.taskId = task.id || '';
    
    // Task title
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title || 'Untitled Task';
    taskDiv.appendChild(title);
    
    // Task description
    if (task.description) {
        const description = document.createElement('div');
        description.className = 'task-description';
        description.textContent = task.description;
        taskDiv.appendChild(description);
    }
    
    // Task metadata (tags, priority, assignee)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';
    
    // Priority tag
    if (task.priority && typeof task.priority === 'string') {
        const priorityTag = document.createElement('span');
        priorityTag.className = `task-tag priority-${task.priority.toLowerCase()}`;
        priorityTag.textContent = task.priority;
        metaDiv.appendChild(priorityTag);
    }
    
    // Custom tags
    if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'task-tag';
            tagElement.textContent = tag;
            metaDiv.appendChild(tagElement);
        });
    }
    
    // Assignee
    if (task.assignee) {
        const assignee = document.createElement('span');
        assignee.className = 'task-assignee';
        assignee.textContent = `👤 ${task.assignee}`;
        metaDiv.appendChild(assignee);
    }
    
    taskDiv.appendChild(metaDiv);
    
    return taskDiv;
}

// Update the last updated timestamp
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    
    if (roadmapData.lastUpdated) {
        const date = new Date(roadmapData.lastUpdated);
        // Validate the date is valid
        if (!isNaN(date.getTime())) {
            lastUpdatedElement.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            // Fall back to current date if invalid
            lastUpdatedElement.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } else {
        lastUpdatedElement.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
