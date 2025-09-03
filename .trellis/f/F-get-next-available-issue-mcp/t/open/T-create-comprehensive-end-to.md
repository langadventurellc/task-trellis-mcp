---
id: T-create-comprehensive-end-to
title: Create comprehensive end-to-end tests for get_next_available_issue workflow
status: open
priority: medium
parent: F-get-next-available-issue-mcp
prerequisites:
  - T-register-get-next-available
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-03T00:37:17.340Z
updated: 2025-09-03T00:37:17.340Z
---

Implement comprehensive end-to-end tests to validate the complete get_next_available_issue workflow.

**Implementation Location**: `src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts`

**Test Coverage Areas**:

1. **Basic Workflow**:
   - Find next available issue without parameters
   - Find with scope filtering
   - Find with type filtering (single and array)
   - Combined scope and type filtering

2. **Priority and Availability Logic**:
   - Return highest priority available issue
   - Skip unavailable issues (wrong status, incomplete prerequisites)
   - Handle hierarchical prerequisites correctly
   - Test with mixed issue types and priorities

3. **Edge Cases**:
   - No available issues matching criteria
   - Repository with only closed/completed issues
   - Complex prerequisite chains
   - Multiple scopes and hierarchies

4. **Error Scenarios**:
   - Invalid issue types
   - Repository access errors
   - Malformed input parameters

5. **Performance Validation**:
   - Response time under 500ms for 100+ issue repository
   - Memory usage validation with larger datasets

**Test Data Requirements**:

- Create comprehensive test repository with:
  - Mix of issue types (project, epic, feature, task)
  - Various priority levels (high, medium, low)
  - Different statuses (draft, open, in-progress, done)
  - Complex prerequisite relationships
  - Multiple project scopes
  - Hierarchical parent-child relationships

**Technical Approach**:

- Use real LocalRepository with temporary test directories
- Create realistic test data scenarios
- Follow patterns from existing e2e tests
- Test full MCP tool invocation workflow
- Validate complete request/response cycle

**Acceptance Criteria**:

- All workflow scenarios covered with realistic data
- Performance benchmarks met (< 500ms response time)
- Error handling validated end-to-end
- Integration with real repository confirmed
- No side effects on repository state (read-only verification)
- Tests pass consistently and are deterministic

**Dependencies**:

- Real repository implementation
- Test data creation utilities
- MCP server test harness
