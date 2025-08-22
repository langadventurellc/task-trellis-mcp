# Task Trellis MCP

**Project planning and task management built specifically for AI agents**

[![npm version](https://badge.fury.io/js/%40langadventurellc%2Ftask-trellis-mcp.svg)](https://www.npmjs.com/package/@langadventurellc/task-trellis-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Task Trellis is an MCP server for project planning and task management built specifically for AI agents. It helps by breaking down complex projects and tracking their progress with built-in task management, complete with progress tracking, dependency management, and workflow automation. By default, all data is stored locally in Markdown files.

Primarily built as a much better alternative to managing markdown checklists. Task Trellis will make it easier to define requirements, specifications, and tasks in a structured way that the agents can actually use directly.

## Table of Contents

- [At a Glance](#at-a-glance)
- [Why Task Trellis?](#why-task-trellis)
- [Core Benefits](#core-benefits)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Project Hierarchy](#project-hierarchy)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [File Storage](#file-storage)
- [Installation and Configuration](#installation-and-configuration)
- [Troubleshooting](#troubleshooting)

## At a Glance

Task Trellis works with issues that are projects, epics, features or tasks.

**Tasks** are the most important type of issue. This is where the actual work gets done. Each task is a specific piece of work that needs to be completed in order to achieve the project's goals. The other issue types are too big to be a task and they exist to help organize and manage multiple tasks to accomplish a particular goal. Tasks can be standalone or part of a larger feature.

**Features** are the next level up from tasks. They represent the requirements and functionality needed to deliver a specific aspect of the project. Features can be standalone or a part of a larger epic.

**Epics** are next after features. They represent a significant deliverable or a large body of work that can be broken down into multiple features and tasks. Epics can be standalone or a part of a larger project.

**Projects** are the highest level of organization. They represent the overall initiative or goal that encompasses multiple epics, features, and tasks. Projects provide a way to group related work and track progress at a high level.

Depending on the size of the effort, you can choose to create a project with epics, features, and tasks, or you can create standalone tasks as needed. Once you have your tasks defined, you can easily manage and track their progress through the Task Trellis MCP tools.

Currently, all Task Trellis issues are stored as markdown files in the `.trellis` folder in the root of your project. This makes it unsuitable for projects with multiple developers, but a remote option is in development now and should be available soon.

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
   - Determine your starting point based on the expected size of your project
     - **Project** - For sprawling initiatives with many moving parts
     - **Epic** - For large feature groupings
     - **Feature** - For specific functionality
     - **Task** - For individual work items

2. **Claim & Work on Tasks**
   - AI agent claims next available task
     - Excludes tasks that have incomplete prerequisites
     - Grabs the next highest priority available task
     - Mark a task as `draft` if you don't want it to be worked on yet - it won't be claimed when the tool looks for the next available task
   - Works on the specific task requirements
   - Marks task complete with file changes documented
     - Automatically tracks which files were modified
     - Logs summary of changes made
     - Work done in the future could reference this to better understand the current state of the project

3. **Track Progress**
   - View completed vs. pending work
   - See dependency relationships
   - Monitor overall project health

## Available Tools

### Core Issue Management

- **create_issue** - Create projects, epics, features, or tasks with hierarchical relationships
- **update_issue** - Modify issue properties, status, priority, or prerequisites
- **get_issue** - Retrieve detailed issue information with history and relationships
- **list_issues** - Query and filter issues by type, status, priority, or scope (returns issue summaries)
- **delete_issue** - Remove issues (with dependency validation)
- **replace_issue_body_regex** - Make targeted body content edits using regex patterns

### Task Workflow Management

- **claim_task** - Claim available tasks for execution with automatic priority ordering
- **complete_task** - Mark tasks complete with file change documentation
- **append_issue_log** - Add progress notes and status updates to task history (occurs automatically on task completion)
- **append_modified_files** - Record files modified during task execution with change descriptions (occurs automatically on task completion)

### System Management

- **activate** - Initialize the task system (if not configured via command line)
- **prune_closed** - Clean up old completed/cancelled issues for maintenance

## Project Hierarchy

Task Trellis supports a flexible 4-level hierarchy:

```
Project (Top-level container)
└── Epic (Large feature groupings)
    └── Feature (Specific functionality)
        └── Task (Individual work items)
```

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

### Epic-Only Hierarchy

```
your-project/
└── .trellis/
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

Each issue is stored as a Markdown file with YAML frontmatter metadata and content body.

## Installation and Configuration

See [installation instructions](docs/installation.md).

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
