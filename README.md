# Task Trellis MCP

An MCP (Model Context Protocol) server for Task Trellis, a task management application for AI coding agents.

## Hello World Tool

This implementation includes a simple `hello_world` tool that demonstrates basic MCP functionality.

### Available Tools

- **hello_world**: Returns a greeting message
  - Optional parameter: `name` (string) - Name to greet (defaults to "World")

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
