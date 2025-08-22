---
id: T-add-auto-prune-cli-argument
title: Add --auto-prune CLI argument parsing with validation
status: open
priority: high
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T18:21:58.984Z
updated: 2025-08-22T18:21:58.984Z
---

# Add --auto-prune CLI argument parsing with validation

## Context

Implement command line argument parsing for the new `--auto-prune` feature that will automatically delete closed objects older than a specified number of days during server startup.

## Implementation Requirements

### CLI Argument Definition

- Add `--auto-prune <days>` option to Commander.js configuration in `src/server.ts:44-49`
- Set default value to `"0"` (disabled)
- Use proper type conversion to ensure integer values
- Add descriptive help text: "Auto-prune closed objects older than N days (0=disabled)"

### Interface Updates

- Update `CliOptions` interface in `src/server.ts:53-57` to include:
  ```typescript
  autoPrune: number;
  ```

### Validation Logic

- Add validation to ensure `autoPrune` is non-negative integer
- Convert string input to number with proper error handling
- Reject negative values with clear error message
- Handle non-numeric input gracefully

### Integration Points

- Ensure the parsed value is accessible in `options` object
- Follow existing pattern used by other CLI options
- Maintain compatibility with existing argument structure

## Technical Approach

1. Add the new option to the Commander.js program configuration
2. Update the CliOptions TypeScript interface
3. Add input validation logic after `program.parse()`
4. Include proper error handling for invalid inputs
5. Add unit tests for argument parsing and validation

## Acceptance Criteria

- `--auto-prune 7` sets autoPrune to 7
- `--auto-prune 0` sets autoPrune to 0 (disabled)
- `--auto-prune -1` shows error and exits
- `--auto-prune abc` shows error and exits
- Default value is 0 when option not specified
- Help text clearly explains the option behavior
- All existing CLI functionality remains unchanged
- Unit tests validate all scenarios including edge cases

## Testing Requirements

Include unit tests in the same implementation:

- Test valid numeric inputs (0, 1, 30, 365)
- Test invalid inputs (negative numbers, non-numeric strings)
- Test default behavior when option omitted
- Test help text generation
- Test integration with existing CLI options

## Files to Modify

- `src/server.ts` - Add CLI option and validation logic
- Create or update relevant test files for CLI argument testing

## Dependencies

None - this is a foundational task that other auto-prune tasks will depend on.

## Security Considerations

- Validate input to prevent injection or unexpected behavior
- Ensure numeric conversion is safe and predictable
- Handle edge cases like very large numbers appropriately
