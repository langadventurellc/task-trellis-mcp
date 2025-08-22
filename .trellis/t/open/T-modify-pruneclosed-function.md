---
id: T-modify-pruneclosed-function
title: Modify pruneClosed function for day-based pruning with child validation
status: open
priority: high
prerequisites:
  - T-add-repository-method-to
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-08-22T18:22:46.385Z
updated: 2025-08-22T18:22:46.385Z
---

# Modify pruneClosed function for day-based pruning with child validation

## Context

Update the existing pruneClosed function to work with days instead of minutes and add hierarchical validation to prevent deletion of closed objects that have open children. This is the core logic for the auto-prune feature.

## Implementation Requirements

### Time Calculation Update

- Change time calculation in `src/services/local/pruneClosed.ts:17` from minutes to days:
  ```typescript
  // OLD: const cutoffTime = new Date(Date.now() - age * 60 * 1000);
  // NEW: const cutoffTime = new Date(Date.now() - age * 24 * 60 * 60 * 1000);
  ```

### Hierarchical Child Validation

- Before deleting each object, check if it has open children
- Use the new repository method `getChildrenOf()` or enhanced `getObjects()`
- Apply `isOpen()` helper from `src/models/isOpen.ts` to check child status
- Only delete objects that have NO open children

### Enhanced Deletion Logic

Replace the simple deletion loop with:

1. Get all children of the candidate object
2. Check if any children return `isOpen() === true`
3. Skip deletion if open children found
4. Proceed with deletion only if no open children exist
5. Log skipped objects for transparency

### Error Handling Enhancement

- Handle errors when querying children gracefully
- Continue processing other objects if one child query fails
- Provide clear error messages for debugging

## Technical Approach

1. Import `isOpen` helper from models
2. Update time calculation for day-based logic
3. Add child validation logic before each deletion
4. Use new repository method to query children
5. Enhance logging to show skipped vs deleted objects
6. Add comprehensive unit tests for new logic

## Acceptance Criteria

- Age parameter now represents days instead of minutes
- Objects with open children are never deleted, regardless of their own status
- Objects with only closed children (or no children) can be deleted
- Nested hierarchies work correctly (grandparent → parent → child)
- Error handling prevents crashes when child queries fail
- Clear logging distinguishes between skipped and deleted objects
- All existing functionality remains unchanged for objects without children
- Unit tests validate all hierarchical scenarios

## Testing Requirements

Include unit tests in the same implementation:

- Test day-based age calculation (1 day, 7 days, 30 days)
- Test objects with no children (existing behavior)
- Test closed parent with open children (should be skipped)
- Test closed parent with closed children (should be deleted)
- Test multi-level hierarchies (grandparent → parent → child)
- Test mixed scenarios (some objects with children, some without)
- Test error handling when child queries fail

## Files to Modify

- `src/services/local/pruneClosed.ts` - Core implementation
- Unit test files for pruneClosed functionality

## Dependencies

- **Prerequisite**: T-add-repository-method-to (repository enhancement)
- **Uses**: `isOpen()` helper from existing models

## Security Considerations

- Ensure child validation cannot be bypassed
- Validate that hierarchical checks are thorough and accurate
- Prevent accidental deletion of objects with dependencies
