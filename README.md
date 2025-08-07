# Task Trellis MCP

An MCP (Model Context Protocol) server for Task Trellis, a task management application for AI coding agents.

## Available Tools

This MCP server provides comprehensive task management functionality through the following tools:

### Core Object Management

- **create_object**: Creates new objects (projects, epics, features, tasks) in the task hierarchy
  - Supports parent-child relationships and prerequisites
  - Validates hierarchy constraints (project → epic → feature → task)
  - Parameters: type, title, parent (optional), priority, status, prerequisites, description

- **update_object**: Updates existing objects with new properties
  - Change status, priority, prerequisites, or content
  - Validates status transitions and maintains object integrity
  - Parameters: id, priority, status, prerequisites, body, force

- **get_object**: Retrieves detailed information about a specific object by ID
  - Returns complete object data including metadata, relationships, and history
  - Parameters: id

- **delete_object**: Permanently removes objects from the system
  - Validates relationships and prevents deletion of objects with dependencies
  - Parameters: id, force

- **list_objects**: Retrieves and filters objects based on various criteria
  - Filter by type, status, priority, scope, or closed status
  - Essential for discovering and managing work items
  - Parameters: type, scope (optional), status (optional), priority (optional), includeClosed

### Task Workflow Management

- **claim_task**: Claims available tasks for execution by AI agents
  - Automatically selects highest priority ready tasks
  - Validates prerequisites and readiness criteria
  - Parameters: scope (optional), taskId (optional), force

- **complete_task**: Marks tasks as completed and records completion details
  - Documents file changes and completion summary
  - Updates task status and triggers dependent task progression
  - Parameters: taskId, summary, filesChanged

- **append_object_log**: Adds progress updates and notes to object activity logs
  - Essential for tracking work history and documenting decisions
  - Creates permanent audit trail for retrospectives and debugging
  - Parameters: id, contents

### System Management

- **activate**: Initializes the task trellis system in local or remote mode
  - Only needs to be run if the server wasn't started with command line arguments (`--projectRootFolder` for local mode or `--mode remote` for remote mode)
  - Configures data storage and validates connectivity
  - Parameters: mode, projectRoot (local), apiToken (remote), remoteProjectId (remote), url (optional)

- **prune_closed**: Maintenance tool to remove old completed/cancelled objects
  - Improves system performance and reduces clutter
  - Validates relationships before deletion to maintain integrity
  - Parameters: age, scope (optional)

### Usage

1. **Build the server:**

   ```bash
   npm run build
   ```

2. **Start the server:**

   ```bash
   npm run serve
   ```

3. **Configure in your MCP client:**
   ```json
   {
     "mcpServers": {
       "task-trellis": {
         "type": "stdio",
         "command": "npx",
         "args": ["@langadventurellc/task-trellis-mcp"]
       }
     }
   }
   ```

### Command Line Options

The server accepts the following optional command line arguments:

- `--mode <mode>` - Server mode (default: "local")
  - `local` - Use local file-based storage
  - `remote` - Use remote repository (not yet implemented)

- `--projectRootFolder <path>` - Project root folder path
  - When specified, creates a `.trellis` folder inside the project root for task storage
  - Example: `--projectRootFolder /path/to/my-project` creates `/path/to/my-project/.trellis/`

**Example with options:**

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

**Note:** You can also configure the server at runtime using the `activate` tool instead of command line arguments.

### Development

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run quality` - Run linting, formatting, and type checks
