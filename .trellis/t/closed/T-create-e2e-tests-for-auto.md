---
id: T-create-e2e-tests-for-auto
title: Create E2E tests for auto-prune feature
status: done
priority: medium
prerequisites:
  - T-integrate-auto-prune-into
affectedFiles:
  src/__tests__/e2e/autoPrune.e2e.test.ts: Created comprehensive E2E test suite
    for auto-prune functionality with 13 test cases covering all requirements
    including CLI argument handling, hierarchical validation, server startup
    integration, and complex workflow scenarios
log:
  - Successfully created comprehensive E2E tests for auto-prune feature covering
    CLI integration, basic functionality, hierarchical validation, server
    startup integration, complex workflows, and performance edge cases. All
    tests pass and verify that auto-prune correctly deletes old closed objects
    while respecting hierarchical constraints (not deleting objects with open
    children).
schema: v1.0
childrenIds: []
created: 2025-08-22T18:24:31.313Z
updated: 2025-08-22T18:24:31.313Z
---

# Create E2E tests for auto-prune feature

## Context

Create end-to-end test suite for auto-prune functionality including CLI argument handling, server startup integration, and complete workflow testing. These tests will validate the entire auto-prune feature from command line to final object deletion.

## Implementation Requirements

### Test File Creation

Create new E2E test file:

- `src/__tests__/e2e/autoPrune.e2e.test.ts`
- Follow existing E2E test patterns from `src/__tests__/e2e/`
- Use `TestEnvironment` and `McpTestClient` utilities
- Follow existing setup/teardown patterns

### Test Scenarios

#### Basic Auto-Prune Functionality

- Create closed objects with various ages (1 day old, 7 days old, 30 days old)
- Start server with `--auto-prune 7`
- Verify objects older than 7 days are deleted
- Verify objects newer than 7 days remain

#### Hierarchical Validation Tests

- **Open Child Prevention**: Create closed parent with open child, verify parent not deleted
- **Closed Child Allowing**: Create closed parent with closed child, verify both deleted
- **Multi-level Hierarchy**: Create closed grandparent → closed parent → open child, verify neither grandparent nor parent deleted
- **Mixed Scenarios**: Multiple objects with different child states, verify only safe objects deleted

#### CLI Integration Tests

- **Disabled Auto-Prune**: Start with `--auto-prune 0`, verify no objects deleted
- **Invalid Values**: Test server behavior with invalid CLI arguments
- **Edge Cases**: Test with very large day values, ensure reasonable behavior

#### Server Startup Integration

- Verify auto-prune runs before server accepts requests
- Test server startup timing with auto-prune enabled
- Verify server starts normally even if auto-prune fails
- Test logging output during startup sequence

#### Complete Workflow Tests

- Create complex object hierarchy with mixed statuses and ages
- Run auto-prune with specific threshold
- Verify exact set of expected objects deleted
- Verify remaining objects maintain proper relationships
- Test multiple auto-prune runs (idempotent behavior)

### Test Data Setup

Create realistic test scenarios:

- Projects with epics, features, and tasks
- Objects with various creation/update timestamps
- Complex parent-child relationships
- Mixed open/closed status combinations
- Prerequisites and dependencies between objects

## Technical Approach

1. Use existing E2E test infrastructure and patterns
2. Create helper functions for generating test object hierarchies
3. Use date manipulation to create objects with specific ages
4. Use McpTestClient to interact with server via MCP tools
5. Verify object deletion by querying repository after auto-prune
6. Test both successful and error scenarios

## Acceptance Criteria

- All auto-prune CLI scenarios work end-to-end
- Hierarchical validation prevents incorrect deletions
- Server startup integration works properly
- Test execution is reliable and deterministic
- Tests clean up properly without leaving test data
- Test output clearly shows what was tested
- Tests run in reasonable time (< 30 seconds total)
- No interference with other E2E tests

## Testing Requirements

Create E2E tests covering:

- **CLI Integration**: Various auto-prune argument values
- **Basic Pruning**: Age-based deletion with simple objects
- **Hierarchical Protection**: Parent-child relationship validation
- **Complex Scenarios**: Mixed object hierarchies and states
- **Server Integration**: Startup sequence and error handling
- **Performance**: Reasonable execution time with realistic data volumes

## Files to Create

- `src/__tests__/e2e/autoPrune.e2e.test.ts`
- Helper utilities if needed (following existing patterns)

## Dependencies

- **Prerequisite**: T-create-comprehensive-unit (unit tests completed)
- **Uses**: All implemented auto-prune functionality
- **Uses**: Existing E2E test infrastructure

## Security Considerations

- Test that auto-prune cannot delete objects it shouldn't
- Verify hierarchical validation is thorough and cannot be bypassed
- Test with edge cases that might cause unexpected behavior
