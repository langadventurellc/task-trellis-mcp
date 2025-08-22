---
id: T-add-repository-method-to
title: Add repository method to query child objects
status: open
priority: high
prerequisites: []
affectedFiles: {}
log: []
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
