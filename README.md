# DeepRoots-Roadmap

Public facing roadmap for Deep Roots - A JSON-driven Kanban board for tracking project progress.

## Overview

This is a single-page website that displays a Kanban board for tracking tasks and features across different development stages. The entire board is driven by a JSON configuration file, making it easy to update without modifying code.

## Features

- 📊 **JSON-Driven**: All columns and tasks are defined in `roadmap.json`
- 🎨 **Modern Design**: Beautiful gradient background with responsive card layout
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🏷️ **Rich Task Details**: Support for priorities, tags, descriptions, and assignees
- ⚡ **Fast & Lightweight**: Pure vanilla JavaScript, no dependencies

## Quick Start

1. Clone this repository
2. Open `index.html` in your web browser
3. The Kanban board will automatically load from `roadmap.json`

For local development with proper CORS handling, you can use a simple HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have npx)
npx http-server
```

Then open `http://localhost:8000` in your browser.

## Configuration

### JSON Structure

The roadmap is configured via `roadmap.json` with the following structure:

```json
{
  "lastUpdated": "2025-12-26",
  "columns": [
    {
      "id": "column-id",
      "title": "Column Title",
      "description": "Column description",
      "tasks": [
        {
          "id": "task-id",
          "title": "Task Title",
          "description": "Task description",
          "priority": "High|Medium|Low",
          "tags": ["tag1", "tag2"],
          "assignee": "Team or Person Name"
        }
      ]
    }
  ]
}
```

### Field Descriptions

**Root Level:**
- `lastUpdated` (optional): ISO date string for when the roadmap was last updated

**Column Object:**
- `id` (required): Unique identifier for the column
- `title` (required): Display name of the column
- `description` (optional): Brief description of what this column represents
- `tasks` (required): Array of task objects

**Task Object:**
- `id` (optional): Unique identifier for the task
- `title` (required): Task name
- `description` (optional): Detailed description
- `priority` (optional): "High", "Medium", or "Low" (affects visual styling)
- `tags` (optional): Array of tag strings
- `assignee` (optional): Person or team assigned to the task

## Customization

### Styling

Edit `styles.css` to customize:
- Colors and gradients
- Card styling
- Typography
- Responsive breakpoints

### Functionality

Edit `app.js` to modify:
- JSON loading logic
- Rendering behavior
- Add interactivity (drag-and-drop, filtering, etc.)

### Data Source

By default, the app loads from `roadmap.json`. To use a different source:
1. Open `app.js`
2. Change the `ROADMAP_JSON_PATH` constant at the top of the file

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

Open source - feel free to use and modify for your projects.
