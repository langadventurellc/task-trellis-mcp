---
kind: task
id: T-implement-createobject-e2e-tests
title: Implement createObject E2E tests
status: open
priority: high
prerequisites: []
created: "2025-08-05T18:07:11.409748"
updated: "2025-08-05T18:07:11.409748"
schema_version: "1.1"
---

Implement comprehensive E2E tests for the create_object MCP tool.

## Test Location

Create tests in: `src/__tests__/e2e/crud/createObject.e2e.test.ts`

## Test Requirements

- Test creating projects with minimal and full parameters
- Test creating epics under projects (hierarchy validation)
- Test creating features under epics and standalone features
- Test creating tasks under features and standalone tasks
- Test task prerequisites functionality
- Test error scenarios: invalid object types, missing parents, invalid parent IDs
- Verify file creation in correct directory structure
- Verify YAML front-matter structure and content

## Key Test Cases

1. Create project with minimal parameters - verify file structure
2. Create project with all optional fields
3. Create epic under project - verify hierarchy
4. Fail to create epic without parent
5. Create feature under epic and standalone
6. Create task with prerequisites
7. Error handling for invalid types and non-existent parents

Use existing TestEnvironment and McpTestClient utilities. Follow the pattern from existing E2E infrastructure tests.

### Log
