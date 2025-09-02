---
id: T-implement-markdown-prompt
title: Implement markdown prompt file parser with frontmatter support
status: done
priority: high
parent: F-mcp-prompts-implementation
prerequisites:
  - T-create-core-prompt-data
affectedFiles:
  src/prompts/PromptParser.ts: Created comprehensive markdown prompt file parser
    with parsePromptFile() function that reads files, extracts YAML frontmatter,
    processes system rules, validates structure, and returns TrellisPrompt
    objects with robust error handling
  src/prompts/__tests__/PromptParser.test.ts: Created extensive unit test suite
    with 19 test cases covering all parser functionality including valid
    parsing, error conditions, edge cases, and various frontmatter
    configurations with 100% test coverage
log:
  - Successfully implemented comprehensive markdown prompt file parser with
    frontmatter support. Created robust PromptParser.ts with parsePromptFile()
    function that reads markdown files, extracts YAML frontmatter using existing
    yaml dependency, processes system rules from <rules> blocks, validates
    required fields, and returns TrellisPrompt objects. Implemented
    comprehensive error handling with descriptive messages, including validation
    for kebab-case names, unique argument names, and proper argument types.
    Added extensive unit test coverage with 19 test cases covering all
    functionality including edge cases, error conditions, and various
    frontmatter configurations. All quality checks pass with no linting,
    formatting, or TypeScript errors. Parser follows existing codebase patterns
    and integrates seamlessly with TrellisPrompt and PromptArgument interfaces.
schema: v1.0
childrenIds: []
created: 2025-09-02T18:44:37.509Z
updated: 2025-09-02T18:44:37.509Z
---

# Implement Markdown Prompt File Parser with Frontmatter Support

## Context

The MCP prompts system needs to parse markdown files from `prompts/basic/` directory, extracting frontmatter metadata and handling system rules extraction. This parser is the foundation for loading prompt definitions.

## Technical Approach

Create `src/prompts/PromptParser.ts` that:

- Reads markdown files with YAML frontmatter
- Extracts system rules from `<rules>...</rules>` blocks
- Validates required fields (name, description)
- Handles optional arguments schema

## Detailed Implementation Requirements

### Core Parser Functions

Implement the following functions:

- `parsePromptFile(filePath: string): TrellisPrompt` - Parse a single prompt file
- `extractSystemRules(content: string): { rules: string, cleanContent: string }` - Extract and remove `<rules>` blocks
- `validatePromptData(data: any): void` - Validate parsed prompt meets requirements

### File Processing Logic

1. **Read markdown file** using Node.js fs operations
2. **Parse YAML frontmatter** using the existing `yaml` dependency
3. **Extract body content** after frontmatter
4. **Process system rules** by finding and removing `<rules>...</rules>` blocks
5. **Generate prompt name** from filename (kebab-case, without extension)
6. **Validate required fields** and throw descriptive errors for invalid files

### Frontmatter Schema Support

Support the frontmatter format specified in the design:

```yaml
---
description: "One-line summary shown in slash command help"
title: "Human-friendly title" # Optional
args: # Optional, defaults to single 'input' arg
  - name: input
    type: string
    required: false
    description: "Free-text input"
---
```

### Default Argument Handling

If `args` is absent in frontmatter, default to:

```typescript
[{ name: "input", required: false, description: "Free-text input" }];
```

### Error Handling

- Log and skip invalid files with descriptive error messages
- Include filename and specific validation failure reason
- Continue processing other files instead of failing completely
- Validate argument names are unique within each prompt

### File Location

- Create `src/prompts/PromptParser.ts`
- Import and use existing `yaml` dependency from package.json
- Follow existing error handling patterns in codebase

### Acceptance Criteria

- [ ] Parse YAML frontmatter correctly using `yaml` library
- [ ] Extract and remove `<rules>...</rules>` blocks from content
- [ ] Generate kebab-case prompt names from filenames
- [ ] Default to single 'input' argument when args not specified
- [ ] Validate required fields (description) and unique argument names
- [ ] Handle file reading errors gracefully with descriptive messages
- [ ] Unit tests covering valid files, invalid files, and edge cases
- [ ] Integration with existing `yaml` dependency (no new dependencies)

## Dependencies

- Task: Create core prompt data models and TypeScript interfaces

## Out of Scope

- Directory scanning/loading multiple files - handled by PromptManager
- Template rendering/placeholder substitution - handled by separate task
- MCP API integration - handled by registry task

## Security Considerations

- Validate file paths to prevent directory traversal attacks
- Sanitize YAML input to prevent code injection
- Ensure argument name validation prevents conflicts
