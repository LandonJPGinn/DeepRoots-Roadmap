// Configuration
const ROADMAP_JSON_PATH = 'roadmap.json';
const CONFIG_JSON_PATH = 'config.json';

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
        const [roadmapResponse, configResponse] = await Promise.all([
            fetch(ROADMAP_JSON_PATH),
            fetch(CONFIG_JSON_PATH)
        ]);

        if (!roadmapResponse.ok) {
            throw new Error(`HTTP error! status: ${roadmapResponse.status}`);
        }
        if (!configResponse.ok) {
            throw new Error(`HTTP error! status: ${configResponse.status}`);
        }

        const roadmapData = await roadmapResponse.json();
        const configData = await configResponse.json();

        // Validate data structure
        if (!roadmapData || !roadmapData.releases || typeof roadmapData.releases !== 'object') {
            throw new Error('Invalid roadmap data structure: "releases" object not found.');
        }
        if (!configData || !Array.isArray(configData.displayFields)) {
            throw new Error('Invalid config structure: "displayFields" array not found.');
        }

        renderRoadmap(roadmapData, configData);
        updateTimestamp(roadmapData.lastUpdated);

    } catch (e) {
        console.error('Failed to load or render roadmap:', e);
        showError(e.message);
    } finally {
        hideLoading();
    }
}

/**
 * Renders the entire roadmap from the provided data.
 * @param {object} roadmapData - The roadmap data object.
 * @param {object} configData - The configuration object.
 */
function renderRoadmap(roadmapData, configData) {
    // Clear any existing content
    roadmapContainer.innerHTML = '';

    const releaseKeys = Object.keys(roadmapData.releases);

    if (releaseKeys.length === 0) {
        roadmapContainer.innerHTML = '<p class="no-tasks">No releases found.</p>';
        return;
    }

    releaseKeys.forEach(releaseName => {
        const tasks = roadmapData.releases[releaseName];
        const releaseColumn = createReleaseColumn(releaseName, tasks, configData);
        roadmapContainer.appendChild(releaseColumn);
    });
}

/**
 * Creates a column for a single release.
 * @param {string} releaseName - The name of the release.
 * @param {Array<object>} tasks - An array of task objects.
 * @param {object} configData - The configuration object.
 * @returns {HTMLElement} The created column element.
 */
function createReleaseColumn(releaseName, tasks, configData) {
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
            const taskElement = createTaskElement(taskData, configData);
            tasksContainer.appendChild(taskElement);
        });
    }

    column.appendChild(tasksContainer);
    return column;
}

/**
 * Creates an element for a single task.
 * @param {object} taskData - The data for the task.
 * @param {object} configData - The configuration object.
 * @returns {HTMLElement} The created task element.
 */
function createTaskElement(taskData, configData) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    if (taskData.completed) {
        taskCard.classList.add('completed');
    }

    const status = taskData.status;
    if (status) {
        const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
        taskCard.classList.add(statusClass);
    }

    const taskName = document.createElement('div');
    taskName.className = 'task-name';
    taskName.textContent = taskData.name || 'Unnamed Task';
    taskCard.appendChild(taskName);

    // Display fields based on config
    configData.displayFields.forEach(fieldName => {
        const fieldKey = fieldName.toLowerCase();
        if (taskData[fieldKey]) {
            let fieldElement;
            if (fieldKey === 'status') {
                fieldElement = document.createElement('div');
                fieldElement.className = 'task-status';

                const statusDot = document.createElement('span');
                statusDot.className = 'status-dot';
                fieldElement.appendChild(statusDot);

                const statusLabel = document.createElement('span');
                statusLabel.className = 'status-label';
                statusLabel.textContent = taskData[fieldKey];
                fieldElement.appendChild(statusLabel);

            } else if (fieldKey === 'notes') {
                fieldElement = document.createElement('div');
                fieldElement.className = 'task-notes';
                fieldElement.textContent = taskData[fieldKey];
            } else {
                // Generic display for other fields
                fieldElement = document.createElement('div');
                fieldElement.className = `task-field task-${fieldKey}`;
                fieldElement.innerHTML = `<span class="field-label">${fieldName}:</span> <span class="field-value">${taskData[fieldKey]}</span>`;
            }
            taskCard.appendChild(fieldElement);
        }
    });


    // Create a container for subtasks and dependencies
    const relationsContainer = document.createElement('div');
    relationsContainer.className = 'task-relations';
    taskCard.appendChild(relationsContainer);

    // Display subtasks if they exist
    if (taskData.subtasks && taskData.subtasks.length > 0) {
        const subtasksContainer = document.createElement('div');
        subtasksContainer.className = 'relation-group';

        const subtasksTitle = document.createElement('div');
        subtasksTitle.className = 'relation-title';
        subtasksTitle.textContent = 'Subtasks';
        subtasksContainer.appendChild(subtasksTitle);

        const subtasksList = document.createElement('ul');
        subtasksList.className = 'relation-list';
        taskData.subtasks.forEach(subtask => {
            const item = document.createElement('li');
            item.textContent = subtask.name;
            if (subtask.completed) {
                item.classList.add('completed');
            }
            subtasksList.appendChild(item);
        });
        subtasksContainer.appendChild(subtasksList);

        const subtasksCount = document.createElement('div');
        subtasksCount.className = 'relation-count';
        const completedSubtasks = taskData.subtasks.filter(t => t.completed).length;
        subtasksCount.textContent = `${completedSubtasks}/${taskData.subtasks.length} Completed`;
        subtasksContainer.appendChild(subtasksCount);

        relationsContainer.appendChild(subtasksContainer);
    }

    // Display dependencies if they exist
    if (taskData.dependencies && taskData.dependencies.length > 0) {
        const dependenciesContainer = document.createElement('div');
        dependenciesContainer.className = 'relation-group';

        const dependenciesTitle = document.createElement('div');
        dependenciesTitle.className = 'relation-title';
        dependenciesTitle.textContent = 'Dependencies';
        dependenciesContainer.appendChild(dependenciesTitle);

        const dependenciesList = document.createElement('ul');
        dependenciesList.className = 'relation-list';
        taskData.dependencies.forEach(dependency => {
            const item = document.createElement('li');
            item.textContent = dependency.name;
            if (dependency.completed) {
                item.classList.add('completed');
            }
            dependenciesList.appendChild(item);
        });
        dependenciesContainer.appendChild(dependenciesList);

        const dependenciesCount = document.createElement('div');
        dependenciesCount.className = 'relation-count';
        const completedDependencies = taskData.dependencies.filter(t => t.completed).length;
        dependenciesCount.textContent = `${completedDependencies}/${taskData.dependencies.length} Completed`;
        dependenciesContainer.appendChild(dependenciesCount);

        relationsContainer.appendChild(dependenciesContainer);
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
