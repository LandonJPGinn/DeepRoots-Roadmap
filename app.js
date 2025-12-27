// Configuration
const ROADMAP_JSON_PATH = 'roadmap.json';

// DOM Elements
const roadmapContainer = document.getElementById('roadmap-container');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const lastUpdatedElement = document.getElementById('last-updated');

// Initialize
document.addEventListener('DOMContentLoaded', loadRoadmapData);

/**
 * Fetches and renders the roadmap data.
 */
async function loadRoadmapData() {
    try {
        const response = await fetch(ROADMAP_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Validate data structure
        if (!data || !data.releases || typeof data.releases !== 'object') {
            throw new Error('Invalid roadmap data structure: "releases" object not found.');
        }

        renderRoadmap(data);
        updateTimestamp(data.lastUpdated);

    } catch (e) {
        console.error('Failed to load or render roadmap:', e);
        showError(e.message);
    } finally {
        hideLoading();
    }
}

/**
 * Renders the entire roadmap from the provided data.
 * @param {object} data - The roadmap data object.
 */
function renderRoadmap(data) {
    // Clear any existing content
    roadmapContainer.innerHTML = '';

    const releaseKeys = Object.keys(data.releases);

    if (releaseKeys.length === 0) {
        roadmapContainer.innerHTML = '<p class="no-tasks">No releases found.</p>';
        return;
    }

    releaseKeys.forEach(releaseName => {
        const tasks = data.releases[releaseName];
        const releaseColumn = createReleaseColumn(releaseName, tasks);
        roadmapContainer.appendChild(releaseColumn);
    });
}

/**
 * Creates a column for a single release.
 * @param {string} releaseName - The name of the release.
 * @param {Array<object>} tasks - An array of task objects.
 * @returns {HTMLElement} The created column element.
 */
function createReleaseColumn(releaseName, tasks) {
    const column = document.createElement('div');
    column.className = 'release-column';

    const title = document.createElement('h2');
    title.className = 'release-title';
    title.textContent = releaseName;
    column.appendChild(title);

    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-tasks">No tasks in this release.</p>';
    } else {
        tasks.forEach(taskData => {
            const taskElement = createTaskElement(taskData);
            tasksContainer.appendChild(taskElement);
        });
    }

    column.appendChild(tasksContainer);
    return column;
}

/**
 * Creates an element for a single task.
 * @param {object} taskData - The data for the task.
 * @returns {HTMLElement} The created task element.
 */
function createTaskElement(taskData) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    if (taskData.completed) {
        taskCard.classList.add('completed');
    }

    // Add a class for the status
    if (taskData.status) {
        const statusClass = `status-${taskData.status.toLowerCase().replace(/\s+/g, '-')}`;
        taskCard.classList.add(statusClass);
    }

    const taskName = document.createElement('div');
    taskName.className = 'task-name';
    taskName.textContent = taskData.name || 'Unnamed Task';
    taskCard.appendChild(taskName);

    if (taskData.notes) {
        const taskNotes = document.createElement('div');
        taskNotes.className = 'task-notes';
        taskNotes.textContent = taskData.notes;
        taskCard.appendChild(taskNotes);
    }

    // Create and append the status element
    if (taskData.status) {
        const taskStatus = document.createElement('div');
        taskStatus.className = 'task-status';

        const statusDot = document.createElement('span');
        statusDot.className = 'status-dot';
        taskStatus.appendChild(statusDot);

        const statusLabel = document.createElement('span');
        statusLabel.className = 'status-label';
        statusLabel.textContent = taskData.status;
        taskStatus.appendChild(statusLabel);

        taskCard.appendChild(taskStatus);
    }

    return taskCard;
}

/**
 * Formats an ISO date string into a more readable format.
 * @param {string} dateString - The ISO date string.
 * @returns {string} The formatted date.
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Updates the 'last updated' timestamp in the footer.
 * @param {string} timestamp - The ISO timestamp string.
 */
function updateTimestamp(timestamp) {
    if (timestamp && lastUpdatedElement) {
        const date = new Date(timestamp);
        lastUpdatedElement.textContent = `Last updated: ${date.toLocaleString()}`;
    }
}

/**
 * Hides the loading spinner.
 */
function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Displays an error message to the user.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    if (errorElement) {
        errorElement.textContent = `Error: ${message}`;
        errorElement.style.display = 'block';
    }
}
