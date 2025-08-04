# Development Commands

## Quality & Linting Commands

| Command          | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `npm lint`       | Run ESLint with auto-fix for .ts,.tsx,.js,.jsx files  |
| `npm format`     | Format all TypeScript, JavaScript, and Markdown files |
| `npm type-check` | Run TypeScript type checks without emitting files     |
| `npm quality`    | Run all quality checks (lint, format, type-check)     |

## Testing Commands (Planned)

| Command        | Description                                |
| -------------- | ------------------------------------------ |
| `npm test`     | Run unit tests (Jest - not yet configured) |
| `npm test:e2e` | Run end-to-end tests (not yet configured)  |

## Git Hooks

- **Pre-commit**: Husky configured with lint-staged
- **Lint-staged**: Auto-formats .ts,.tsx,.js,.jsx,.md,.json,.yml,.yaml,.css,.scss files

## System Commands (macOS/Darwin)

- `ls` - list directory contents
- `find` - search for files and directories
- `grep` - search text patterns
- `git` - version control operations

## MCP Development

- **MCP Config**: `.mcp.json` configures the MCP servers
- **Server Command**: `uvx --refresh task-trellis-mcp serve` (planned)

## Important Notes

- **Always run `npm quality`** after making changes
- Project uses ES modules (`"type": "module"`)
- No source code directory exists yet - project is in setup phase
