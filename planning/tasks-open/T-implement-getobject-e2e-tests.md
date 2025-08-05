---
kind: task
id: T-implement-getobject-e2e-tests
title: Implement getObject E2E tests
status: open
priority: high
prerequisites: []
created: "2025-08-05T18:07:19.340878"
updated: "2025-08-05T18:07:19.340878"
schema_version: "1.1"
---

Implement comprehensive E2E tests for the get_object MCP tool.

## Test Location

Create tests in: `src/__tests__/e2e/crud/getObject.e2e.test.ts`

## Test Requirements

- Test retrieving existing objects of all types (project, epic, feature, task)
- Test retrieving objects in complex hierarchies
- Test error scenarios: non-existent objects, malformed IDs
- Verify returned object structure matches expected format
- Test retrieval at different hierarchy levels

## Key Test Cases

1. Retrieve an existing project - verify complete object data
2. Retrieve objects with complex hierarchies (project->epic->feature->task)
3. Error handling for non-existent object IDs
4. Error handling for malformed ID formats
5. Verify object type inference works correctly
6. Test retrieval of objects with various field combinations

Use existing TestEnvironment and McpTestClient utilities. Ensure response parsing handles the "Retrieved object: " prefix correctly.

### Log
