---
id: T-add-repository-method-to
title: Add repository method to query child objects
status: done
priority: high
prerequisites: []
affectedFiles:
  src/repositories/Repository.ts: Added getChildrenOf method signature to interface
  src/repositories/local/LocalRepository.ts: Added getChildrenOf method implementation using dynamic imports pattern
  src/repositories/local/getChildrenOf.ts: Created new implementation file
    following existing patterns with comprehensive filtering and error handling
  src/repositories/local/__tests__/getChildrenOf.test.ts:
    Added comprehensive test
    suite with 25 tests covering all functionality, edge cases, and performance
    requirements
  src/tools/__tests__/*.test.ts: Updated 21+ test files to include getChildrenOf mock method
  src/services/local/__tests__/*.test.ts: Updated test mocks to include getChildrenOf method
  src/utils/__tests__/*.test.ts: Updated MockRepository classes and inline mocks
    to include getChildrenOf method
  src/validation/__tests__/*.test.ts: Updated test mocks to include getChildrenOf method
log:
  - Successfully implemented getChildrenOf method to query child objects by
    parent ID. Enhanced Repository interface and LocalRepository implementation
    with comprehensive filtering by includeClosed parameter. Added robust error
    handling, performance optimizations, and extensive test coverage (25 tests)
    covering all scenarios including hierarchical relationships, closed object
    filtering, edge cases, and error conditions. Updated all test mocks across
    the codebase to maintain compatibility. All quality checks passed with 625
    total tests passing.
schema: v1.0
childrenIds: []
created: 2025-08-22T18:22:20.263Z
updated: 2025-08-22T18:22:20.263Z
---

# Add repository method to query child objects

## Context

Enhance the Repository interface and LocalRepository implementation to support querying child objects of a given parent ID. This capability is required for the auto-prune feature to validate that closed objects don't have open children before deletion.

## Implementation Requirements

### Repository Interface Enhancement

- Add new method signature to `src/repositories/Repository.ts`:
  ```typescript
  getChildrenOf(parentId: string, includeClosed?: boolean): Promise<TrellisObject[]>;
  ```

### LocalRepository Implementation

- Implement the new method in `src/repositories/local/LocalRepository.ts`
- Follow existing patterns used by `getObjects()` method
- Filter objects by parent relationship
- Support includeClosed parameter to optionally include closed children
- Use existing file system operations and object loading logic

### Alternative Approach (if simpler)

- Alternatively, enhance existing `getObjects()` method to accept a `parentId` filter parameter
- This may be simpler than adding a new method
- Assess which approach fits better with existing codebase patterns

## Technical Approach

1. Analyze existing `getObjects()` implementation in LocalRepository
2. Determine if new method or parameter enhancement is better approach
3. Implement the chosen approach following existing patterns
4. Ensure proper error handling and type safety
5. Add comprehensive unit tests for the new functionality

## Acceptance Criteria

- Can query all children of a specific parent object ID
- Supports filtering by includeClosed parameter
- Returns empty array when parent has no children
- Handles invalid parent IDs gracefully
- Performance is reasonable for typical object hierarchies
- Method signature follows repository interface patterns
- Unit tests cover all scenarios including edge cases

## Testing Requirements

Include unit tests in the same implementation:

- Test querying children of object with multiple children
- Test querying children of object with no children
- Test includeClosed parameter behavior
- Test with invalid/non-existent parent IDs
- Test with various object types and statuses
- Test performance with reasonable object counts

## Files to Modify

- `src/repositories/Repository.ts` - Add interface method
- `src/repositories/local/LocalRepository.ts` - Implement method
- Relevant test files for repository functionality

## Dependencies

None - this is an independent enhancement to repository functionality.

## Security Considerations

- Validate parentId parameter to prevent injection
- Ensure proper access control (if applicable)
- Handle malformed IDs safely
