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
         "command": "node",
         "args": ["dist/server.js"]
       }
     }
   }
   ```

### Development

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run quality` - Run linting, formatting, and type checks
