# Task Trellis MCP

**Project planning and task management built specifically for AI agents**

[![npm version](https://badge.fury.io/js/%40langadventurellc%2Ftask-trellis-mcp.svg)](https://www.npmjs.com/package/@langadventurellc/task-trellis-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Task Trellis is an MCP server for project planning and task management built specifically for AI agents. It helps by breaking down complex projects and tracking their progress with built-in task management, complete with progress tracking, dependency management, and workflow automation. By default, all data is stored locally in Markdown files.

Primarily built as a much better alternative to managing markdown checklists. Task Trellis will make it easier to define requirements, specifications, and tasks in a structured way that the agents can actually use directly.

Full documentation is available in the [docs](docs/index.md) folder.

## Table of Contents

- [At a Glance](#at-a-glance)
- [Why Task Trellis?](#why-task-trellis)
- [Core Benefits](#core-benefits)
- [Usage](#usage)
- [Installation and Configuration](#installation-and-configuration)
- [Available Tools](#available-tools)
- [Troubleshooting](#troubleshooting)

## At a Glance

| Prompt                                                                                                  | Result                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| /task-trellis:create-project (my project details)                                                       | _project created with epics, features and tasks defined and dependencies identified_                   |
| Complete the next available task                                                                        | _next open task with dependencies satisfied is claimed and worked on_                                  |
| Work on all of the tasks for feature F-my-feature                                                       | _all tasks for the specified feature are claimed and worked on_                                        |
| Show me all open tasks in (my project)                                                                  | _list of all open tasks in the specified project_                                                      |
| After working on (feature), there's a bug. Look at what changed and fix it.                             | _bug identified by examining all the files that were modified while working on that feature and fixed_ |
| /task-trellis:create-features (feature details). Look at (other feature) and follow the same pattern    | _new feature created by mirroring the pattern of the other feature_                                    |
| (after finding issue with design) Update all tasks in F-my-feature and update the design specifications | _all tasks in the specified feature are updated to reflect the new design specifications_              |

_... and much more!_

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
  - Project → Epic → Feature → Task
  - See [Picking a Parent Issue Type](docs/issues.md#picking-a-parent-issue-type)
- **Smart Dependencies**: Prevent tasks from starting until prerequisites are complete
- **Progress Tracking**: Real-time visibility into what's done, in-progress, and pending
- **Session Continuity**: Pick up exactly where you left off across AI conversations
- **Workflow Management**: Built-in task claiming, completion, and validation workflows
- **File Change Tracking**: Automatic documentation of what files were modified for each task
- **Learn from History**: AI agents can reference past work to inform future tasks

## Core Benefits

**Focused Execution**: AI agents work on one clearly-defined task at a time  
**Progress Visibility**: Always know project status and what's next  
**Dependency Management**: Automatic task ordering based on prerequisites  
**Audit Trail**: Complete history of all work completed and changes made  
**Multi-Session Support**: Seamlessly collaborate across different AI conversations  
**Productivity Boost**: Reduce context switching and eliminate forgotten tasks

## Usage

See full documentation at [Task Trellis MCP Documentation](docs/index.md)

### Basic Workflow

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

## Installation and Configuration

See [installation instructions](docs/installation.md).

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
- **get_next_available_issue** - Use this tool to find the next available issue that's ready to work on.
- **append_issue_log** - Add progress notes and status updates to task history (occurs automatically on task completion)
- **append_modified_files** - Record files modified during task execution with change descriptions (occurs automatically on task completion)

### System Management

- **activate** - Initialize the task system (if not configured via command line)
- **prune_closed** - Clean up old completed/cancelled issues for maintenance

## Troubleshooting

### Common Issues

**Configuration issues:**

- Validate JSON syntax in MCP client configuration
- Ensure absolute paths are used for `--projectRootFolder`
- Restart your MCP client after configuration changes

### Getting Help

- **Issues**: [Report bugs or feature requests](https://github.com/langadventurellc/task-trellis-mcp/issues)
- **Documentation**: Check this README and [docs](docs/index.md)

## License

GPL-3.0-only - see [LICENSE](LICENSE) file for details.
