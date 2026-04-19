# Installation

## CLI Arguments

- **--mode <mode>**: Server mode. `local` or `remote` (default: `local`) (`remote` not yet supported)
- **--projectDir <path>**: Absolute path to the project directory for this MCP session. Can also be set via `$TRELLIS_PROJECT_DIR`. Required in local mode.
- **--no-auto-complete-parent**: Disable automatic completion of parent issues (features, epics, projects) when the last task of a feature is completed
- **--auto-prune <days>**: Auto-prune closed objects older than N days (default: `0` = disabled). Set to a positive number to automatically delete completed tasks and closed issues after the specified number of days

## Claude Code

The easiest way to install Task Trellis MCP in Claude Code:

```bash
claude mcp add @langadventurellc/task-trellis-mcp --projectDir "$(pwd)"
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
        "--projectDir",
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
        "--projectDir",
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
        "--projectDir",
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
        "--projectDir",
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
        "--projectDir",
        "/absolute/path/to/project"
      ]
    }
  }
}
```

# Quick Test

After installation, test that Task Trellis is working by asking your AI assistant:

> "Create a new project called 'My Test Project'"

If configured correctly, the AI should respond with a confirmation and create the project structure under `~/.trellis/`.

# Configuration Options

The Task Trellis MCP server supports these command-line options:

- `--mode <mode>` - Server mode (default: "local")
  - `local` - Use local file-based storage
  - `remote` - Use remote repository (planned feature)

- `--projectDir <path>` - Absolute path to the project directory
  - Data is stored under `~/.trellis/projects/<key>/` (shared across all sessions), not inside the repo
  - Can be set via the `$TRELLIS_PROJECT_DIR` environment variable instead
  - Example: `--projectDir /path/to/my-project`

- `$TRELLIS_DATA_DIR` - Override the shared data root (default: `~/.trellis`)

- `$TRELLIS_UI_PORT` - Override the browser UI port (default: `3717`)

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
        "--projectDir",
        "/path/to/your/project",
        "--auto-prune",
        "30",
        "--no-auto-complete-parent"
      ]
    }
  }
}
```

# Browser UI

When the first MCP session starts, it binds a local browser UI at `http://127.0.0.1:3717` (port overridable via `$TRELLIS_UI_PORT`). Subsequent sessions run STDIO-only and share the same leader's data. The UI is read-only and shows all projects under `~/.trellis/projects/`.
