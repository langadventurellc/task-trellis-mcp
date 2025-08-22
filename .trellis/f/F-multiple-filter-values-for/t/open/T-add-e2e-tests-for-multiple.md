---
id: T-add-e2e-tests-for-multiple
title: Add E2E Tests for Multiple Value Filtering
status: open
priority: medium
parent: F-multiple-filter-values-for
prerequisites:
  - T-update-tool-handler-for-array
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T04:26:32.219Z
updated: 2025-08-22T04:26:32.219Z
---

# Add E2E Tests for Multiple Value Filtering

## Context

This task adds comprehensive end-to-end tests to validate that the multiple value filtering feature works correctly from the MCP tool interface, ensuring all layers work together properly.

## Specific Implementation Requirements

### 1. Add Multiple Value Filter Tests (`src/__tests__/e2e/crud/listObjects.e2e.test.ts`)

- Add new test suites for multiple value filtering scenarios
- Test multiple type filtering: `{ type: ["feature", "task"] }`
- Test multiple status filtering: `{ status: ["open", "in-progress"] }`
- Test multiple priority filtering: `{ priority: ["high", "medium"] }`
- Test combined multiple filters across different parameter types

### 2. Optional Type Parameter Tests

- Test querying all object types: `{ status: "open" }` (no type parameter)
- Test that all object types are returned when type is omitted
- Verify filtering still works correctly on other parameters when type is optional

### 3. Mixed Single/Multiple Value Tests

- Test combinations like: `{ type: "task", status: ["open", "in-progress"], priority: "high" }`
- Verify mixed usage works correctly
- Test that single and multiple values can be used together

### 4. Backward Compatibility Validation

- Ensure all existing single value test cases continue to pass
- Add explicit backward compatibility tests
- Verify existing tool behavior is preserved

### 5. Error Handling E2E Tests

- Test invalid array values: `{ type: ["invalid-type"] }`
- Test mixed valid/invalid values: `{ type: ["task", "invalid"] }`
- Test empty arrays: `{ type: [] }`
- Verify error messages are clear and helpful

## Technical Approach

1. Add new describe blocks for multiple value scenarios
2. Use existing test utilities (`createObjectFile`, `extractObjectIds`)
3. Create test data with varied type/status/priority combinations
4. Verify correct filtering using object ID extraction
5. Test error scenarios and validate error messages

## Test Data Setup

Create diverse test objects for comprehensive filtering validation:

```typescript
// Projects with different priorities
{ id: "P-high-priority", type: "project", priority: "high" }
{ id: "P-medium-priority", type: "project", priority: "medium" }

// Tasks with different statuses
{ id: "T-open-task", type: "task", status: "open" }
{ id: "T-progress-task", type: "task", status: "in-progress" }

// Features with different combinations
{ id: "F-high-open", type: "feature", status: "open", priority: "high" }
```

## Acceptance Criteria

- ✅ Multiple type filtering works correctly via MCP tool interface
- ✅ Multiple status filtering works correctly via MCP tool interface
- ✅ Multiple priority filtering works correctly via MCP tool interface
- ✅ Optional type parameter allows querying all object types
- ✅ Combined multiple filters work correctly (AND logic between types)
- ✅ Mixed single/multiple value usage works correctly
- ✅ Backward compatibility verified - all existing behavior preserved
- ✅ Error handling works correctly for invalid array inputs
- ✅ Performance acceptable with multiple filter values
- ✅ All test scenarios pass consistently

## Testing Requirements

Add comprehensive E2E test coverage:

- **Multiple Value Scenarios**: Test arrays for each filter type
- **Optional Type Scenarios**: Test behavior when type parameter omitted
- **Combined Filter Scenarios**: Test multiple filters with arrays
- **Backward Compatibility**: Verify existing single value behavior
- **Error Scenarios**: Test invalid inputs and error messages
- **Performance Scenarios**: Test with larger datasets and multiple filter values

## Dependencies

- T-update-tool-handler-for-array (all implementation must be complete)

## Files to Modify

- `src/__tests__/e2e/crud/listObjects.e2e.test.ts`

## Success Metrics

- All new E2E tests pass consistently
- All existing E2E tests continue to pass (backward compatibility)
- Test coverage includes all major multiple value scenarios
- Error handling tests validate clear, helpful error messages
