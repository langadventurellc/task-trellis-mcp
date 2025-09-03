---
id: T-create-getnextavailableissue
title: Create getNextAvailableIssue service function with core logic and unit tests
status: done
priority: high
parent: F-get-next-available-issue-mcp
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
log:
  - Successfully implemented getNextAvailableIssue service function with
    comprehensive unit tests. The function provides read-only discovery of the
    next available issue matching specified criteria, supporting all
    TrellisObjectType values (project, epic, feature, task) with optional scope
    and type filtering. Implementation follows the existing claimTask pattern
    using filterUnavailableObjects and sortTrellisObjects utilities. All quality
    checks passed and comprehensive unit test coverage achieved with 100% test
    success rate.
schema: v1.0
childrenIds: []
created: 2025-09-03T00:36:28.906Z
updated: 2025-09-03T00:36:28.906Z
---

Implement the core service function for finding the next available issue without claiming it.

**Implementation Location**: `src/services/local/getNextAvailableIssue.ts`

**Technical Approach**:

- Create function signature: `getNextAvailableIssue(repository: Repository, scope?: string, issueType?: TrellisObjectType | TrellisObjectType[]): Promise<TrellisObject>`
- Use existing `repository.getObjects(false, scope, issueType)` method to query issues
- Apply `filterUnavailableObjects(objects, repository)` to get only available issues
- Apply `sortTrellisObjects(availableObjects)` to prioritize by HIGH > MEDIUM > LOW
- Return first available issue or throw descriptive error if none found

**Key Requirements**:

- Support optional `issueType` filtering (project, epic, feature, task) using existing repository interface
- Support optional `scope` filtering using existing repository interface
- Apply same availability rules as `claimTask`: status must allow selection and all prerequisites complete
- NO status changes - this is read-only discovery
- Comprehensive error handling with descriptive messages

**Dependencies**:

- Import and use `filterUnavailableObjects` from `src/utils/filterUnavailableObjects.ts`
- Import and use `sortTrellisObjects` from `src/utils/sortTrellisObjects.ts`
- Import types from existing type definitions

**Unit Tests** (`src/services/local/__tests__/getNextAvailableIssue.test.ts`):

- Test finding next available issue by priority
- Test issue type filtering (single type and array)
- Test scope filtering
- Test no available issues scenario with descriptive error
- Test prerequisite checking integration
- Test error handling for repository failures
- Mock repository and utility functions following existing patterns in `claimTask.test.ts`

**Acceptance Criteria**:

- Function returns highest priority available issue matching filters
- Supports all TrellisObjectType values (project, epic, feature, task)
- Works with both single type and array of types for filtering
- Throws clear error "No available issues found matching criteria" when none available
- All prerequisite and hierarchical checks applied correctly
- 100% unit test coverage
- Follows existing service patterns from `claimTask.ts`
