---
id: T-add-e2e-tests-for-hierarchical
title: Add E2E tests for hierarchical prerequisites via MCP tools
status: open
priority: medium
prerequisites:
  - T-create-integration-tests-for
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T05:32:02.309Z
updated: 2025-08-22T05:32:02.309Z
---

## Context

We need end-to-end tests that verify hierarchical prerequisite checking works correctly through the MCP server interface, ensuring the feature functions properly when accessed via the tool handlers that external clients will use.

## Current E2E Test Location

`/src/__tests__/e2e/`

## Implementation Requirements

Create E2E tests that:

1. **Test through MCP tool handlers** (not direct function calls)
2. **Verify real file system operations** with the local repository
3. **Test the complete user workflow** from creating hierarchies to claiming tasks
4. **Ensure proper error responses** through the MCP interface

## Test Scenarios

### 1. Complete Workflow Test

```typescript
describe("Hierarchical Prerequisites E2E", () => {
  test("should prevent claiming task when parent has incomplete prerequisites", async () => {
    // 1. Create Epic A
    // 2. Create Epic B with prerequisite on Epic A
    // 3. Create Feature under Epic B
    // 4. Create Task under Feature
    // 5. Attempt to claim Task - should fail
    // 6. Complete Epic A
    // 7. Claim Task - should succeed
  });
});
```

### 2. List Objects Filtering

```typescript
test("should filter objects correctly with hierarchical prerequisites", async () => {
  // Create complex hierarchy
  // Call list_objects tool
  // Verify only claimable tasks are returned
});
```

### 3. Error Message Validation

```typescript
test("should return appropriate error messages for blocked tasks", async () => {
  // Setup hierarchy with blocked task
  // Attempt to claim specific task
  // Verify error message indicates parent prerequisites
});
```

### 4. Force Flag Override

```typescript
test("should allow force claiming despite parent prerequisites", async () => {
  // Setup blocked task
  // Claim with force=true
  // Verify success
});
```

## Implementation Approach

1. Create test file: `/src/__tests__/e2e/hierarchicalPrerequisites.test.ts`

2. Use the tool handler functions directly:

   ```typescript
   import { handleCreateObject } from "../../tools/handlers/createObject";
   import { handleClaimTask } from "../../tools/handlers/claimTask";
   import { handleListObjects } from "../../tools/handlers/listObjects";
   ```

3. Set up test environment:
   - Create temporary test directory
   - Initialize repository with test data
   - Clean up after each test

4. Test the actual MCP response format:
   ```typescript
   const response = await handleClaimTask(params);
   expect(response.content[0].text).toContain(
     "parent hierarchy has incomplete prerequisites",
   );
   ```

## Acceptance Criteria

- [ ] Tests execute through MCP tool handlers (not direct functions)
- [ ] Tests use real file system (temp directory)
- [ ] All workflow scenarios pass
- [ ] Error responses match expected MCP format
- [ ] Tests clean up all created test data
- [ ] Tests run in isolation (can run in parallel)
- [ ] Performance is acceptable (< 5 seconds per test)

## Testing Requirements

- Use beforeEach/afterEach for proper test isolation
- Create helper functions for common hierarchy setup
- Verify both successful and failure cases
- Test with realistic data structures
- Include timing assertions for performance

## Files to Create/Modify

- Create: `/src/__tests__/e2e/hierarchicalPrerequisites.test.ts`
- May need to update test utilities for hierarchy creation

## Notes

- These tests will be slower than unit tests due to file I/O
- Ensure temp directory cleanup even if tests fail
- Consider using test.each for parameterized scenarios
