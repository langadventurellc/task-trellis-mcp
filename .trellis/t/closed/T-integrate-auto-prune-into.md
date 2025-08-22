---
id: T-integrate-auto-prune-into
title: Integrate auto-prune into server startup sequence
status: done
priority: high
prerequisites:
  - T-add-auto-prune-cli-argument
  - T-modify-pruneclosed-function
affectedFiles:
  src/server.ts: Added startServer function with auto-prune integration logic
    before runServer call. Includes conditional execution (autoPrune > 0),
    proper error handling, and logging using console.warn/error.
  src/__tests__/serverStartup.test.ts:
    Created comprehensive unit test suite with
    9 test cases covering auto-prune disabled/enabled scenarios, error handling
    (Error, non-Error, null), startup continuation, and repository/service
    integration validation.
log:
  - >-
    Successfully integrated auto-prune functionality into server startup
    sequence in src/server.ts. The implementation:


    1. **Added auto-prune startup logic**: Auto-prune runs before the main
    server starts when autoPrune > 0, using existing repository and service
    instances

    2. **Comprehensive error handling**: Server continues startup even if
    auto-prune fails, with clear error logging 

    3. **Proper logging**: Uses console.warn for informational messages and
    console.error for failures, following codebase conventions

    4. **Complete test coverage**: Added 9 unit tests covering disabled/enabled
    scenarios, error handling, and integration validation


    The auto-prune integration executes during server startup only when
    --auto-prune > 0, logs activity clearly, and gracefully handles failures
    without preventing server startup. All quality checks pass and comprehensive
    test coverage validates the implementation.
schema: v1.0
childrenIds: []
created: 2025-08-22T18:23:13.266Z
updated: 2025-08-22T18:23:13.266Z
---

# Integrate auto-prune into server startup sequence

## Context

Add auto-prune execution to the server startup sequence in server.ts. The auto-prune should run once during startup when the autoPrune value is greater than 0, before the main server starts accepting requests.

## Implementation Requirements

### Startup Integration Point

- Add auto-prune execution before `runServer()` call in `src/server.ts:237-245`
- Only execute when `options.autoPrune > 0`
- Use the existing repository and service instances

### Implementation Logic

Add startup code similar to:

```typescript
// Auto-prune closed objects if enabled
if (options.autoPrune > 0) {
  try {
    console.log(
      `Starting auto-prune for objects older than ${options.autoPrune} days...`,
    );
    const repository = getRepository();
    const service = _getService();
    const result = await service.pruneClosed(repository, options.autoPrune);
    console.log(`Auto-prune completed: ${result.content[0].text}`);
  } catch (error) {
    console.error(
      `Auto-prune failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Don't exit - continue starting server even if prune fails
  }
}
```

### Error Handling

- Gracefully handle auto-prune failures without preventing server startup
- Log clear error messages for debugging
- Continue with normal server startup even if auto-prune fails
- Don't crash the server due to auto-prune issues

### Logging Enhancement

- Log when auto-prune starts (with day threshold)
- Log auto-prune completion with summary
- Log auto-prune errors clearly
- Use consistent logging format with existing server logs

## Technical Approach

1. Add auto-prune logic before `runServer()` call
2. Check `options.autoPrune > 0` condition
3. Create repository and service instances using existing functions
4. Call pruneClosed with day-based age parameter
5. Add comprehensive error handling and logging
6. Add unit tests for startup integration

## Acceptance Criteria

- Auto-prune runs during server startup when `--auto-prune > 0`
- Auto-prune does NOT run when `--auto-prune 0` (default)
- Server starts normally after successful auto-prune
- Server starts normally even if auto-prune fails
- Clear logging shows auto-prune activity and results
- No impact on existing server startup functionality
- No impact on normal server operation after startup
- Unit tests validate startup integration logic

## Testing Requirements

Include unit tests in the same implementation:

- Test startup with auto-prune disabled (autoPrune = 0)
- Test startup with auto-prune enabled (autoPrune > 0)
- Test startup behavior when auto-prune succeeds
- Test startup behavior when auto-prune fails
- Test logging output for various scenarios
- Mock repository and service for isolated testing

## Files to Modify

- `src/server.ts` - Add startup integration logic
- Unit test files for server startup functionality

## Dependencies

- **Prerequisite**: T-add-auto-prune-cli-argument (CLI parsing)
- **Prerequisite**: T-modify-pruneclosed-function (prune logic)
- **Uses**: Existing repository and service creation functions

## Security Considerations

- Ensure auto-prune cannot be exploited to cause denial of service
- Handle edge cases where auto-prune might hang or crash
- Validate that startup timing is reasonable even with large datasets
