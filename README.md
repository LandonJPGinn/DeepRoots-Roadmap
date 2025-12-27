# DeepRoots-Roadmap
Public facing roadmap for Deep Roots

## Overview
This repository automatically syncs tasks from an Asana project to generate a public roadmap. The roadmap is updated daily via GitHub Actions and organized by release.

## Setup

### Prerequisites
- An Asana account with access to the project
- An Asana Personal Access Token
- The Asana Project ID

### Configuration

1. **Generate an Asana Personal Access Token:**
   - Go to [Asana Developer Console](https://app.asana.com/0/developer-console)
   - Create a new Personal Access Token
   - Copy the token

2. **Find your Asana Project ID:**
   - Open your Asana project
   - The Project ID is in the URL: `https://app.asana.com/0/{PROJECT_ID}/list`

3. **Add GitHub Secrets:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `ASANA_ACCESS_TOKEN`: Your Asana Personal Access Token
     - `ASANA_PROJECT_ID`: Your Asana Project ID

### Task Configuration in Asana

For tasks to appear in the public roadmap:
1. Add the tag **"public"** to the task
2. Set a **"Release"** custom field (or similar) to organize tasks into columns

Tasks without the "public" tag will not be included in the roadmap.

## How It Works

The GitHub Action workflow runs daily at midnight UTC and:
1. Queries all tasks from the specified Asana project
2. Filters tasks that have the "public" tag
3. Organizes tasks by their "Release" custom field value
4. Generates a `roadmap.json` file with the structured data

### Roadmap JSON Structure

```json
{
  "lastUpdated": "2025-12-26T00:00:00.000Z",
  "releases": {
    "v1.0": [
      {
        "name": "Task Name",
        "completed": false,
        "notes": "Task description",
        "due_on": "2025-12-31",
        "url": "https://app.asana.com/0/project/task"
      }
    ],
    "v2.0": [...],
    "Unscheduled": [...]
  }
}
```

## Manual Sync

You can manually trigger the sync workflow:
1. Go to the "Actions" tab in your repository
2. Select "Sync Asana Tasks" workflow
3. Click "Run workflow"

## Using the Roadmap Data

The generated `roadmap.json` file can be consumed by a web application to display the roadmap. Each release becomes a column, and tasks are displayed within their respective release columns.
