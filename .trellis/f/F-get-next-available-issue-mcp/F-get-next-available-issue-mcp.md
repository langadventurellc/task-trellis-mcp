---
id: F-get-next-available-issue-mcp
title: Get Next Available Issue MCP Tool
status: in-progress
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/services/local/getNextAvailableIssue.ts: Created new service function that
    finds the next available issue without claiming it, supporting optional
    scope and issueType filtering with priority-based sorting
  src/services/local/__tests__/getNextAvailableIssue.test.ts:
    Added comprehensive
    unit test suite covering basic functionality, type filtering (single and
    array), scope filtering, priority sorting, error scenarios, repository
    integration, and utility integration with 100% coverage
log: []
schema: v1.0
childrenIds:
  - T-create-comprehensive-end-to
  - T-create-get-next-available
  - T-create-getnextavailableissue
  - T-register-get-next-available
created: 2025-09-02T23:30:31.575Z
updated: 2025-09-02T23:30:31.575Z
---

# Get Next Available Issue MCP Tool

## Overview

Implement a new MCP tool `get_next_available_issue` that allows AI agents and users to discover the next available issue of any type (project, epic, feature, task) without claiming it. This provides read-only access to the same availability logic used by the existing `claim_task` tool.

## Purpose

- Enable discovery of available work items without modifying their status
- Support all issue types, not just tasks
- Provide filtering capabilities by scope and issue type
- Maintain consistency with existing `claim_task` availability rules

## Key Components

### 1. MCP Tool Definition (`src/tools/getNextAvailableIssueTool.ts`)

- Tool name: `get_next_available_issue`
- Input schema with optional `scope` and `issueType` parameters
- Handler function that delegates to service layer
- Comprehensive documentation following existing patterns

### 2. Service Implementation (`src/services/local/getNextAvailableIssue.ts`)

- Core logic function `getNextAvailableIssue(repository, scope, issueType)`
- Reuse existing utilities: `filterUnavailableObjects`, `sortTrellisObjects`
- Support for optional issue type filtering
- Read-only operation (no status changes)

### 3. Integration Points

- Export from `src/tools/index.ts`
- Register with MCP server in `src/server.ts`
- Leverage existing prerequisite checking utilities

## Detailed Acceptance Criteria

### Functional Requirements

- **Issue Discovery**: Tool must return the highest priority available issue matching criteria
- **Type Filtering**: When `issueType` specified, only return issues of that type (project, epic, feature, task)
- **Scope Filtering**: When `scope` specified, only return issues within that scope boundary
- **Availability Logic**: Apply same rules as `claim_task`: status must be "open" and all prerequisites complete
- **Hierarchical Prerequisites**: Check both direct prerequisites and parent hierarchy prerequisites
- **Priority Ordering**: Return highest priority available issue (HIGH > MEDIUM > LOW)
- **No State Changes**: Tool must not modify issue status or any other properties
- **Empty Results**: Return clear error message when no available issues found

### Input Validation

- `scope` parameter: Optional string, validate format matches existing scope patterns
- `issueType` parameter: Optional enum ["project", "epic", "feature", "task"]
- Invalid parameters should return descriptive error messages

### Output Format

- Return complete TrellisObject for the selected issue
- Include all standard fields: id, type, title, status, priority, parent, prerequisites, etc.
- Maintain consistency with existing tool response formats

### Error Handling

- **No Available Issues**: "No available issues found matching criteria"
- **Invalid Issue Type**: "Invalid issue type specified. Must be one of: project, epic, feature, task"
- **Repository Errors**: Gracefully handle and propagate repository access errors
- **Prerequisite Check Failures**: Handle circular dependencies and missing prerequisite objects

### Performance Requirements

- Response time < 500ms for typical repositories (< 1000 issues)
- Memory efficient filtering and sorting operations
- Minimal database/filesystem access through repository abstraction

## Implementation Guidance

### Reuse Existing Utilities

- `filterUnavailableObjects()` - Core availability filtering logic
- `sortTrellisObjects()` - Priority-based sorting
- `checkHierarchicalPrerequisitesComplete()` - Prerequisite validation
- `isOpen()` - Status validation (ensure status allows selection)

### Service Layer Pattern

Follow the established pattern from `claimTask.ts`:

1. Parameter validation and defaults
2. Repository query with filters
3. Apply availability filtering
4. Sort by priority
5. Return first result or error

### Issue Type Filtering

Extend the repository query logic to support optional type filtering:

```typescript
const objects = await repository.getObjects(
  false, // includeClosed
  scope,
  issueType || undefined, // Use undefined to get all types
);
```

### Testing Strategy

- **Unit Tests**: Test service logic in isolation with mocked repository
- **Integration Tests**: Test full tool workflow with real repository
- **Edge Cases**: Empty repositories, circular dependencies, missing prerequisites
- **Parameter Validation**: Invalid inputs, boundary conditions

## Security Considerations

- **Read-Only Access**: Ensure no state modifications occur
- **Input Sanitization**: Validate all input parameters
- **Repository Access**: Use existing repository abstraction security
- **Error Information**: Don't expose sensitive internal details in error messages

## Dependencies

- No external dependencies on other features
- Leverages existing utility functions and models
- Compatible with current MCP server architecture

## Testing Requirements

### Unit Tests (`src/tools/__tests__/getNextAvailableIssueTool.test.ts`)

- Tool handler parameter validation
- Service delegation and response handling
- Error propagation from service layer

### Service Tests (`src/services/local/__tests__/getNextAvailableIssue.test.ts`)

- Find next available issue by priority
- Filter by issue type correctly
- Filter by scope correctly
- Handle no available issues gracefully
- Verify prerequisite checking integration
- Verify hierarchical prerequisite checking

### End-to-End Tests (`src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts`)

- Full MCP tool workflow with real repository
- Multi-type issue scenarios with complex prerequisites
- Scope filtering across project hierarchies
- Performance with larger data sets

### Test Data Requirements

- Mix of issue types at different hierarchy levels
- Issues with various prerequisite configurations
- Issues in different scopes (projects/epics)
- Issues with different priority levels and statuses

## Quality Requirements

- Pass all ESLint rules and TypeScript checks
- 100% test coverage for new code
- Follow Clean Code Charter principles
- Maintain consistency with existing codebase patterns
- Comprehensive error handling and logging

## Performance Benchmarks

- Handle repositories with 1000+ issues efficiently
- Response time under 500ms for typical queries
- Memory usage proportional to result set, not total repository size

## Documentation Requirements

- JSDoc comments for all public functions
- Clear parameter descriptions and examples
- Error condition documentation
- Usage examples in tool description

## Implementation Tasks Breakdown

This feature should decompose into approximately 12-15 tasks:

1. **Tool Definition**: Create MCP tool schema and handler
2. **Service Implementation**: Core service logic
3. **Repository Integration**: Extend query capabilities if needed
4. **Parameter Validation**: Input validation and error handling
5. **Tool Registration**: Update exports and server registration
6. **Unit Tests - Tool**: Test tool handler and validation
7. **Unit Tests - Service**: Test service logic thoroughly
8. **End-to-End Tests**: Full workflow testing
9. **Error Handling**: Comprehensive error scenarios
10. **Documentation**: JSDoc and usage examples
11. **Performance Testing**: Benchmark with large datasets
12. **Code Review**: Quality checks and refactoring
13. **Integration Validation**: Ensure compatibility with existing tools
14. **Final Testing**: Complete test suite execution
