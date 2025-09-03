---
id: T-add-prompt-package-cli
title: Add --prompt-package CLI argument with dynamic prompt loading
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/server.ts:
    Added --prompt-package CLI option with validation and conditional
    prompt registration logic
  src/prompts/registry.ts:
    Updated registerPromptHandlers to accept promptPackage
    parameter with enhanced logging
  src/prompts/PromptsRegistry.ts: Modified constructor to accept and pass
    promptPackage parameter to PromptManager
  src/prompts/PromptManager.ts: Added promptPackage constructor parameter with
    dynamic path resolution and enhanced error messages
  src/prompts/__tests__/PromptManager.test.ts: Added comprehensive test coverage
    for promptPackage functionality including path validation and message
    verification
log:
  - 'Successfully implemented --prompt-package CLI argument with dynamic prompt
    loading functionality. Added CLI argument parsing with validation for three
    package options: "none" (disables prompts), "basic" (default, maintains
    current behavior), and "basic-claude" (loads from alternate package).
    Updated entire prompt system to support package-based loading including
    PromptManager, PromptsRegistry, and registry integration. Added
    comprehensive unit tests covering new constructor parameters, path
    validation, and error message formatting. All quality checks pass and manual
    testing confirms correct behavior for all package options including
    validation, conditional registration, and appropriate logging messages.'
schema: v1.0
childrenIds: []
created: 2025-09-03T02:32:41.880Z
updated: 2025-09-03T02:32:41.880Z
---

# Add --prompt-package CLI argument with dynamic prompt loading

## Context

The MCP server currently loads prompts from a hardcoded path (`resources/basic/prompts`). We need to add a new CLI argument `--prompt-package` that allows users to select different prompt packages or disable prompt loading entirely.

## Current Implementation

- CLI arguments are defined in `src/server.ts` using Commander.js (lines 42-57)
- `CliOptions` interface defines available options (lines 61-66)
- Prompt registration happens in `registerPromptHandlers()` in `src/prompts/registry.ts`
- `PromptManager.load()` hardcodes the path to `resources/basic/prompts` (lines 25-31)

## Technical Requirements

### 1. CLI Argument Definition

Add new CLI option to `src/server.ts`:

- Argument name: `--prompt-package <package>`
- Description: "Prompt package to load (none, basic, basic-claude)"
- Default value: "basic"
- Valid values: "none", "basic", "basic-claude"

### 2. Interface Updates

Update `CliOptions` interface in `src/server.ts` to include:

```typescript
promptPackage?: string;
```

### 3. Argument Validation

Add validation after line 68 in `src/server.ts` to ensure only valid values are accepted:

- Valid values: "none", "basic", "basic-claude"
- Exit with error message for invalid values

### 4. Conditional Prompt Registration

Modify prompt registration logic in `src/server.ts` `runServer()` function:

- If `promptPackage` is "none": Skip calling `registerPromptHandlers()`
- Otherwise: Pass the package name to the prompt system

### 5. Dynamic Path Loading

Update `PromptManager.load()` method in `src/prompts/PromptManager.ts`:

- Accept optional package parameter
- Build dynamic path based on package: `resources/{package}/prompts`
- For "none": Skip loading entirely (method should handle gracefully)

### 6. Registry Integration

Update `registerPromptHandlers()` in `src/prompts/registry.ts`:

- Accept optional package parameter
- Pass package to `PromptManager` during initialization

## Expected Behavior

### Package: "none"

- No prompts are registered
- MCP server runs without prompt handlers
- Console should log: "Prompts disabled via --prompt-package none"

### Package: "basic" (default)

- Loads prompts from `dist/resources/basic/prompts`
- Current behavior maintained
- Console should log: "Loading prompts from package: basic"

### Package: "basic-claude"

- Loads prompts from `dist/resources/basic-claude/prompts`
- Console should log: "Loading prompts from package: basic-claude"

## Implementation Details

### File Modifications Required:

1. `src/server.ts` - Add CLI option, validation, and conditional registration
2. `src/prompts/PromptManager.ts` - Add package parameter to load() method
3. `src/prompts/registry.ts` - Add package parameter to registerPromptHandlers()

### Path Resolution:

- Base path: `path.join(__dirname, "..", "resources", packageName, "prompts")`
- Use existing directory existence check in `checkDirectoryExists()`

## Acceptance Criteria

✅ **CLI Argument**: `--prompt-package` accepts "none", "basic", "basic-claude"  
✅ **Default Behavior**: When argument omitted, defaults to "basic"  
✅ **Validation**: Invalid values show error and exit  
✅ **None Mode**: `--prompt-package none` disables all prompt registration  
✅ **Dynamic Loading**: Package name determines prompt directory path  
✅ **Error Handling**: Graceful handling when prompt directories don't exist  
✅ **Logging**: Clear console messages indicating chosen package and loading status  
✅ **Unit Tests**: Add tests for new CLI validation and PromptManager package loading  
✅ **Backwards Compatibility**: Existing behavior unchanged when no argument provided

## Testing Requirements

Add unit tests for:

1. CLI argument validation (valid/invalid values)
2. `PromptManager.load()` with different package parameters
3. Conditional prompt registration based on package setting
4. Error handling for non-existent package directories

## Out of Scope

- Creating new prompt packages (basic-claude directory structure)
- Integration tests with actual MCP client
- Performance optimization for prompt loading
- Migration of existing prompt files between packages
