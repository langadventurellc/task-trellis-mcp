# Installation

## CLI Arguments

- **--mode <mode>**: Server mode. `local` or `remote` (default: `local`) (`remote` not yet supported)
- **--projectRootFolder <path>**: Project root folder path (typically, the root of your repository, but can be in a shared folder for collaboration)
- **--no-auto-complete-parent**: Disable automatic completion of parent issues (features, epics, projects) when the last task of a feature is completed
- **--auto-prune <days>**: Auto-prune closed objects older than N days (default: `0` = disabled). Set to a positive number to automatically delete completed tasks and closed issues after the specified number of days

## Claude Code

The easiest way to install Task Trellis MCP in Claude Code:

```bash
claude mcp add @langadventurellc/task-trellis-mcp --projectRootFolder "$(pwd)"
```

## VS Code with GitHub Copilot

Add Task Trellis to your VS Code settings. Open your `.vscode/mcp.json` file and add:

```json
{
  "servers": {
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

See [VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

## Cursor

Add to `.cursor/mcp.json` or `~/.cursor/mcp.json`:

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

See [Cursor MCP documentation](https://docs.cursor.com/en/context/mcp)

## Windsurf

Add Task Trellis to `~/.codeium/windsurf/mcp_config.json`:

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

See [Windsurf MCP documentation](https://docs.windsurf.com/windsurf/cascade/mcp)

## Cline (VS Code Extension)

1. Add Task Trellis to `cline_mcp_settings.json`:

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

See [Cline MCP documentation](https://docs.cline.bot/mcp/configuring-mcp-servers)

## Other MCP Clients

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

# Quick Test

After installation, test that Task Trellis is working by asking your AI assistant:

> "Create a new project called 'My Test Project'"

If configured correctly, the AI should respond with a confirmation and create the project structure in your specified project root folder.

# Configuration Options

The Task Trellis MCP server supports these command-line options:

- `--mode <mode>` - Server mode (default: "local")
  - `local` - Use local file-based storage
  - `remote` - Use remote repository (planned feature)

- `--projectRootFolder <path>` - Project root folder path
  - Creates a `.trellis` folder inside the project root for task storage
  - Example: `--projectRootFolder /path/to/my-project` creates `/path/to/my-project/.trellis/`

- `--auto-prune <days>` - Auto-prune closed objects (default: "0" = disabled)
  - Automatically deletes completed tasks and closed issues older than the specified number of days
  - Set to `0` to disable auto-pruning
  - Example: `--auto-prune 30` deletes completed items older than 30 days

- `--no-auto-complete-parent` - Disable automatic parent completion
  - Prevents automatic completion of parent issues when all child tasks are completed

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
        "/path/to/your/project",
        "--auto-prune",
        "30",
        "--no-auto-complete-parent"
      ]
    }
  }
}
```
