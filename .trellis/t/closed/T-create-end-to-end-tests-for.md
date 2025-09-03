---
id: T-create-end-to-end-tests-for
title: Create end-to-end tests for GetNext Available Issue tool
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts:
    Created comprehensive E2E test suite with 34 passing test cases covering all
    aspects of the getNextAvailableIssue tool functionality including type
    discovery, priority selection, scope filtering, prerequisite validation,
    status filtering, error scenarios, input validation, and read-only behavior
    verification
log:
  - Successfully created comprehensive end-to-end tests for the GetNext
    Available Issue MCP tool with 34 passing test cases. The test suite covers
    all major functionality including basic issue discovery by type (project,
    epic, feature, task), priority-based selection, scope filtering,
    prerequisite checking, status filtering, error handling scenarios, input
    validation, and read-only behavior verification. All tests follow existing
    E2E patterns and pass quality checks including linting, formatting, and type
    validation.
schema: v1.0
childrenIds: []
created: 2025-09-03T01:22:41.942Z
updated: 2025-09-03T01:22:41.942Z
---

## Overview

Create comprehensive end-to-end tests for the newly implemented GetNext Available Issue MCP tool to validate its core functionality through full workflow testing.

## Context

The GetNext Available Issue tool (`get_next_available_issue`) was recently implemented as part of feature F-get-next-available-issue-mcp. The tool allows discovery of the next available issue of any type (project, epic, feature, task) without claiming it, providing read-only access to availability logic.

**Key Tool Capabilities:**

- Returns highest priority available issue of specified type
- Supports optional scope filtering (e.g., within a specific project)
- Does not modify issue status (read-only operation)
- Uses same availability rules as claim_task (status="open", prerequisites complete)
- Supports all issue types: project, epic, feature, task

**Related Files:**

- Tool definition: `src/tools/getNextAvailableIssueTool.ts`
- Service logic: `src/services/local/getNextAvailableIssue.ts`
- Unit tests: `src/services/local/__tests__/getNextAvailableIssue.test.ts`

## Implementation Requirements

Create a new end-to-end test file following existing patterns observed in the codebase:

**File Location:** `src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts`

**Test Structure Pattern:** Follow the pattern from `claimTask.e2e.test.ts`:

- Use `McpTestClient`, `TestEnvironment`, and utility functions from `../utils`
- Setup/teardown with 30-second timeout for beforeEach
- Organize tests in logical describe blocks
- Use `createObjectFile`, `readObjectFile`, and `createObjectContent` for test data
- Test MCP tool calls with `client.callTool("get_next_available_issue", args)`

## Detailed Test Coverage Requirements

### 1. Basic Issue Type Discovery

Test discovering next available issue for each type:

**Test Cases:**

- Should find highest priority open project when issueType='project'
- Should find highest priority open epic when issueType='epic'
- Should find highest priority open feature when issueType='feature'
- Should find highest priority open task when issueType='task'

**Test Data Setup:**

- Create multiple issues of same type with different priorities (high, medium, low)
- Create some completed/closed issues to verify they're ignored
- Verify tool returns the highest priority open issue

### 2. Priority-Based Selection

Test that tool correctly selects highest priority available issue:

**Test Cases:**

- Should return high priority issue when multiple priorities available
- Should return medium priority when only medium/low available
- Should return low priority when only low priority available
- Should handle multiple issues of same priority consistently

### 3. Scope Filtering

Test scope parameter functionality:

**Test Cases:**

- Should filter issues within specified project scope (scope='P-project-id')
- Should filter issues within specified epic scope for features/tasks
- Should return "no available issues" when scope has no matching issues
- Should ignore scope parameter when not provided (search all)

**Test Data Setup:**

- Create issues in different projects/epics
- Test with project-level scope filtering
- Test with epic-level scope filtering

### 4. Prerequisite Checking

Test that only issues with completed prerequisites are returned:

**Test Cases:**

- Should find issue with no prerequisites
- Should find issue with completed prerequisites
- Should skip issue with incomplete prerequisites
- Should handle complex prerequisite chains correctly

**Test Data Setup:**

- Create prerequisite issues in various states (done, open, in-progress)
- Create dependent issues with single and multiple prerequisites
- Verify tool skips blocked issues and finds available ones

### 5. Issue Status Filtering

Test that only "open" status issues are considered:

**Test Cases:**

- Should find issues with status="open"
- Should skip issues with status="in-progress"
- Should skip issues with status="done"
- Should skip issues with status="draft"

### 6. Empty Results Handling

Test behavior when no available issues match criteria:

**Test Cases:**

- Should return appropriate error when no issues of specified type exist
- Should return appropriate error when all issues are unavailable (wrong status/incomplete prerequisites)
- Should return appropriate error when scope has no matching issues
- Should return appropriate error when repository is empty

**Expected Error Messages:**

- Response should contain "No available issues found matching criteria"
- Tool should not throw uncaught exceptions

### 7. Input Validation

Test parameter validation:

**Test Cases:**

- Should reject invalid issueType values (not project/epic/feature/task)
- Should handle missing required issueType parameter
- Should accept valid scope parameter formats
- Should handle invalid scope parameter gracefully

**Expected Error Responses:**

- Invalid issueType should return "Invalid issueType" message with valid options
- Tool should provide clear validation error messages

### 8. Read-Only Behavior Verification

Test that tool does not modify any issue state:

**Test Cases:**

- Should not change status of returned issue
- Should not modify any issue properties
- Should not claim or lock issues
- Should be callable multiple times with same results (when no changes occur)

**Verification Method:**

- Read issue files before and after tool calls
- Verify YAML frontmatter remains unchanged
- Test repeated calls return same issue

## Technical Implementation Details

### Test Setup Pattern

```typescript
describe("E2E Workflow - getNextAvailableIssue", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
    await client.connect();
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  // Test cases here...
});
```

### Utility Integration

- Use `createObjectFile()` to create test issues in proper directory structure
- Use `createObjectContent()` to generate valid YAML frontmatter
- Use `readObjectFile()` to verify issues remain unchanged
- Use standard ObjectData interface for type safety

### Error Assertion Pattern

```typescript
const result = await client.callTool("get_next_available_issue", {
  issueType: "invalid",
});
expect(result.content[0].text).toContain("Invalid issueType");
```

### Success Assertion Pattern

```typescript
const result = await client.callTool("get_next_available_issue", {
  issueType: "task",
});
expect(result.content[0].text).toContain("T-high-priority-task");
// Verify it's a complete issue object response
expect(result.content[0].text).toContain("priority");
expect(result.content[0].text).toContain("status");
```

## Quality Requirements

- **Coverage**: Test all major code paths and edge cases identified
- **Reliability**: Tests should pass consistently without flakiness
- **Performance**: Each test should complete within reasonable time (<5 seconds per test)
- **Maintainability**: Follow established patterns and naming conventions
- **Clear Assertions**: Each test should verify specific behavior with descriptive expect statements

## Acceptance Criteria

✅ **Test File Created**: New file at `src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts`

✅ **Basic Functionality**: Tests verify tool finds correct issue for each type (project, epic, feature, task)

✅ **Priority Selection**: Tests verify highest priority issue selection with mixed priority scenarios

✅ **Scope Filtering**: Tests verify scope parameter works for project and epic level filtering

✅ **Prerequisite Logic**: Tests verify only issues with completed prerequisites are returned

✅ **Status Filtering**: Tests verify only "open" status issues are considered available

✅ **Error Handling**: Tests verify appropriate error messages for no available issues and invalid inputs

✅ **Read-Only Verification**: Tests verify tool does not modify issue state or properties

✅ **Test Quality**: All tests use proper setup/teardown, follow existing patterns, and have clear assertions

✅ **Integration**: Tests pass when run with `npm test` and integrate properly with existing test suite

## Out of Scope

- Performance testing with large datasets (not requested)
- Comprehensive load testing (not requested)
- Integration with external systems testing
- UI/frontend testing (this is a backend MCP tool)
- Database-specific testing beyond the existing repository abstraction
- Authentication/authorization testing (uses existing patterns)
- Backwards compatibility testing with older versions
