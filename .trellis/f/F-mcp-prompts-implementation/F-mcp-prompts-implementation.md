---
id: F-mcp-prompts-implementation
title: MCP Prompts Implementation
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:23:06.976Z
updated: 2025-09-02T18:23:06.976Z
---

# Task Trellis MCP Prompts Implementation Design

## Overview

This design document outlines the implementation of MCP prompts for the Task Trellis server, exposing workflow templates as discoverable slash commands in Claude Code. The implementation will parse existing markdown prompt files, expose them via the MCP prompts API, and provide lean argument handling (no pickers/autocomplete, no hot reload).

## Core Architecture

### 1. Prompt Data Model

```typescript
interface TrellisPrompt {
  // Internal model (not all fields are exposed to clients)
  name: string; // kebab-case identifier (e.g., "create-project")
  title?: string; // Optional human-readable title (internal)
  description: string; // Single-sentence summary for slash command help
  arguments: PromptArgument[];
  systemRules?: string; // Extracted from <rules> ... </rules>
  userTemplate: string; // Markdown body with placeholders
}

interface PromptArgument {
  name: string;
  type?: "string" | "boolean"; // Internal hint; treat all inputs as strings in the API and coerce server-side
  required: boolean;
  description: string;
}
```

### 2. File Structure

```
Source prompt files (authoring):

- prompts/basic/*.md

Server implementation (TypeScript):

src/
├── prompts/
│   ├── PromptManager.ts       # Core prompt lifecycle management (load/cache)
│   ├── PromptParser.ts        # Frontmatter + body parsing, template processing
│   ├── types.ts               # TypeScript interfaces
│   └── registry.ts            # Wire up MCP prompts/list + prompts/get
```

## Prompt File Format

### Frontmatter Schema (lean)

Each markdown file in `prompts/basic/` includes at minimum:

```yaml
---
description: "One-line summary shown in slash command help"
# Optional for authoring convenience; not exposed to clients
title: "Human-friendly title"

# Optional structured arguments; if omitted, server will expose a single
# free-text argument named "input".
args:
  - name: input
    type: string # optional; treated as string externally
    required: false
    description: "Free-text input"
---
```

### Body Placeholders

- `$ARGUMENTS`: replaced with a readable block derived from provided args.
  - If single `input` arg: inject raw input (or a labeled block).
  - If multiple args: render a small “Inputs” section listing `name: value` pairs.
- `${argName}`: simple substitution with the provided value (no complex expressions).
  - For missing optional values, leave the placeholder empty or render a short
    “(not provided)” note — configurable per prompt if desired.

### System Rules Extraction

Content within `<rules> ... </rules>` is extracted and emitted as a separate system message to keep behavioral guidance distinct from user instructions.

Examples of rules (as used in current prompts):

- Never directly access `.trellis/` directory
- Use MCP tools for all operations
- Ask one question at a time with specific options

## MCP Integration

Implement official MCP prompt endpoints using `@modelcontextprotocol/sdk`:

1. prompts/list

- Returns the catalog shown as slash commands in Claude Code.
- Outward schema (omit internal-only fields like `title` and `type`):

```json
{
  "prompts": [
    {
      "name": "create-project",
      "description": "Create a new project by analyzing specs and gathering requirements",
      "arguments": [
        {
          "name": "input",
          "description": "Project specifications or path",
          "required": false
        }
      ]
    }
  ]
}
```

2. prompts/get

- Accepts `name` and `arguments` (all values as strings from the client UI).
- Returns messages suitable for insertion into the chat. Use roles `system` and `user` only. Content must be rich text blocks:

```json
{
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "Never directly access .trellis. Use MCP tools only. Ask one question at a time."
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "# Create Project Trellis Command\n...rendered markdown with injected arguments..."
        }
      ]
    }
  ]
}
```

Notes:

- Perform server-side substitution for `$ARGUMENTS` and `${argName}` before returning.
- Treat booleans as string inputs; coerce internally when useful.
- Do not include non-standard fields (e.g., `autocomplete`, `enum`) in outward argument definitions.

Minimal TypeScript handler scaffold:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server";

server.prompts.list(async () => ({
  prompts: promptManager.list().map((p) => ({
    name: p.name,
    description: p.description,
    arguments: p.arguments.map((a) => ({
      name: a.name,
      description: a.description,
      required: a.required,
    })),
  })),
}));

server.prompts.get(async ({ name, arguments: args }) => {
  const prompt = promptManager.get(name);
  if (!prompt) throw new Error(`Unknown prompt: ${name}`);
  const rendered = promptManager.render(prompt, args || {});
  return { messages: rendered };
});
```

Rendering returns an array like:

```ts
type PromptMessage = {
  role: "system" | "user";
  content: [{ type: "text"; text: string }];
};
```

## Prompt Definitions

### Command Names

Expose prompts as slash commands matching the files in `prompts/basic`:

- create-project
- create-epics
- create-features
- create-tasks
- implement-task

### Argument Schemas (lean, no pickers)

You can embed these as frontmatter `args:` in each Markdown file, or have the server provide defaults if missing.

#### create-project

```yaml
args:
  - name: input
    required: false
    description: "Project specifications or path to spec file"
```

#### create-epics

```yaml
args:
  - name: projectId
    required: false
    description: "Project ID (e.g., P-xxxxx)"
  - name: input
    required: false
    description: "Additional context or instructions"
```

#### create-features

```yaml
args:
  - name: epicId
    required: false
    description: "Epic ID (e.g., E-xxxxx)"
  - name: input
    required: false
    description: "Additional context or instructions"
```

#### create-tasks

```yaml
args:
  - name: featureId
    required: false
    description: "Feature ID (e.g., F-xxxxx)"
  - name: input
    required: false
    description: "Additional context or instructions"
```

#### implement-task

```yaml
args:
  - name: taskId
    required: false
    description: "Task ID (e.g., T-xxxxx)"
  - name: worktree
    required: false
    description: "Worktree path identifier (informational)"
  - name: scope
    required: false
    description: "Scope issue ID (P-/E-/F- prefixed)"
  - name: force
    required: false
    description: "If set to 'true', allow forced claim when taskId provided"
  - name: input
    required: false
    description: "Additional context or instructions"
```

Notes:

- All values arrive as strings from clients; treat booleans like `force` as string inputs and coerce on the server if needed.
- If `args:` is absent in a file, default to a single `input` argument.

## Validation & Errors (MVP)

- On load (startup only, no hot reload):
  - Ensure each prompt has: `name`, `description`, and a non-empty body.
  - Validate `args` names are unique per prompt.
  - Log and skip invalid files; include filename and reason.
- On get:
  - Validate required args are present (non-empty after trim).
  - If missing, return a descriptive error listing required fields.
  - Perform simple type coercion internally (e.g., `force` → boolean) but do not reject string values.

## Non-Goals (now)

- No argument pickers, enums, or dynamic autocomplete.
- No hot reload of prompts. Restart to pick up changes.
- No complex template conditionals; only `$ARGUMENTS` and `${name}` substitutions.
