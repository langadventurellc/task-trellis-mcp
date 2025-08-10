# Task Trellis MCP

> Transform AI coding chaos into organized productivity

[![npm version](https://badge.fury.io/js/%40langadventurellc%2Ftask-trellis-mcp.svg)](https://www.npmjs.com/package/@langadventurellc/task-trellis-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

An MCP (Model Context Protocol) server that greatly improves how AI coding agents handle complex projects. Task Trellis helps track requirements for projects, breaks them down into smaller manageable parts until you have trackable and assignable tasks with built-in workflow management, dependency handling, and progress tracking.

## Table of Contents

- [At a glance?](#at-a-glance)
- [Why Task Trellis?](#why-task-trellis)
- [Core Benefits](#core-benefits)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Project Hierarchy](#project-hierarchy)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [File Storage](#file-storage)
- [Installation](#installation)
- [Quick Test](#quick-test)
- [Configuration Options](#configuration-options)
- [Troubleshooting](#troubleshooting)

## At a Glance

**Moderate sized tasks (most use cases - a feature that gets broken down into a number of workable tasks)**

> **user:** /create-features-trellis add posthog analytics to existing web pages  
> _(system adds feature requirements document to Task Trellis)_  
> **user:** /create-tasks-trellis (feature-id)  
> _(system adds the individual tasks that the agent will work on later)_

**Large projects (when there's a lot involved that benefits from several layers of refinement)**

> **user:** /create-project-trellis add user authentication with registration and login pages, using supabase for authentication  
> _(system adds project requirements document to Task Trellis)_  
> **user:** /create-epics-trellis (project-id)  
> _(system adds epics that break down the project into distinct, yet still large bodies of work)_  
> **user:** /create-features-trellis (epic-id)  
> _(system adds features that further add detail and context to smaller bodies of work)_  
> **user:** /create-tasks-trellis (feature-id)  
> _(system adds the individual tasks that the agent will work on later)_

**Small tasks (one or several tasks that don't necessarily need the benefit of a unifying context)**

> **user:** /create-tasks-trellis create some standalone tasks to remove the console.log usage from the app  
> _(system adds the individual tasks that the agent will work on later)_

## Why Task Trellis?

### Without Task Trellis

- AI agents lose track of complex, multi-step projects
- Agents spin out of control with no clear task structure
- Tasks are often too large or vague, leading to confusion
- No way to manage dependencies or prerequisites
- No visibility into what's been completed vs. what's pending
- Tasks get forgotten, duplicated, or done out of order
- Zero coordination between multiple AI sessions
- Complex projects become chaotic and overwhelming

### With Task Trellis

- **Structured Breakdown**: Automatically organize projects into hierarchical tasks (depending on the size of the effort required)
  - For large projects, create a project with epics, features, and tasks
  - For medium projects, create features with tasks
  - For small tasks, create standalone tasks
- **Smart Dependencies**: Prevent tasks from starting until prerequisites are complete
- **Progress Tracking**: Real-time visibility into what's done, in-progress, and pending
- **Session Continuity**: Pick up exactly where you left off across AI conversations
- **Workflow Management**: Built-in task claiming, completion, and validation workflows
- **File Change Tracking**: Automatic documentation of what files were modified for each task

## Core Benefits

**Focused Execution**: AI agents work on one clearly-defined task at a time  
**Progress Visibility**: Always know project status and what's next  
**Dependency Management**: Automatic task ordering based on prerequisites  
**Audit Trail**: Complete history of all work completed and changes made  
**Multi-Session Support**: Seamlessly collaborate across different AI conversations  
**Productivity Boost**: Reduce context switching and eliminate forgotten tasks

## Usage

### Basic Workflow

See sample prompts (written as Claude Code slash commands): [Sample Prompts](docs/sample_prompts/index.md)

1. **Create Tasks**
   - For large projects
     - Create a project  
     - Create epics to group features
     - Create features to break down epics
     - Create tasks for specific work items
   - For medium-sized projects
     - Create standalone feature
     - Create tasks directly under the feature
   - For small tasks
     - Create standalone tasks

2. **Claim & Work on Tasks**
   - AI agent claims next available task
   - Works on the specific task requirements
   - Marks task complete with file changes documented

3. **Track Progress**
   - View completed vs. pending work
   - See dependency relationships
   - Monitor overall project health

## Available Tools

### Core Object Management

- **create_object** - Create projects, epics, features, or tasks with hierarchical relationships
- **update_object** - Modify object properties, status, priority, or prerequisites
- **get_object** - Retrieve detailed object information with history and relationships
- **list_objects** - Query and filter objects by type, status, priority, or scope
- **delete_object** - Remove objects (with dependency validation)
- **replace_object_body_regex** - Make targeted content edits using regex patterns

### Task Workflow Management

- **claim_task** - Claim available tasks for execution with automatic priority ordering
- **complete_task** - Mark tasks complete with file change documentation
- **append_object_log** - Add progress notes and status updates to task history

### System Management

- **activate** - Initialize the task system (if not configured via command line)
- **prune_closed** - Clean up old completed/cancelled objects for maintenance

## Project Hierarchy

Task Trellis supports a flexible 4-level hierarchy:

```
Project (Top-level container)
└── Epic (Large feature groupings)
    └── Feature (Specific functionality)
        └── Task (Individual work items)
```

**Supported Patterns:**

- Full hierarchy: `Project → Epic → Feature → Task`
- Simplified: `Feature → Task`
- Standalone: `Task` only

## Prerequisites & Dependencies

Tasks can have prerequisites that must be completed before they become available:

```typescript
{
  "type": "task",
  "title": "Deploy authentication system",
  "prerequisites": ["T-user-registration", "T-login-system", "T-email-verification"]
}
```

## File Storage

Task Trellis uses a local file-based storage system with different hierarchy patterns:

### Full Project Hierarchy

```
your-project/
└── .trellis/
    └── p/
        └── P-project-id/
            └── e/
                └── E-epic-id/
                    └── f/
                        └── F-feature-id/
                            └── t/
                                ├── open/
                                │   └── T-task-id.md
                                └── closed/
                                    └── T-completed-task-id.md
```

### Feature-Only Hierarchy

```
your-project/
└── .trellis/
    └── f/
        └── F-feature-id/
            └── t/
                ├── open/
                │   └── T-task-id.md
                └── closed/
                    └── T-completed-task-id.md
```

### Standalone Tasks

```
your-project/
└── .trellis/
    └── t/
        ├── open/
        │   └── T-task-id.md
        └── closed/
            └── T-completed-task-id.md
```

Each object is stored as a Markdown file with YAML frontmatter metadata and content body.

## Installation

### Claude Code

The easiest way to install Task Trellis MCP in Claude Code:

```bash
claude mcp add @langadventurellc/task-trellis-mcp --projectRootFolder "$(pwd)"
```

Or (you'll be required to call the activate tool once to set the project root folder):

```bash
claude mcp add @langadventurellc/task-trellis-mcp
```

### VS Code with GitHub Copilot

1. Add Task Trellis to your VS Code settings. Open your settings JSON file and add:

```json
{
  "github.copilot.chat.mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "${workspaceFolder}"
      ]
    }
  }
}
```

### Cursor

Install Task Trellis MCP in Cursor by adding to your Cursor settings:

**Method 1: Via Settings UI**

1. Open Cursor Settings (⌘/Ctrl + ,)
2. Search for "MCP"
3. Add new server with:
   - **Name**: `task-trellis`
   - **Command**: `npx`
   - **Args**: `["-y", "@langadventurellc/task-trellis-mcp", "--projectRootFolder", "${workspaceFolder}"]`

**Method 2: Via Configuration File**
Add to your Cursor configuration:

```json
{
  "mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "${workspaceFolder}"
      ]
    }
  }
}
```

### Windsurf

Add Task Trellis to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "${workspaceRoot}"
      ]
    }
  }
}
```

### Cline (VS Code Extension)

1. Add Task Trellis to your Cline MCP servers in VS Code settings:

```json
{
  "cline.mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "${workspaceFolder}"
      ]
    }
  }
}
```

### Continue (VS Code Extension)

1. Add to your Continue configuration file (`~/.continue/config.json`):

```json
{
  "mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Other MCP Clients

For any MCP-compatible client, use this configuration:

```json
{
  "mcpServers": {
    "task-trellis": {
      "command": "npx",
      "args": [
        "-y",
        "@langadventurellc/task-trellis-mcp",
        "--projectRootFolder",
        "/absolute/path/to/project"
      ]
    }
  }
}
```

## Quick Test

After installation, test that Task Trellis is working by asking your AI assistant:

> "Create a new project called 'My Test Project'"

If configured correctly, the AI should respond with a confirmation and create the project structure in your specified project root folder.

## Configuration Options

The Task Trellis MCP server supports these command-line options:

- `--mode <mode>` - Server mode (default: "local")
  - `local` - Use local file-based storage
  - `remote` - Use remote repository (planned feature)

- `--projectRootFolder <path>` - Project root folder path
  - Creates a `.trellis` folder inside the project root for task storage
  - Example: `--projectRootFolder /path/to/my-project` creates `/path/to/my-project/.trellis/`

**Advanced Configuration Example:**

```json
{
  "mcpServers": {
    "task-trellis": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@langadventurellc/task-trellis-mcp",
        "--mode",
        "local",
        "--projectRootFolder",
        "/path/to/your/project"
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues

**Tasks not appearing:**

- Ensure prerequisites are completed
- Check task status (should be 'open' or 'draft')
- Verify project scope configuration

**Configuration issues:**

- Validate JSON syntax in MCP client configuration
- Ensure absolute paths are used for `--projectRootFolder`
- Restart your MCP client after configuration changes

### Getting Help

- **Issues**: [Report bugs or feature requests](https://github.com/langadventurellc/task-trellis-mcp/issues)
- **Documentation**: Check this README and inline tool descriptions
- **Community**: Share experiences and get help from other users

## License

GPL-3.0-only - see [LICENSE](LICENSE) file for details.
